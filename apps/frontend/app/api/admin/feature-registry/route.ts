import { NextRequest, NextResponse } from "next/server";
import registry from "./registry.json";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const expected = process.env.MONITOR_ACCESS_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected) {
    return NextResponse.json({ success: false, error: { message: "Monitoring access is not configured." } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  if (!supplied || supplied !== expected) {
    return NextResponse.json({ success: false, error: { message: "Monitoring access token is missing or invalid." } }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  return NextResponse.json({ success: true, checkedAt: new Date().toISOString(), registry }, { headers: { "Cache-Control": "no-store" } });
}
