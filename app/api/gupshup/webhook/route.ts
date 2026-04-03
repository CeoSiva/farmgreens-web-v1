// POST /api/gupshup/webhook — public route, called by Gupshup for delivery events
import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import CampaignModel from "@/lib/models/campaign"
import CampaignRecipientModel from "@/lib/models/campaign-recipient"
import CustomerModel from "@/lib/models/customer"

const OPT_OUT_KEYWORDS = ["stop", "unsubscribe", "opt out", "optout"]

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // 8C. Handle opt-out reply text
    if (body?.payload?.type === "text") {
      const text = (body?.payload?.payload?.text ?? "").toLowerCase().trim()
      if (OPT_OUT_KEYWORDS.includes(text)) {
        const rawPhone: string = body?.payload?.source ?? ""
        const digits = rawPhone.replace(/\D/g, "")
        const mobile = digits.startsWith("91") && digits.length === 12
          ? digits.slice(2) : digits

        await connectDB()
        await CustomerModel.findOneAndUpdate(
          { mobile },
          { whatsappOptIn: false, optedOutAt: new Date() }
        )
        console.log(`[Opt-out] Customer ${mobile} unsubscribed via reply.`)
        return NextResponse.json({ ok: true }, { status: 200 })
      }
    }

    const messageId: string | undefined = body?.payload?.id
    const eventType: string | undefined = body?.payload?.type

    if (!messageId || !eventType) {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    await connectDB()

    const recipient = await CampaignRecipientModel.findOne({ gupshupMessageId: messageId })
    if (!recipient) {
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    const currentStatus = recipient.status

    if (eventType === "delivered") {
      if (["sent"].includes(currentStatus)) {
        await CampaignRecipientModel.findByIdAndUpdate(recipient._id, {
          status: "delivered",
          deliveredAt: new Date(),
        })
        await CampaignModel.findByIdAndUpdate(recipient.campaignId, {
          $inc: { deliveredCount: 1 },
        })
      }
    } else if (eventType === "read") {
      if (currentStatus !== "read") {
        await CampaignRecipientModel.findByIdAndUpdate(recipient._id, {
          status: "read",
          readAt: new Date(),
        })
        await CampaignModel.findByIdAndUpdate(recipient.campaignId, {
          $inc: { readCount: 1 },
        })
      }
    } else if (eventType === "failed") {
      if (["sent", "delivered"].includes(currentStatus)) {
        await CampaignRecipientModel.findByIdAndUpdate(recipient._id, {
          status: "failed",
          errorMessage: body?.payload?.reason ?? "Unknown error",
        })
        await CampaignModel.findByIdAndUpdate(recipient.campaignId, {
          $inc: { failedCount: 1 },
        })
      }
    }
    // "enqueued" and "sent" events: no DB change needed

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error("[Webhook] Error:", err)
    return NextResponse.json({ ok: true }, { status: 200 }) // always 200
  }
}
