// GET /api/admin/gupshup/templates — fetch approved WhatsApp templates from Gupshup
import { NextRequest, NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/api-auth"

export async function GET(req: NextRequest) {
  const authError = await requireAdminAuth(req)
  if (authError) return authError

  const apiKey = process.env.GUPSHUP_API_KEY
  // GUPSHUP_APP_ID is the internal UUID of your Gupshup app.
  // Find it in Gupshup dashboard: WhatsApp → My Apps → click your app → look at the URL or App Settings.
  // It looks like: a1b2c3d4-1234-5678-abcd-xxxxxxxxxxxx
  const appId = process.env.GUPSHUP_APP_ID

  if (!apiKey) {
    return NextResponse.json({ error: "GUPSHUP_API_KEY is not configured." }, { status: 500 })
  }

  if (!appId || appId === "your_gupshup_app_uuid_here") {
    return NextResponse.json({
      error: "GUPSHUP_APP_ID is not configured.",
      hint: "To find your App ID: log into Gupshup → WhatsApp → My Apps → click on your app → look at the URL or App Settings page. It is a UUID like 'a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx'. Add it as GUPSHUP_APP_ID in your .env.local",
    }, { status: 500 })
  }

  try {
    const url = `https://api.gupshup.io/wa/app/${encodeURIComponent(appId)}/template?templateStatus=APPROVED&pageSize=100`
    console.log("[Templates] Fetching from:", url)

    const res = await fetch(url, {
      headers: {
        apikey: apiKey,
        accept: "application/json",
      },
    })

    const text = await res.text()
    let data: any = {}
    try { data = JSON.parse(text) } catch { /* non-JSON */ }

    console.log("[Templates] Gupshup response:", JSON.stringify({ status: res.status, responseKeys: Object.keys(data) }))

    if (res.status === 401) {
      return NextResponse.json({
        error: "Gupshup returned 401 (Unauthorized). Your GUPSHUP_API_KEY may have expired or is incorrect.",
        hint: "Go to your Gupshup dashboard → WhatsApp → Settings → API Key and copy the latest key. Update GUPSHUP_API_KEY in .env.local.",
      }, { status: 401 })
    }

    if (res.status === 404) {
      return NextResponse.json({
        error: `Gupshup returned 404. App ID "${appId}" was not found.`,
        hint: "Check GUPSHUP_APP_ID in .env.local — it must be the UUID shown in your Gupshup app settings (not the app name).",
      }, { status: 404 })
    }

    if (!res.ok) {
      return NextResponse.json({ error: `Gupshup API error (${res.status}): ${text}` }, { status: res.status })
    }

    // Normalize — Gupshup can return { templates: [] } or { data: [] } or a plain array
    const rawList: any[] = data?.templates ?? data?.data ?? (Array.isArray(data) ? data : [])

    const templates = rawList.map((t: any) => ({
      id: t.id ?? t.elementName ?? t.name ?? "",
      name: t.elementName ?? t.name ?? t.id ?? "",
      category: t.category ?? t.templateCategory ?? "",
      status: t.status ?? t.templateStatus ?? "",
      body: t.body ?? t.data ?? t.templateText ?? t.components?.find((c: any) => c.type === "BODY")?.text ?? "",
      language: t.languageCode ?? t.language ?? "en",
      params: extractParams(
        t.body ?? t.data ?? t.templateText ?? t.components?.find((c: any) => c.type === "BODY")?.text ?? ""
      ),
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
