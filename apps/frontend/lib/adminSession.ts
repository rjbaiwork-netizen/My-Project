import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "my_project_admin_session";
const SESSION_SECONDS = 8 * 60 * 60;

function secret() {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  return value;
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createAdminSession() {
  const payload = Buffer.from(JSON.stringify({ role: "admin", exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString("base64url");
  return { value: payload + "." + sign(payload), maxAge: SESSION_SECONDS };
}

export function verifyAdminSession(request: NextRequest) {
  try {
    const raw = request.cookies.get(COOKIE_NAME)?.value;
    if (!raw) return false;
    const [payload, signature, extra] = raw.split(".");
    if (!payload || !signature || extra) return false;
    const expected = Buffer.from(sign(payload));
    const supplied = Buffer.from(signature);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return false;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { role?: string; exp?: number };
    return claims.role === "admin" && typeof claims.exp === "number" && claims.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function adminCookie(value: string, maxAge: number) {
  return { name: COOKIE_NAME, value, httpOnly: true, secure: true, sameSite: "strict" as const, path: "/", maxAge };
}

export function clearAdminCookie() {
  return { name: COOKIE_NAME, value: "", httpOnly: true, secure: true, sameSite: "strict" as const, path: "/", maxAge: 0 };
}

export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !!origin && origin === request.nextUrl.origin;
}

export function verifyAdminPassword(input: unknown) {
  const configured = process.env.ADMIN_LOGIN_PASSWORD;
  if (!configured || typeof input !== "string") return false;
  const a = createHmac("sha256", secret()).update(input).digest();
  const b = createHmac("sha256", secret()).update(configured).digest();
  return timingSafeEqual(a, b);
}
