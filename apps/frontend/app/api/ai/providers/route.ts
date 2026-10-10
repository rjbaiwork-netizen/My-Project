import { NextRequest, NextResponse } from "next/server";
import { sameOrigin, verifyAdminSession } from "../../../../../lib/adminSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

async function forward(req: NextRequest) {
  if (req.method !== "GET" && req.method !== "HEAD" && !sameOrigin(req)) {
    return NextResponse.json({ success: false, error: { message: "Invalid request origin." } }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ success: false, error: { message: "Administrator login is required." } }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  if (!base) return NextResponse.json({ success: false, error: { message: "Backend URL is not configured." } }, { status: 503, headers: { "Cache-Control": "no-store" } });

  const action = req.nextUrl.searchParams.get("action");
  const target = req.method === "POST" && action === "reindex"
    ? base + "/api/ai/providers/reindex-knowledge"
    : base + "/api/ai/providers" + req.nextUrl.search;
  try {
    const response = await fetch(target, {
      method: req.method,
      headers: {
        Authorization: "Bearer " + (process.env.ADMIN_API_TOKEN ?? ""),
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.text(),
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
    });
  } catch {
    return NextResponse.json({ success: false, error: { message: "AI provider service is temporarily unavailable." } }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

export const GET = forward;
export const POST = forward;
