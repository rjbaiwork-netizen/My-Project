import { NextRequest, NextResponse } from "next/server";
import { clearAdminCookie, getAdminSessionToken, sameOrigin } from "../../../../lib/adminSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ success: false, error: { message: "Invalid request origin." } }, { status: 403, headers: { "Cache-Control": "no-store" } });
  const token = getAdminSessionToken(request);
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const serviceToken = process.env.ADMIN_API_TOKEN;
  if (token && base && serviceToken) {
    await fetch(`${base}/api/telegram-auth/session/revoke`, {
      method: "POST",
      headers: { Authorization: `Bearer ${serviceToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
      signal: AbortSignal.timeout(5000)
    }).catch(() => undefined);
  }
  const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(clearAdminCookie());
  return response;
}
