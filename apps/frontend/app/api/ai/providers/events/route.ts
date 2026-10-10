import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const token = process.env.ADMIN_API_TOKEN;

  if (!base) {
    return NextResponse.json(
      { success: false, error: { message: "Backend URL is not configured." } },
      { status: 503 }
    );
  }
  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: "Admin proxy authentication is not configured." } },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(
      `${base}/api/ai/providers/events${request.nextUrl.search}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(8000)
      }
    );
    const text = await response.text();
    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "AI provider events are temporarily unavailable." } },
      { status: 502 }
    );
  }
}
