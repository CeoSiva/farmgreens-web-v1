import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import CustomerModel from "@/lib/models/customer"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const phone = searchParams.get("phone")?.trim()

  if (!phone) {
    return new Response(
      "<html><body style='font-family:sans-serif;text-align:center;padding:4rem'>" +
        "<h2>Invalid Request</h2><p>No phone number provided.</p>" +
        "</body></html>",
      { status: 400, headers: { "Content-Type": "text/html" } }
    )
  }

  // Normalise number — strip country code
  const digits = phone.replace(/\D/g, "")
  const mobile = digits.startsWith("91") && digits.length === 12
    ? digits.slice(2)
    : digits

  try {
    await connectDB()
    await CustomerModel.findOneAndUpdate(
      { mobile },
      { $set: { whatsappOptIn: false, optedOutAt: new Date() } }
    )
    console.log(`[Opt-out] Customer ${mobile} unsubscribed via link.`)
  } catch (err) {
    console.error("[Opt-out] DB error:", err)
  }

  return new Response(
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Unsubscribed – FarmGreens</title>
  <style>
    body { font-family: sans-serif; display: flex; flex-direction: column;
           align-items: center; justify-content: center; min-height: 100vh;
           margin: 0; background: #f9fafb; color: #374151; text-align: center; }
    .card { background: white; border-radius: 1rem; padding: 3rem 2rem;
            box-shadow: 0 4px 24px rgba(0,0,0,.08); max-width: 400px; }
    h1 { color: #16a34a; }
  </style>
</head>
<body>
  <div class="card">
    <h1>✅ Unsubscribed</h1>
    <p>You have been successfully unsubscribed from WhatsApp messages from <strong>FarmGreens</strong>.</p>
    <p style="color:#6b7280;font-size:0.9rem">You can re-subscribe anytime during checkout.</p>
  </div>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html" } }
  )
}
