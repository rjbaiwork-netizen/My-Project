import { NextRequest, NextResponse } from "next/server";
import { sameOrigin, verifyAdminSession } from "../../../../lib/adminSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return forward(request, "GET");
}

export async function PATCH(request: NextRequest) {
  return forward(request, "PATCH", await request.text());
}

async function forward(request: NextRequest, method: "GET" | "PATCH", body?: string) {
  if (method !== "GET" && !sameOrigin(request)) {
    return NextResponse.json({ success: false, error: { message: "Invalid request origin." } }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ success: false, error: { message: "Administrator login is required." } }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const token = process.env.ADMIN_API_TOKEN;
  if (!base || !token) {
    return NextResponse.json({ success: false, error: { message: "Admin proxy authentication is not configured." } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const response = await fetch(`${base}/api/admin/workspace`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });
    return new NextResponse(await response.text(), {
      status: response.status,
      headers: { "Content-Type": response.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
    });
  } catch {
    return NextResponse.json({ success: false, error: { message: "Admin backend unavailable." } }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
