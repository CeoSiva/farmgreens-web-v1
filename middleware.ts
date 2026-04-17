import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/jwt";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Handle Admin Authentication
  if (pathname.startsWith("/fmg-admin")) {
    const token = request.cookies.get("auth_token")?.value;
    if (!token) return NextResponse.redirect(new URL("/fmg-login", request.url));
    try {
      await verifyToken(token);
    } catch (err) {
      const response = NextResponse.redirect(new URL("/fmg-login", request.url));
      response.cookies.delete("auth_token");
      return response;
    }
  }

  // 2. Handle District Routing (e.g., /chennai -> /?district=chennai)
  const parts = pathname.split('/').filter(Boolean);
  const reservedPaths = [
    "fmg-admin",
    "fmg-login",
    "api",
    "assets",
    "images",
    "shop",
    "product",
    "cart",
    "checkout",
    "order-confirmed",
    "about",
    "terms",
    "privacy",
    "shipping",
    "returns",
    "combo",
    "_next"
  ];
  
  // If the first path segment is NOT reserved, treat it as a district slug
  if (parts.length > 0 && !reservedPaths.includes(parts[0])) {
    const districtSlug = parts[0];
    const restOfPath = parts.slice(1).join('/'); 
    
    // Rewrite URL to original destination but with district query parameter
    const url = request.nextUrl.clone();
    url.pathname = `/${restOfPath}`;
    url.searchParams.set('district', districtSlug);
    
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
