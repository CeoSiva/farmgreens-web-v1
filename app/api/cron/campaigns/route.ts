// GET /api/cron/campaigns — called by Vercel cron every minute
import { NextRequest, NextResponse } from "next/server"
import { checkAndRunScheduledCampaigns } from "@/lib/campaign-engine"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await checkAndRunScheduledCampaigns()

  return NextResponse.json({ ok: true, timestamp: new Date().toISOString() })
}
