import { NextResponse } from "next/server";
import registry from "./registry.json";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    { success: true, checkedAt: new Date().toISOString(), registry },
    { headers: { "Cache-Control": "no-store" } }
  );
}
