import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { sameOrigin } from "../../../../lib/adminSession";
import { clearLoginFailures, loginRateLimit, recordLoginFailure, clearLoginFailures as clearFailures } from "../../../../lib/loginRateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ success: false, error: { message: "Invalid request origin." } }, { status: 403, headers: { "Cache-Control": "no-store" } });
  const limit = loginRateLimit(request);
  if (!limit.allowed) return NextResponse.json(
    { success: false, error: { message: "Too many login requests. Try again later." } },
    { status: 429, headers: { "Cache-Control": "no-store", "Retry-After": String(limit.retryAfterSeconds) } }
  );

  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const serviceToken = process.env.ADMIN_API_TOKEN;
  if (!base || !serviceToken) return NextResponse.json(
    { success: false, error: { message: "Telegram login is not configured on the server." } },
    { status: 503, headers: { "Cache-Control": "no-store" } }
  );

  const pollToken = randomBytes(32).toString("hex");
  const sessionToken = randomBytes(32).toString("hex");
  const userAgent = request.headers.get("user-agent") ?? "Unknown browser";
  const deviceLabel = userAgent.slice(0, 180);
  try {
    const upstream = await fetch(`${base}/api/telegram-auth/login-request`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ pollToken, sessionToken, deviceLabel }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });
    const data = await upstream.json().catch(() => null) as { success?: boolean; requestId?: string; expiresInSeconds?: number; error?: { message?: string } } | null;
    if (!upstream.ok || !data?.success || !data.requestId) {
      recordLoginFailure(limit.key);
      return NextResponse.json({ success: false, error: { message: data?.error?.message ?? "Unable to start Telegram approval." } }, { status: upstream.status || 502, headers: { "Cache-Control": "no-store" } });
    }
    clearFailures(limit.key);
    return NextResponse.json({
      success: true,
      requestId: data.requestId,
      pollToken,
      sessionToken,
      expiresInSeconds: data.expiresInSeconds ?? 300
    }, { status: 202, headers: { "Cache-Control": "no-store" } });
  } catch {
    recordLoginFailure(limit.key);
    return NextResponse.json({ success: false, error: { message: "Admin authentication service is unavailable." } }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
