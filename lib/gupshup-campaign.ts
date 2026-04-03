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

  const templatePayload = { id: templateId, params }

  const body = new URLSearchParams({
    source: sourceNumber,
    destination,
    "src.name": appName,
    template: JSON.stringify(templatePayload),
  })

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

  console.log("[Campaign]", JSON.stringify({ destination, status: res.status, data }))

  if (!res.ok || data?.status === "error") {
    throw new Error(
      `[Campaign] Failed to send. Status: ${res.status}. Response: ${text}`
    )
  }

  return { messageId: data.messageId ?? data.message?.id ?? "", status: data.status ?? "submitted" }
}

// ─── Audience Targeting Filter ────────────────────────────────────────────────

export type TargetFilter = {
  type: "all" | "new_customers" | "high_value" | "city"
  minSpend?: number
  city?: string
  daysSinceJoined?: number
}

export function buildCustomerFilter(targetFilter: TargetFilter): object {
  const base: Record<string, unknown> = { whatsappOptIn: true }

  switch (targetFilter.type) {
    case "all":
      return base

    case "new_customers": {
      const days = targetFilter.daysSinceJoined ?? 30
      const since = new Date()
      since.setDate(since.getDate() - days)
      return { ...base, createdAt: { $gte: since } }
    }

    case "high_value":
      // Assumes a `totalSpent` field on Customer (or use order aggregation).
      // Falls back to returning all opted-in customers if field not present.
      return { ...base, totalSpent: { $gte: targetFilter.minSpend ?? 0 } }

    case "city":
      // Match districtName stored in the customer's default address.
      // We do a case-insensitive match on the `addresses.districtName` field,
      // but since districtName is not denormalized we return a signal object
      // that campaign-engine.ts can interpret to do an aggregation lookup.
      return { ...base, "_cityFilter": targetFilter.city }

    default:
      return base
  }
}
