import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("pm_token")?.value;
  const payload = token ? verifyToken(token) : null;

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
