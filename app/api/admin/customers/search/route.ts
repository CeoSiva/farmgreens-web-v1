// GET /api/admin/customers/search — search customers for manual campaign targeting
import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import CustomerModel from "@/lib/models/customer"
import { requireAdminAuth } from "@/lib/api-auth"

export async function GET(req: NextRequest) {
  const authError = await requireAdminAuth(req)
  if (authError) return authError

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim() ?? ""
  const optedOnly = searchParams.get("optedOnly") !== "false" // default: only opted-in

  await connectDB()

  const base: any = {}
  if (optedOnly) base.whatsappOptIn = true
  if (q) {
    base.$or = [
      { name: { $regex: q, $options: "i" } },
      { mobile: { $regex: q, $options: "i" } },
    ]
  }

  const customers = await CustomerModel.find(base)
    .select("_id name mobile whatsappOptIn")
    .limit(50)
    .lean()

  return NextResponse.json({ customers })
}
