import { afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { requireAdminAuth } from "./adminAuth.js";

type MockResponse = {
  statusCode?: number;
  body?: unknown;
  headers: Record<string, string>;
  status(code: number): MockResponse;
  json(value: unknown): MockResponse;
  setHeader(name: string, value: string): void;
};

function runAuth(token: string | undefined, authorization?: string) {
  const original = process.env.ADMIN_API_TOKEN;
  if (token === undefined) delete process.env.ADMIN_API_TOKEN;
  else process.env.ADMIN_API_TOKEN = token;

  let nextCalled = false;
  const response: MockResponse = {
    headers: {},
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; },
    setHeader(name, value) { this.headers[name] = value; }
  };
  const request = {
    get(name: string) {
      return name.toLowerCase() === "authorization" ? authorization : undefined;
    }
  };

  try {
    requireAdminAuth(request as never, response as never, (() => { nextCalled = true; }) as never);
    return { response, nextCalled };
  } finally {
    if (original === undefined) delete process.env.ADMIN_API_TOKEN;
    else process.env.ADMIN_API_TOKEN = original;
  }
}

test("fails closed when ADMIN_API_TOKEN is missing", () => {
  const { response, nextCalled } = runAuth(undefined, "Bearer any");
  assert.equal(response.statusCode, 503);
  assert.equal(nextCalled, false);
});

test("rejects missing bearer credentials", () => {
  const { response, nextCalled } = runAuth("expected-secret", undefined);
  assert.equal(response.statusCode, 401);
  assert.equal(response.headers["WWW-Authenticate"], 'Bearer realm="admin"');
  assert.equal(nextCalled, false);
});

test("rejects an incorrect bearer token", () => {
  const { response, nextCalled } = runAuth("expected-secret", "Bearer wrong-secret");
  assert.equal(response.statusCode, 401);
  assert.equal(nextCalled, false);
});

test("accepts the exact configured bearer token", () => {
  const { response, nextCalled } = runAuth("expected-secret", "Bearer expected-secret");
  assert.equal(response.statusCode, undefined);
  assert.equal(nextCalled, true);
});
