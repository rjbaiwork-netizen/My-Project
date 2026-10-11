import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { createAdminSession, sameOrigin, verifyAdminSession } from "./adminSession.js";

const originalSecret = process.env.ADMIN_SESSION_SECRET;
const originalBase = process.env.NEXT_PUBLIC_API_URL;
const originalToken = process.env.ADMIN_API_TOKEN;
const originalFetch = globalThis.fetch;

afterEach(() => {
  if (originalSecret === undefined) delete process.env.ADMIN_SESSION_SECRET; else process.env.ADMIN_SESSION_SECRET = originalSecret;
  if (originalBase === undefined) delete process.env.NEXT_PUBLIC_API_URL; else process.env.NEXT_PUBLIC_API_URL = originalBase;
  if (originalToken === undefined) delete process.env.ADMIN_API_TOKEN; else process.env.ADMIN_API_TOKEN = originalToken;
  globalThis.fetch = originalFetch;
});

function request(cookie?: string, origin = "https://example.test") {
  const headers = new Headers({ origin });
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(new Request("https://example.test/api/admin/session", { headers }));
}
function cookieFor(token: string) { return "my_project_admin_session=" + token; }

test("session token is cryptographically random and 64 hex characters", () => {
  const session = createAdminSession();
  assert.match(session.value, /^[a-f0-9]{64}$/);
  assert.equal(session.maxAge, 24 * 60 * 60);
  assert.notEqual(createAdminSession().value, session.value);
});

test("database-backed session verifier accepts a session validated by backend", async () => {
  process.env.NEXT_PUBLIC_API_URL = "https://backend.example.test";
  process.env.ADMIN_API_TOKEN = "test-service-token";
  const token = "a".repeat(64);
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    assert.equal(String(input), "https://backend.example.test/api/telegram-auth/session/verify");
    assert.equal(new Headers(init?.headers).get("authorization"), "Bearer test-service-token");
    assert.equal(JSON.parse(String(init?.body)).token, token);
    return Response.json({ success: true, authenticated: true });
  }) as typeof fetch;
  assert.equal(await verifyAdminSession(request(cookieFor(token))), true);
});

test("session verifier fails closed when backend says revoked or unavailable", async () => {
  process.env.NEXT_PUBLIC_API_URL = "https://backend.example.test";
  process.env.ADMIN_API_TOKEN = "test-service-token";
  globalThis.fetch = (async () => Response.json({ success: true, authenticated: false })) as typeof fetch;
  assert.equal(await verifyAdminSession(request(cookieFor("b".repeat(64)))), false);
  globalThis.fetch = (async () => { throw new Error("offline"); }) as typeof fetch;
  assert.equal(await verifyAdminSession(request(cookieFor("b".repeat(64)))), false);
});

test("missing cookie and malformed token fail closed", async () => {
  process.env.NEXT_PUBLIC_API_URL = "https://backend.example.test";
  process.env.ADMIN_API_TOKEN = "test-service-token";
  assert.equal(await verifyAdminSession(request()), false);
  assert.equal(await verifyAdminSession(request(cookieFor("invalid"))), false);
});

test("same-origin check accepts exact origin and rejects a foreign origin", () => {
  assert.equal(sameOrigin(request(undefined, "https://example.test")), true);
  assert.equal(sameOrigin(request(undefined, "https://attacker.test")), false);
});

test("same-origin check recognizes public origin behind a trusted TLS reverse proxy", () => {
  const headers = new Headers({ origin: "https://example.test", host: "localhost:10000", "x-forwarded-host": "example.test", "x-forwarded-proto": "https" });
  const proxyRequest = new NextRequest(new Request("http://localhost:10000/api/admin/session", { headers }));
  assert.equal(sameOrigin(proxyRequest), true);
});

test("same-origin check rejects a foreign origin even when forwarded headers are present", () => {
  const headers = new Headers({ origin: "https://attacker.test", host: "localhost:10000", "x-forwarded-host": "example.test", "x-forwarded-proto": "https" });
  const proxyRequest = new NextRequest(new Request("http://localhost:10000/api/admin/session", { headers }));
  assert.equal(sameOrigin(proxyRequest), false);
});
