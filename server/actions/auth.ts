"use server";

import { cookies } from "next/headers";
import { scryptSync, timingSafeEqual } from "crypto";
import { LoginSchema, LoginFormValues } from "@/lib/schemas/auth";
import { getUserByMobile } from "@/lib/data/user";
import { signToken } from "@/lib/jwt";

export async function loginUserAction(formData: LoginFormValues) {
  try {
    // 1. Validate Input
    const parsed = LoginSchema.safeParse(formData);
    if (!parsed.success) {
      return { error: "Invalid input data" };
    }

    const { mobile, countryCode, password } = parsed.data;

    // 2. Fetch User
    const user = await getUserByMobile(mobile);
    if (!user) {
      return { error: "Invalid mobile number or password" };
    }

    // Check if country code matches
    if (user.countryCode !== countryCode) {
      return { error: "Invalid mobile number or password" };
    }

    // 3. Verify Password using Node.js Crypto (scrypt)
    // Assuming password in DB is stored as "salt:hash"
    if (!user.password || !user.password.includes(":")) {
      return { error: "Invalid account configuration. Please reset password." };
    }

    const [salt, key] = user.password.split(":");
    const hashedBuffer = scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, "hex");
    const match = timingSafeEqual(hashedBuffer, keyBuffer);

    if (!match) {
      return { error: "Invalid mobile number or password" };
    }

    // 4. Generate JWT
    const token = await signToken({
      sub: user._id.toString(),
      mobile: user.mobile,
      countryCode: user.countryCode,
    });

    // 5. Set HttpOnly Cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return { success: true };
  } catch (error) {
    console.error("Login Action Error:", error);
    return { error: "An unexpected error occurred during login." };
  }
}

export async function logoutUserAction() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  return { success: true };
}
