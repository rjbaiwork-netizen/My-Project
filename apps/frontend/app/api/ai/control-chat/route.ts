import { NextRequest, NextResponse } from "next/server";
import { sameOrigin, verifyAdminSession } from "../../../../lib/adminSession";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ success: false, error: { message: "Invalid request origin." } }, { status: 403, headers: { "Cache-Control": "no-store" } });
  if (!verifyAdminSession(request)) return NextResponse.json({ success: false, error: { message: "Admin login is required." } }, { status: 401, headers: { "Cache-Control": "no-store" } });
  if (process.env.ADMIN_CONTROL_PROXY_ENABLED !== "true") return NextResponse.json({ success: false, error: { message: "AI Control proxy is disabled by configuration." } }, { status: 503, headers: { "Cache-Control": "no-store" } });

  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
  const token = process.env.ADMIN_API_TOKEN;
  if (!base || !token) return NextResponse.json({ success: false, error: { message: "Admin control backend configuration is incomplete." } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: { message: "Invalid JSON body." } }, { status: 400 }); }

  try {
    const upstream = await fetch(base + "/api/ai/control-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000)
    });
    const text = await upstream.text();
    return new NextResponse(text, { status: upstream.status, headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ success: false, error: { message: "AI control backend is unavailable." } }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
