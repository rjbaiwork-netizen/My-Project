import { NextRequest } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

async function forward(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const token = process.env.ADMIN_API_TOKEN;
  const { path = [] } = await params;

  if (!BACKEND_URL) {
    return Response.json(
      { success: false, error: { message: "Admin proxy is not configured." } },
      { status: 503 }
    );
  }

  // The public section list is safe to expose and provides a read-only
  // bootstrap path when the server-side admin secret has not been wired yet.
  // Mutating/admin-only requests still require ADMIN_API_TOKEN.
  if (!token) {
    if (request.method !== "GET" || path.length > 0) {
      return Response.json(
        { success: false, error: { message: "Admin proxy is not configured." } },
        { status: 503 }
      );
    }

    const upstream = await fetch(`${BACKEND_URL}/api/sections`, {
      method: "GET",
      cache: "no-store"
    });

    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ?? "application/json"
      }
    });
  }

  const url = `${BACKEND_URL}/api/admin/sections${path.length ? "/" + path.map(encodeURIComponent).join("/") : ""}`;
  const headers = new Headers({ Authorization: `Bearer ${token}` });
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const body =
    request.method === "GET" || request.method === "DELETE"
      ? undefined
      : await request.text();

  const upstream = await fetch(url, {
    method: request.method,
    headers,
    body,
    cache: "no-store"
  });

  return new Response(await upstream.text(), {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/json"
    }
  });
}

export const GET = forward;
export const PATCH = forward;
export const DELETE = forward;
