import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "../../../lib/adminSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return NextResponse.json({ success: true, authenticated: verifyAdminSession(request) }, { headers: { "Cache-Control": "no-store" } });
}
