import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return proxy(request, `/api/admin/sections/${encodeURIComponent((await context.params).id)}`);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return proxy(request, `/api/admin/sections/${encodeURIComponent((await context.params).id)}`);
}

async function proxy(request: NextRequest, path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const token = process.env.ADMIN_API_TOKEN;
  if (!base) return NextResponse.json({ success: false, error: { message: "NEXT_PUBLIC_API_URL is not configured." } }, { status: 503 });
  if (!token) return NextResponse.json({ success: false, error: { message: "Admin proxy authentication is not configured." } }, { status: 503 });

  const init: RequestInit = {
    method: request.method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store"
  };
  if (request.method !== "GET" && request.method !== "HEAD") init.body = await request.text();

  try {
    const response = await fetch(`${base}${path}`, init);
    const text = await response.text();
    return new NextResponse(text || null, { status: response.status, headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : "Admin backend unavailable." } }, { status: 502 });
  }
}
