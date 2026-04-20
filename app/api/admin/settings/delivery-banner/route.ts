import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { getSystemSetting, updateSystemSetting } from "@/lib/data/system-setting";
import { revalidatePath } from "next/cache";

const SETTING_KEY = "delivery_banner_message";

/**
 * Ensures the request is from an authenticated admin.
 */
async function authenticateAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  try {
    return await verifyToken(token);
  } catch (err) {
    return null;
  }
}

/**
 * GET current delivery banner message.
 */
export async function GET() {
  try {
    const message = await getSystemSetting(SETTING_KEY);
    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch setting" }, { status: 500 });
  }
}

/**
 * PATCH update delivery banner message.
 */
export async function PATCH(request: NextRequest) {
  const admin = await authenticateAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { message } = await request.json();

    // Validation: max length 200 chars
    if (typeof message !== "string") {
      return NextResponse.json({ error: "Message must be a string" }, { status: 400 });
    }
    if (message.length > 200) {
      return NextResponse.json({ error: "Message exceeds max length of 200 characters" }, { status: 400 });
    }

    await updateSystemSetting(SETTING_KEY, message);

    // Global revalidation
    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating delivery banner:", error);
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}
