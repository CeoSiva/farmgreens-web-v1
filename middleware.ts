import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;

  if (!token) {
    // If there is no token, redirect to login page
    return NextResponse.redirect(new URL("/fmg-login", request.url));
  }

  try {
    // Verify the JWT token using jose
    await verifyToken(token);
    // Token is valid, let the request proceed
    return NextResponse.next();
  } catch (error) {
    // Token is invalid/expired, clear the cookie and redirect to login
    const response = NextResponse.redirect(new URL("/fmg-login", request.url));
    response.cookies.delete("auth_token");
    return response;
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths that start with /fmg-admin
     */
    "/fmg-admin/:path*",
  ],
};
