/**
 * Gupshup Campaign Utility
 * Use this for MARKETING campaigns — do NOT modify lib/gupshup.ts (order confirmations)
 */

// ─── Phone Normalisation ─────────────────────────────────────────────────────

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("91") && digits.length === 12) return digits
  if (digits.length === 10) return `91${digits}`
  return digits
}

// ─── Send a Campaign Template Message ────────────────────────────────────────

export async function sendCampaignWhatsApp({
  phone,
  templateId,
  params,
}: {
  phone: string
  templateId: string
  params: string[]
}): Promise<{ messageId: string; status: string }> {
  const apiKey = process.env.GUPSHUP_API_KEY
  const appName = process.env.GUPSHUP_APP_NAME
  const sourceNumber = process.env.GUPSHUP_SOURCE_NUMBER

  if (!apiKey || !appName || !sourceNumber) {
    throw new Error("[Campaign] Missing GUPSHUP_API_KEY / GUPSHUP_APP_NAME / GUPSHUP_SOURCE_NUMBER")
  }

  const destination = normalizePhone(phone)

  // Only include params in payload if the template actually has variables.
  // Gupshup returns #132012 if you send params: [] for a no-variable template.
  const templatePayload: { id: string; params?: string[] } = { id: templateId }
  if (params && params.length > 0) {
    templatePayload.params = params
  }

  const body = new URLSearchParams({
    source: sourceNumber,
    destination,
    template: JSON.stringify(templatePayload),
  })

  // Log full request payload for debugging
  console.log("[Campaign] Sending with payload:", JSON.stringify({
    source: sourceNumber,
    destination,
    templatePayload,
  }))

  const res = await fetch("https://api.gupshup.io/wa/api/v1/template/msg", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      apikey: apiKey,
    },
    body: body.toString(),
  })

  const text = await res.text()
  let data: any = {}
  try { data = JSON.parse(text) } catch { /* non-JSON response */ }

  // Log full response for debugging
  console.log("[Campaign] Send response:", JSON.stringify({
    destination,
    templateId,
    httpStatus: res.status,
    data,
  }))

  if (!res.ok || data?.status === "error") {
    throw new Error(
      `[Campaign] Send failed. HTTP ${res.status}. templateId=${templateId}. Response: ${text}`
    )
  }

  // Gupshup can return messageId in different locations depending on API version
  const messageId =
    data?.messageId ??
    data?.message?.id ??
    data?.response?.messageId ??
    ""

  if (!messageId) {
    console.warn("[Campaign] Warning: empty messageId in Gupshup response. Webhook tracking will not work.", JSON.stringify(data))
  }

  return { messageId, status: data.status ?? "submitted" }
}

// ─── Audience Targeting Filter ────────────────────────────────────────────────

export type TargetFilter = {
  type: "combined" | "manual"
  districts?: string[]
  minSpend?: number
  daysSinceJoined?: number
  customerIds?: string[] // for manual selection
}

export function buildCustomerFilter(targetFilter: TargetFilter): object {
  const base: Record<string, unknown> = { whatsappOptIn: true }

  if (targetFilter.type === "manual") {
    if (targetFilter.customerIds && targetFilter.customerIds.length > 0) {
      const { Types } = require("mongoose")
      return { ...base, _id: { $in: targetFilter.customerIds.map((id: string) => new Types.ObjectId(id)) } }
    }
    return base
  }

  if (targetFilter.daysSinceJoined !== undefined && targetFilter.daysSinceJoined > 0) {
    const since = new Date()
    since.setDate(since.getDate() - targetFilter.daysSinceJoined)
    base.createdAt = { $gte: since }
  }

  if (targetFilter.minSpend !== undefined && targetFilter.minSpend > 0) {
    base._highValueFilter = targetFilter.minSpend
  }

  if (targetFilter.districts && targetFilter.districts.length > 0) {
    base._cityFilter = targetFilter.districts
  }

  return base
}
