import { NextRequest, NextResponse } from "next/server";
import { adminCookie, createAdminSession, sameOrigin, verifyAdminPassword } from "../../../lib/adminSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ success: false, error: { message: "Invalid request origin." } }, { status: 403, headers: { "Cache-Control": "no-store" } });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: { message: "Invalid JSON body." } }, { status: 400 }); }
  const password = body && typeof body === "object" ? (body as { password?: unknown }).password : undefined;
  try {
    if (!verifyAdminPassword(password)) return NextResponse.json({ success: false, error: { message: "Invalid credentials." } }, { status: 401, headers: { "Cache-Control": "no-store" } });
    const session = createAdminSession();
    const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(adminCookie(session.value, session.maxAge));
    return response;
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : "Admin login is not configured." } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
