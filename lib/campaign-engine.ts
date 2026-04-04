/**
 * Campaign Engine
 * Handles executing campaigns in batches with rate limiting,
 * respecting paused/stopped signals, and tracking delivery stats.
 */

import { connectDB } from "@/lib/db"
import CampaignModel from "@/lib/models/campaign"
import CampaignRecipientModel from "@/lib/models/campaign-recipient"
import CustomerModel from "@/lib/models/customer"
import OrderModel from "@/lib/models/order"
import DistrictModel from "@/lib/models/district"
import { sendCampaignWhatsApp, buildCustomerFilter, TargetFilter } from "@/lib/gupshup-campaign"

const BATCH_SIZE = 50
const DELAY_MS = 250

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── Fetch customers matching a campaign's target filter ─────────────────────

async function fetchTargetCustomers(targetFilter: TargetFilter) {
  const filter = buildCustomerFilter(targetFilter) as any

  // Handle city filter — look up district by name, then query customers by districtId
  if (filter._cityFilter !== undefined) {
    const cityName: string = filter._cityFilter
    delete filter._cityFilter

    const district = await DistrictModel.findOne({
      name: { $regex: new RegExp(`^${cityName}$`, "i") },
    })

    if (district) {
      filter["addresses.districtId"] = district._id
    } else {
      console.warn(`[Campaign] City "${cityName}" not found in districts. Returning all opted-in.`)
    }
  }

  // Handle high_value filter — aggregate orders to find customers who spent >= threshold
  if (filter._highValueFilter !== undefined) {
    const minSpend: number = filter._highValueFilter
    delete filter._highValueFilter

    const highValueCustomerIds = await OrderModel.aggregate([
      {
        $group: {
          _id: "$customer.customerId",
          totalSpent: { $sum: "$total" },
        },
      },
      { $match: { totalSpent: { $gte: minSpend }, _id: { $ne: null } } },
      { $project: { _id: 1 } },
    ])

    const ids = highValueCustomerIds.map((r: any) => r._id)
    filter._id = { $in: ids }
  }

  return CustomerModel.find(filter)
    .select("_id name mobile countryCode whatsappOptIn")
    .lean()
}

// ─── Main Campaign Execution ──────────────────────────────────────────────────

export async function executeCampaign(campaignId: string): Promise<void> {
  await connectDB()

  // 1. Fetch campaign
  const campaign = await CampaignModel.findById(campaignId)
  if (!campaign || campaign.status === "stopped") return

  // 2. Mark running
  campaign.status = "running"
  campaign.startedAt = campaign.startedAt ?? new Date()
  await campaign.save()

  // 3. Fetch target customers
  const customers = await fetchTargetCustomers(campaign.targetFilter as TargetFilter)

  // 4. Update total recipients
  campaign.totalRecipients = customers.length
  await campaign.save()

  // 5. Bulk insert recipients as pending (skip existing duplicates)
  if (customers.length > 0) {
    const recipientDocs = customers.map((c: any) => ({
      campaignId: campaign._id,
      customerId: c._id,
      phone: `${c.countryCode?.replace("+", "") ?? "91"}${c.mobile}`,
      customerName: c.name,
      status: "pending",
    }))

    try {
      await CampaignRecipientModel.insertMany(recipientDocs, { ordered: false })
    } catch (err: any) {
      // BulkWriteError with code 11000 = duplicate key — safe to ignore
      if (err?.code !== 11000 && !err?.writeErrors?.every((e: any) => e.code === 11000)) {
        console.error("[Campaign] insertMany error:", err)
      }
    }
  }

  // 6. Process in batches
  for (let i = 0; i < customers.length; i += BATCH_SIZE) {
    // Re-check campaign status before each batch
    const fresh = await CampaignModel.findById(campaignId).select("status")
    if (!fresh || fresh.status === "stopped" || fresh.status === "paused") break

    const batch = customers.slice(i, i + BATCH_SIZE)

    for (const customer of batch as any[]) {
      await sleep(DELAY_MS)

      // 8A. Safety: Re-verify opt-in before sending
      const freshCustomer = await CustomerModel.findById(customer._id).select("whatsappOptIn")
      if (!freshCustomer?.whatsappOptIn) {
        console.log(`[Campaign] Skipping ${customer.mobile} — opted out.`)
        continue
      }

      // 8D. Duplicate send guard — skip already sent recipients
      const existing = await CampaignRecipientModel.findOne({
        campaignId: campaign._id,
        customerId: customer._id,
        status: { $in: ["sent", "delivered", "read"] },
      })
      if (existing) {
        console.log(`[Campaign] Skipping ${customer.mobile} — already sent.`)
        continue
      }

      // Build params, replacing {{customerName}} with actual name
      const params = campaign.templateParams.map((p: string) =>
        p.replace(/\{\{customerName\}\}/g, customer.name)
      )

      const phone = `${customer.countryCode?.replace("+", "") ?? "91"}${customer.mobile}`

      if (!campaign.templateId) {
        throw new Error("[Campaign] No templateId defined for this campaign.")
      }

      try {
        // Detailed log for debugging template ID issue
        console.log(`[Campaign] Sending to ${phone} using templateId: ${campaign.templateId}`)

        const result = await sendCampaignWhatsApp({
          phone,
          templateId: campaign.templateId,
          params,
        })

        await CampaignRecipientModel.findOneAndUpdate(
          { campaignId: campaign._id, customerId: customer._id },
          { status: "sent", gupshupMessageId: result.messageId, sentAt: new Date() }
        )
        await CampaignModel.findByIdAndUpdate(campaignId, { $inc: { sentCount: 1 } })
      } catch (err: any) {
        console.error(`[Campaign] Failed to send to ${phone}:`, err.message)
        await CampaignRecipientModel.findOneAndUpdate(
          { campaignId: campaign._id, customerId: customer._id },
          { status: "failed", errorMessage: err.message }
        )
        await CampaignModel.findByIdAndUpdate(campaignId, { $inc: { failedCount: 1 } })
      }
    }
  }

  // 8. Mark completed if still running
  const finalStatus = await CampaignModel.findById(campaignId).select("status")
  if (finalStatus?.status === "running") {
    await CampaignModel.findByIdAndUpdate(campaignId, {
      status: "completed",
      completedAt: new Date(),
    })
  }
}

// ─── Scheduler — called by cron every minute ──────────────────────────────────

export async function checkAndRunScheduledCampaigns(): Promise<void> {
  await connectDB()

  const due = await CampaignModel.find({
    status: "scheduled",
    scheduledAt: { $lte: new Date() },
  })

  console.log(`[Cron] ${due.length} scheduled campaign(s) triggered.`)

  for (const campaign of due) {
    // Fire and forget — don't await
    executeCampaign(campaign._id.toString()).catch((err) =>
      console.error(`[Cron] executeCampaign failed for ${campaign._id}:`, err)
    )
  }
}
