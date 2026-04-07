// POST /api/gupshup/webhook — public route, called by Gupshup for delivery events
import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import CampaignModel from "@/lib/models/campaign"
import CampaignRecipientModel from "@/lib/models/campaign-recipient"
import CustomerModel from "@/lib/models/customer"

const OPT_OUT_KEYWORDS = ["stop", "unsubscribe", "opt out", "optout"]

const resolveEventType = (payload: any): string =>
  String(payload?.type ?? payload?.payload?.type ?? "").toLowerCase().trim()

const resolveSourcePhone = (payload: any): string =>
  String(payload?.source ?? payload?.sender?.phone ?? payload?.payload?.source ?? "")

const resolveMessageIds = (payload: any): string[] => {
  const candidates = [
    payload?.gsId,
    payload?.payload?.gsId,
    payload?.id,
    payload?.payload?.id,
  ]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean)

  return Array.from(new Set(candidates))
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Log all incoming webhook events for debugging
    console.log("[Webhook] Received:", JSON.stringify(body))

    // Gupshup wraps events differently depending on the event type:
    // - Delivery events: body.payload.id, body.payload.type
    // - Message events: body.payload.payload.id, body.payload.type
    const payload = body?.payload ?? body
    const eventType = resolveEventType(payload)
    const messageIds = resolveMessageIds(payload)
    const source = resolveSourcePhone(payload)

    // Optional shared-secret guard (recommended in production).
    // If env var is not configured, this check is skipped for compatibility.
    const expectedToken = process.env.GUPSHUP_WEBHOOK_TOKEN
    if (expectedToken) {
      const providedToken =
        req.headers.get("x-webhook-token") ??
        req.headers.get("x-gupshup-token") ??
        req.nextUrl.searchParams.get("token") ??
        ""

      if (providedToken !== expectedToken) {
        console.warn("[Webhook] Unauthorized token.", {
          eventType,
          messageIds,
        })
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
    }

    // 8C. Handle opt-out reply text
    if (eventType === "text" || payload?.payload?.type === "text") {
      const text = (payload?.payload?.text ?? payload?.text ?? "").toLowerCase().trim()
      if (OPT_OUT_KEYWORDS.includes(text)) {
        const digits = source.replace(/\D/g, "")
        const mobile = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits

        await connectDB()
        await CustomerModel.findOneAndUpdate(
          { mobile },
          { whatsappOptIn: false, optedOutAt: new Date() }
        )
        console.log(`[Opt-out] Customer ${mobile} unsubscribed via reply.`)
        return NextResponse.json({ ok: true }, { status: 200 })
      }
    }

    if (!eventType || messageIds.length === 0) {
      console.log("[Webhook] Missing eventType/messageIds, ignoring.", {
        eventType,
        messageIds,
      })
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    await connectDB()

    let recipient = null
    let matchedBy = ""

    for (const id of messageIds) {
      recipient = await CampaignRecipientModel.findOne({ gupshupMessageId: id })
      if (recipient) {
        matchedBy = id
        break
      }
    }

    if (!recipient) {
      console.log("[Webhook] No campaign recipient found.", {
        eventType,
        messageIds,
      })
      return NextResponse.json({ ok: true }, { status: 200 })
    }

    console.log("[Webhook] Matched recipient.", {
      eventType,
      matchedBy,
      recipientId: recipient._id.toString(),
      campaignId: recipient.campaignId.toString(),
      currentStatus: recipient.status,
    })

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
          errorMessage: payload?.payload?.reason ?? payload?.reason ?? "Unknown error",
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
