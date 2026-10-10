import { sameOrigin, verifyAdminSession } from "../../../../../lib/adminSession";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return forward("GET");
}

export async function PATCH(request: NextRequest) {
  return forward("PATCH", await request.text());
}

async function forward(method: string, body?: string) {
  if (request.method !== "GET" && request.method !== "HEAD" && !sameOrigin(request)) return NextResponse.json({ success: false, error: { message: "Invalid request origin." } }, { status: 403, headers: { "Cache-Control": "no-store" } });
  if (!verifyAdminSession(request)) return NextResponse.json({ success: false, error: { message: "Administrator login is required." } }, { status: 401, headers: { "Cache-Control": "no-store" } });
    const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const token = process.env.ADMIN_API_TOKEN;
  if (!base) return NextResponse.json({ success: false, error: { message: "NEXT_PUBLIC_API_URL is not configured." } }, { status: 503 });
  if (!token) return NextResponse.json({ success: false, error: { message: "Admin proxy authentication is not configured." } }, { status: 503 });

  try {
    const response = await fetch(`${base}/api/admin/workspace`, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body,
      cache: "no-store"
    });
    const text = await response.text();
    return new NextResponse(text || null, { status: response.status, headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { message: error instanceof Error ? error.message : "Admin backend unavailable." } }, { status: 502 });
  }
}
