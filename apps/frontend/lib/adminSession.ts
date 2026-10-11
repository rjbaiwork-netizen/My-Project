import "server-only";
import { randomBytes } from "node:crypto";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "my_project_admin_session";
const SESSION_SECONDS = 24 * 60 * 60;

export function createAdminSession() {
  return { value: randomBytes(32).toString("hex"), maxAge: SESSION_SECONDS };
}

export function getAdminSessionToken(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}

export async function verifyAdminSession(request: NextRequest): Promise<boolean> {
  const token = getAdminSessionToken(request);
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const serviceToken = process.env.ADMIN_API_TOKEN;
  if (!token || !base || !serviceToken) return false;
  try {
    const response = await fetch(`${base}/api/telegram-auth/session/verify`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return false;
    const result = await response.json() as { authenticated?: boolean };
    return result.authenticated === true;
  } catch {
    return false;
  }
}

export function adminCookie(value: string, maxAge = SESSION_SECONDS) {
  return { name: COOKIE_NAME, value, httpOnly: true, secure: true, sameSite: "strict" as const, path: "/", maxAge };
}

export function clearAdminCookie() {
  return { name: COOKIE_NAME, value: "", httpOnly: true, secure: true, sameSite: "strict" as const, path: "/", maxAge: 0 };
}

export function sameOrigin(request: NextRequest) {
  const rawOrigin = request.headers.get("origin");
  if (!rawOrigin) return false;
  let origin: URL;
  try { origin = new URL(rawOrigin); } catch { return false; }
  if (rawOrigin !== origin.origin) return false;
  if (origin.origin === request.nextUrl.origin) return true;
  const firstHeader = (name: string) => request.headers.get(name)?.split(",")[0]?.trim();
  const host = firstHeader("x-forwarded-host") ?? firstHeader("host");
  const protocol = (firstHeader("x-forwarded-proto") ?? request.nextUrl.protocol.replace(/:$/, "")).toLowerCase();
  return Boolean(host && protocol && origin.host.toLowerCase() === host.toLowerCase() && origin.protocol === `${protocol}:`);
}
