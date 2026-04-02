/**
 * Gupshup WhatsApp Notification Utility
 * Server-side only — never import from client components.
 */

interface OrderConfirmationParams {
  customerName: string
  customerPhone: string // 10-digit or already prefixed with country code
  orderId: string
  items: Array<{ name: string; qty: number; price: number; unit?: string }>
  subtotal: number
  discount?: number
  shipping?: number
  totalPaid: number
}

/**
 * Normalizes the phone number to the E.164-style format required by Gupshup
 * (no `+` sign, with the 91 country code prefix for India).
 */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  if (digits.startsWith("91") && digits.length === 12) return digits
  if (digits.length === 10) return `91${digits}`
  return digits
}

/**
 * Sends a WhatsApp order confirmation message via Gupshup API.
 * Throws an error if the Gupshup API returns an error response.
 */
export async function sendOrderConfirmationWhatsApp(
  params: OrderConfirmationParams
): Promise<void> {
  const apiKey = process.env.GUPSHUP_API_KEY
  const appName = process.env.GUPSHUP_APP_NAME
  const sourceNumber = process.env.GUPSHUP_SOURCE_NUMBER
  const templateId = process.env.GUPSHUP_TEMPLATE_ID

  if (!apiKey || !appName || !sourceNumber || !templateId) {
    throw new Error(
      "[Gupshup] Missing required environment variables: " +
        "GUPSHUP_API_KEY, GUPSHUP_APP_NAME, GUPSHUP_SOURCE_NUMBER, GUPSHUP_TEMPLATE_ID"
    )
  }

  const destination = normalizePhone(params.customerPhone)

  // Build the items list string: "• Spinach x250g\n• Tomato x2"
  const itemsList = params.items
    .map((it) => {
      const unit = it.unit?.toLowerCase()
      const isWeight = unit === "kg"
      const qtyDisplay = isWeight ? `${it.qty * 1000}g` : `x${it.qty}`
      return `• ${it.name} ${qtyDisplay}`
    })
    .join("\n")

  // Build the price breakdown string
  const priceLines: string[] = [`Subtotal: ₹${params.subtotal.toFixed(2)}`]
  if (params.discount && params.discount > 0) {
    priceLines.push(`Discount: -₹${params.discount.toFixed(2)}`)
  }
  if (params.shipping !== undefined) {
    priceLines.push(
      params.shipping === 0
        ? "Delivery: Free"
        : `Delivery: ₹${params.shipping.toFixed(2)}`
    )
  }
  const priceBreakdown = priceLines.join("\n")

  const totalPaid = `₹${params.totalPaid.toFixed(2)}`

  const messagePayload = {
    id: templateId,
    params: [
      params.customerName,
      params.orderId,
      itemsList,
      priceBreakdown,
      totalPaid,
    ],
  }

  const body = new URLSearchParams({
    channel: "whatsapp",
    source: sourceNumber,
    destination,
    "src.name": appName,
    disablePreview: "false",
    message: JSON.stringify(messagePayload),
  })

  const response = await fetch("https://api.gupshup.io/wa/api/v1/msg", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      apikey: apiKey,
    },
    body: body.toString(),
  })

  const responseText = await response.text()
  let json: any = null
  try {
    json = JSON.parse(responseText)
  } catch (e) {
    // Response was not JSON
  }

  console.log(`[Gupshup API Response]:`, {
    status: response.status,
    statusText: response.statusText,
    data: json || responseText,
  })

  if (!response.ok || json?.status === "error") {
    throw new Error(
      `[Gupshup] Failed to send WhatsApp message. Status: ${response.status}. ` +
        `Response: ${responseText}`
    )
  }
}
