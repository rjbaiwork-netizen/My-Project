import { NextRequest, NextResponse } from "next/server";
import { sameOrigin, verifyAdminSession } from "../../../../../lib/adminSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return proxy(request, `/api/admin/sections/${encodeURIComponent((await context.params).id)}`);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return proxy(request, `/api/admin/sections/${encodeURIComponent((await context.params).id)}`);
}

async function proxy(request: NextRequest, path: string) {
  if (!sameOrigin(request)) return NextResponse.json({ success: false, error: { message: "Invalid request origin." } }, { status: 403, headers: { "Cache-Control": "no-store" } });
  if (!verifyAdminSession(request)) return NextResponse.json({ success: false, error: { message: "Administrator login is required." } }, { status: 401, headers: { "Cache-Control": "no-store" } });

  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const token = process.env.ADMIN_API_TOKEN;
  if (!base || !token) return NextResponse.json({ success: false, error: { message: "Admin proxy authentication is not configured." } }, { status: 503, headers: { "Cache-Control": "no-store" } });

  const init: RequestInit = {
    method: request.method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10000)
  };
  if (request.method !== "GET" && request.method !== "HEAD") init.body = await request.text();

  try {
    const response = await fetch(`${base}${path}`, init);
    return new NextResponse(await response.text(), { status: response.status, headers: { "Content-Type": response.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ success: false, error: { message: "Admin backend unavailable." } }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
