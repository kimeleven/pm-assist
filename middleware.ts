import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET!);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("pm_token")?.value;
  let payload: { role?: string } | null = null;

  if (token) {
    try {
      const { payload: p } = await jwtVerify(token, getSecret());
      payload = p as { role?: string };
    } catch {
      payload = null;
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!payload || payload.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname.startsWith("/company")) {
    if (!payload || payload.role !== "COMPANY") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname === "/login" && payload) {
    const dest = payload.role === "ADMIN" ? "/admin/dashboard" : "/company/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/company/:path*", "/login"],
};
