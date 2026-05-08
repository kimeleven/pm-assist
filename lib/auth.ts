import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";

const COOKIE_NAME = "pm_token";

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET!);
}

export interface JwtPayload {
  userId: string;
  username: string;
  role: Role;
  companyId?: string | null;
}

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setCookieHeader(token: string) {
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;
}

export function clearCookieHeader() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}
