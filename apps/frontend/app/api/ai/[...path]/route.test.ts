import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET, POST } from "./route.js";
import { createAdminSession } from "../../../../lib/adminSession.js";

const originalSecret = process.env.ADMIN_SESSION_SECRET;
const originalToken = process.env.ADMIN_API_TOKEN;
const originalBase = process.env.NEXT_PUBLIC_API_URL;
const originalFetch = globalThis.fetch;

afterEach(() => {
  if (originalSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = originalSecret;
  if (originalToken === undefined) delete process.env.ADMIN_API_TOKEN;
  else process.env.ADMIN_API_TOKEN = originalToken;
  if (originalBase === undefined) delete process.env.NEXT_PUBLIC_API_URL;
  else process.env.NEXT_PUBLIC_API_URL = originalBase;
  globalThis.fetch = originalFetch;
});

function request(path: string, options: { method?: string; origin?: string; cookie?: string } = {}) {
  const headers = new Headers();
  if (options.origin !== undefined) headers.set("origin", options.origin);
  if (options.cookie) headers.set("cookie", options.cookie);
  return new NextRequest(new Request("https://example.test" + path, {
    method: options.method ?? "GET",
    headers,
    body: options.method && options.method !== "GET" ? "{}" : undefined
  }));
}

function signedCookie() {
  process.env.ADMIN_SESSION_SECRET = "test-only-session-secret-at-least-32-characters";
  return "my_project_admin_session=" + createAdminSession().value;
}

test("AI proxy rejects requests without an administrator session", async () => {
  const response = await GET(request("/api/ai/agents"), { params: Promise.resolve({ path: ["agents"] }) });
  assert.equal(response.status, 401);
});

test("AI proxy rejects cross-origin mutations before forwarding", async () => {
  const response = await POST(request("/api/ai/agents", { method: "POST", origin: "https://attacker.test", cookie: signedCookie() }), {
    params: Promise.resolve({ path: ["agents"] })
  });
  assert.equal(response.status, 403);
});

test("AI proxy fails closed when backend URL or service token is missing", async () => {
  process.env.ADMIN_SESSION_SECRET = "test-only-session-secret-at-least-32-characters";
  delete process.env.NEXT_PUBLIC_API_URL;
  delete process.env.ADMIN_API_TOKEN;
  const response = await GET(request("/api/ai/agents", { cookie: signedCookie() }), { params: Promise.resolve({ path: ["agents"] }) });
  assert.equal(response.status, 503);
});

test("AI proxy forwards an authenticated request with the server-side bearer token", async () => {
  process.env.ADMIN_SESSION_SECRET = "test-only-session-secret-at-least-32-characters";
  process.env.ADMIN_API_TOKEN = "backend-test-token";
  process.env.NEXT_PUBLIC_API_URL = "https://backend.example.test/";
  let forwardedUrl = "";
  let forwardedAuthorization = "";
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    forwardedUrl = String(input);
    forwardedAuthorization = new Headers(init?.headers).get("authorization") ?? "";
    return new Response(JSON.stringify({ success: true, data: [] }), {
      status: 200, headers: { "content-type": "application/json" }
    });
  }) as typeof fetch;
  const response = await GET(request("/api/ai/agents?limit=5", { cookie: signedCookie() }), { params: Promise.resolve({ path: ["agents"] }) });
  assert.equal(response.status, 200);
  assert.equal(forwardedUrl, "https://backend.example.test/api/ai/agents?limit=5");
  assert.equal(forwardedAuthorization, "Bearer backend-test-token");
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
});
