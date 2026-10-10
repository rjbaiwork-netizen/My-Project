import { NextRequest, NextResponse } from "next/server";
import { sameOrigin, verifyAdminSession } from "../../../../../lib/adminSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

async function forward(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  if (request.method !== "GET" && request.method !== "HEAD" && !sameOrigin(request)) {
    return NextResponse.json({ success: false, error: { message: "Invalid request origin." } }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ success: false, error: { message: "Administrator login is required." } }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const token = process.env.ADMIN_API_TOKEN;
  const { path = [] } = await params;
  if (!BACKEND_URL || !token) {
    return NextResponse.json({ success: false, error: { message: "Admin proxy is not configured." } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const url = `${BACKEND_URL}/api/admin/sections${path.length ? "/" + path.map(encodeURIComponent).join("/") : ""}`;
  const headers = new Headers({ Authorization: `Bearer ${token}`, Accept: "application/json" });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);
  const body = request.method === "GET" || request.method === "HEAD" || request.method === "DELETE" ? undefined : await request.text();

  try {
    const upstream = await fetch(url, { method: request.method, headers, body, cache: "no-store", signal: AbortSignal.timeout(10000) });
    return new NextResponse(await upstream.text(), {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
    });
  } catch {
    return NextResponse.json({ success: false, error: { message: "Admin backend is unavailable." } }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

export const GET = forward;
export const PATCH = forward;
export const DELETE = forward;
