import { NextRequest, NextResponse } from "next/server";
import { adminCookie, sameOrigin } from "../../../../lib/adminSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ success: false, error: { message: "Invalid request origin." } }, { status: 403, headers: { "Cache-Control": "no-store" } });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: { message: "Invalid request body." } }, { status: 400, headers: { "Cache-Control": "no-store" } }); }
  const value = body && typeof body === "object" ? body as { requestId?: unknown; pollToken?: unknown; sessionToken?: unknown } : {};
  if (typeof value.requestId !== "string" || typeof value.pollToken !== "string" || typeof value.sessionToken !== "string"
      || !/^[a-f0-9]{64}$/.test(value.pollToken) || !/^[a-f0-9]{64}$/.test(value.sessionToken)) {
    return NextResponse.json({ success: false, error: { message: "Invalid login request." } }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const serviceToken = process.env.ADMIN_API_TOKEN;
  if (!base || !serviceToken) return NextResponse.json({ success: false, error: { message: "Telegram login is not configured." } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  try {
    const upstream = await fetch(`${base}/api/telegram-auth/login-status`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(value),
      cache: "no-store",
      signal: AbortSignal.timeout(5000)
    });
    const data = await upstream.json().catch(() => null) as { success?: boolean; status?: string; error?: { message?: string } } | null;
    if (!upstream.ok || !data?.success) return NextResponse.json({ success: false, error: { message: data?.error?.message ?? "Could not check Telegram approval." } }, { status: upstream.status || 502, headers: { "Cache-Control": "no-store" } });
    const response = NextResponse.json({ success: true, status: data.status }, { headers: { "Cache-Control": "no-store" } });
    if (data.status === "approved") response.cookies.set(adminCookie(value.sessionToken, 24 * 60 * 60));
    return response;
  } catch {
    return NextResponse.json({ success: false, error: { message: "Admin authentication service is unavailable." } }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
