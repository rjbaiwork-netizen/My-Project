import { NextRequest, NextResponse } from "next/server";

async function proxy(request: NextRequest, path: string) {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const token = process.env.ADMIN_API_TOKEN;
  if (!base) return NextResponse.json({ success: false, error: { message: "NEXT_PUBLIC_API_URL is not configured." } }, { status: 503 });
  if (!token) return NextResponse.json({ success: false, error: { message: "Admin proxy authentication is not configured." } }, { status: 503 });

  const headers = new Headers({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" });
  const init: RequestInit = { method: request.method, headers, cache: "no-store" };
  if (request.method !== "GET" && request.method !== "HEAD") init.body = await request.text();

  try {
    const response = await fetch(`${base}${path}`, init);
    const text = await response.text();
    return new NextResponse(text || null, { status: response.status, headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : "Admin backend unavailable." } }, { status: 502 });
  }
}

export async function GET(request: NextRequest) {
  return proxy(request, "/api/admin/sections");
}
