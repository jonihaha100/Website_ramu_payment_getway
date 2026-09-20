import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Allow public admin login endpoints
  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  // 2. Protect all other /admin/* pages and /api/admin/* endpoints
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const cookieToken = req.cookies.get("admin_token")?.value;
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7).trim() : null;

    const token = cookieToken || bearerToken;
    const { valid } = await verifyAdminToken(token);

    if (!valid) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json(
          { error: "Unauthorized: Akses ditolak. Sesi admin tidak valid." },
          { status: 401 }
        );
      }

      // Redirect browser request to login page
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
