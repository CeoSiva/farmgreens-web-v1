// GET /api/admin/gupshup/templates — fetch approved WhatsApp templates from Gupshup
import { NextRequest, NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/api-auth"

export async function GET(req: NextRequest) {
  const authError = await requireAdminAuth(req)
  if (authError) return authError

  // Template list uses GUPSHUP_USER_API_KEY (account-level), not the app-level sk_ key
  const userApiKey = process.env.GUPSHUP_USER_API_KEY
  const appName = process.env.GUPSHUP_APP_NAME

  if (!userApiKey || userApiKey === "your_gupshup_user_api_key_here") {
    return NextResponse.json({
      error: "GUPSHUP_USER_API_KEY is not configured.",
      hint: "Log in to Gupshup → click your profile/avatar (top right) → 'API Token' or 'Profile'. Copy that key and add it as GUPSHUP_USER_API_KEY in your .env.local. This is different from the app-level sk_ key."
    }, { status: 500 })
  }

  if (!appName) {
    return NextResponse.json({ error: "Missing GUPSHUP_APP_NAME" }, { status: 500 })
  }

  try {
    // Gupshup API to list templates for a specific app
    // Modern endpoint: https://api.gupshup.io/wa/app/{appId}/template
    const res = await fetch(
      `https://api.gupshup.io/wa/app/${encodeURIComponent(appName)}/template`,
      {
        headers: {
          apikey: userApiKey,
          accept: "application/json",
        },
      }
    )

    const text = await res.text()
    let data: any = {}
    try { data = JSON.parse(text) } catch { /* non-JSON */ }

    console.log("[Templates] Gupshup response:", JSON.stringify({ status: res.status, data }))

    if (res.status === 404) {
      return NextResponse.json({
        error: `Gupshup returned 404. The App Name "${appName}" was not found.`,
        hint: `Check GUPSHUP_APP_NAME in .env.local — it must exactly match the app name shown in your Gupshup dashboard (WhatsApp → My Apps).`
      }, { status: 404 })
    }

    if (res.status === 401) {
      return NextResponse.json({
        error: "Gupshup returned 401 (Unauthorized). The GUPSHUP_USER_API_KEY is invalid or expired.",
        hint: "Log in to Gupshup → profile → 'API Token'. Copy the latest token and update GUPSHUP_USER_API_KEY in .env.local."
      }, { status: 401 })
    }

    if (!res.ok) {
      return NextResponse.json({ error: `Gupshup API error: ${text}` }, { status: res.status })
    }

    // Normalize template list format
    // Gupshup responses can vary: { templates: [] }, { data: [] }, or just an array
    const templates = (data?.templates ?? data?.data ?? (Array.isArray(data) ? data : [])).map((t: any) => ({
      id: t.id ?? t.elementName ?? t.name,
      name: t.elementName ?? t.name,
      category: t.category,
      status: t.status,
      body: t.body ?? t.data ?? t.templateText,
      language: t.languageCode ?? t.language ?? "en",
      params: t.params ?? extractParams(t.body ?? t.data ?? t.templateText ?? ""),
    }))

    return NextResponse.json({ templates })
  } catch (err: any) {
    console.error("[Templates] Error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/** Count {{n}} style placeholders in a template body */
function extractParams(body: string): string[] {
  const matches = body.match(/\{\{\d+\}\}/g) ?? []
  const maxNum = matches.reduce((max, m) => {
    const n = parseInt(m.replace(/\D/g, ""))
    return Math.max(max, n)
  }, 0)
  return Array.from({ length: maxNum }, (_, i) => `{{${i + 1}}}`)
}
