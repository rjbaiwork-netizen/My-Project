import { NextRequest, NextResponse } from "next/server";
import { sameOrigin, verifyAdminSession } from "../../../../lib/adminSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ path: string[] }> };

async function forward(request: NextRequest, context: RouteContext) {
  if (!sameOrigin(request) && request.method !== "GET") {
    return NextResponse.json({ success: false, error: { message: "Invalid request origin." } }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  if (!verifyAdminSession(request)) {
    return NextResponse.json({ success: false, error: { message: "Administrator login is required." } }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
  const token = process.env.ADMIN_API_TOKEN;
  if (!base || !token) return NextResponse.json({ success: false, error: { message: "AI API proxy configuration is incomplete." } }, { status: 503, headers: { "Cache-Control": "no-store" } });

  const { path } = await context.params;
  const suffix = path.map(segment => encodeURIComponent(segment)).join("/");
  const url = base + "/api/ai/" + suffix + request.nextUrl.search;
  try {
    const headers: Record<string, string> = { Authorization: "Bearer " + token };
    const contentType = request.headers.get("content-type");
    if (contentType) headers["Content-Type"] = contentType;
    const init: RequestInit = { method: request.method, headers, cache: "no-store", signal: AbortSignal.timeout(30_000) };
    if (request.method !== "GET" && request.method !== "HEAD") init.body = await request.text();
    const upstream = await fetch(url, init);
    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return NextResponse.json({ success: false, error: { message: "AI backend is unavailable." } }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}

export async function GET(request: NextRequest, context: RouteContext) { return forward(request, context); }
export async function POST(request: NextRequest, context: RouteContext) { return forward(request, context); }
export async function PATCH(request: NextRequest, context: RouteContext) { return forward(request, context); }
export async function PUT(request: NextRequest, context: RouteContext) { return forward(request, context); }
export async function DELETE(request: NextRequest, context: RouteContext) { return forward(request, context); }
