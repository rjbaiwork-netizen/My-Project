import { test } from "node:test";
import assert from "node:assert/strict";
import { clearLoginFailures, loginRateLimit, recordLoginFailure } from "./loginRateLimit.js";

function request(ip: string) {
  return new Request("https://example.test/api/admin/login", { headers: { "x-real-ip": ip } });
}

test("admin login permits five failures then applies a timed block", () => {
  const req = request("test-login-limit-5");
  const now = 1_900_000_000_000;
  for (let i = 0; i < 5; i++) {
    const result = loginRateLimit(req, now);
    assert.equal(result.allowed, true);
    recordLoginFailure(result.key, now + i);
  }
  const blocked = loginRateLimit(req, now + 10);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);
  clearLoginFailures(blocked.key);
});

test("admin login rate-limit window resets after expiry", () => {
  const req = request("test-login-limit-expiry");
  const now = 1_900_100_000_000;
  const first = loginRateLimit(req, now);
  recordLoginFailure(first.key, now);
  const afterWindow = loginRateLimit(req, now + 16 * 60 * 1000);
  assert.equal(afterWindow.allowed, true);
  clearLoginFailures(first.key);
});
