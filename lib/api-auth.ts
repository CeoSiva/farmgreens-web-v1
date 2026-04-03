/**
 * Shared admin auth helper for API routes.
 * Reads the JWT cookie `auth_token` and verifies it.
 */
import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/jwt"

export async function requireAdminAuth(
  req: NextRequest
): Promise<null | NextResponse> {
  const token = req.cookies.get("auth_token")?.value
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    await verifyToken(token)
    return null // ok
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
