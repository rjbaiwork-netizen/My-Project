import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { NextRequest } from "next/server";
import { createAdminSession, sameOrigin, verifyAdminSession } from "./adminSession.js";

const originalSecret = process.env.ADMIN_SESSION_SECRET;
afterEach(() => {
  if (originalSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = originalSecret;
});

const secret = "test-only-admin-session-secret-with-32-plus-characters";
function request(cookie?: string, origin = "https://example.test") {
  const headers = new Headers({ origin });
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(new Request("https://example.test/api/admin/session", { headers }));
}
function cookieFor(token: string) {
  return "my_project_admin_session=" + token;
}
function signedPayload(claims: { role: string; exp: number }) {
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return payload + "." + signature;
}

test("signed admin session is accepted before expiry", () => {
  process.env.ADMIN_SESSION_SECRET = secret;
  const session = createAdminSession();
  assert.equal(verifyAdminSession(request(cookieFor(session.value))), true);
});

test("tampered admin session is rejected", () => {
  process.env.ADMIN_SESSION_SECRET = secret;
  const session = createAdminSession();
  const tampered = session.value.slice(0, -1) + (session.value.endsWith("a") ? "b" : "a");
  assert.equal(verifyAdminSession(request(cookieFor(tampered))), false);
});

test("cryptographically valid but expired admin session is rejected", () => {
  process.env.ADMIN_SESSION_SECRET = secret;
  const expired = signedPayload({ role: "admin", exp: Math.floor(Date.now() / 1000) - 60 });
  assert.equal(verifyAdminSession(request(cookieFor(expired))), false);
});

test("same-origin check accepts exact origin and rejects a foreign origin", () => {
  assert.equal(sameOrigin(request(undefined, "https://example.test")), true);
  assert.equal(sameOrigin(request(undefined, "https://attacker.test")), false);
});

test("same-origin check recognizes the public origin behind a trusted TLS reverse proxy", () => {
  const headers = new Headers({
    origin: "https://example.test",
    host: "localhost:10000",
    "x-forwarded-host": "example.test",
    "x-forwarded-proto": "https"
  });
  const proxyRequest = new NextRequest(new Request("http://localhost:10000/api/admin/session", { headers }));
  assert.equal(sameOrigin(proxyRequest), true);
});

test("same-origin check rejects a foreign origin even when forwarded headers are present", () => {
  const headers = new Headers({
    origin: "https://attacker.test",
    host: "localhost:10000",
    "x-forwarded-host": "example.test",
    "x-forwarded-proto": "https"
  });
  const proxyRequest = new NextRequest(new Request("http://localhost:10000/api/admin/session", { headers }));
  assert.equal(sameOrigin(proxyRequest), false);
});
