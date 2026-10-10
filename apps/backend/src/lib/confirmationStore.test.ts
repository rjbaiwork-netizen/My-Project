import { test } from "node:test";
import assert from "node:assert/strict";
import { consumeConfirmation, type ConfirmationDelegate, type PendingConfirmation } from "./confirmationStore.js";

class FakeConfirmationStore implements ConfirmationDelegate {
  private row: PendingConfirmation | null;
  constructor(row: PendingConfirmation | null) { this.row = row; }

  async findUnique() {
    return this.row ? { ...this.row } : null;
  }

  async updateMany(args: { where: { id: string; consumedAt: null; expiresAt: { gt: Date } }; data: { consumedAt: Date } }) {
    const row = this.row;
    if (!row || row.id !== args.where.id || row.consumedAt !== null || row.expiresAt <= args.where.expiresAt.gt) return { count: 0 };
    row.consumedAt = args.data.consumedAt;
    return { count: 1 };
  }
}

function record(overrides: Partial<PendingConfirmation> = {}): PendingConfirmation {
  return {
    id: "confirm-1",
    action: { type: "delete-cms", id: "cms-1" },
    expiresAt: new Date("2030-01-01T00:00:00.000Z"),
    consumedAt: null,
    ...overrides
  };
}

test("confirmation can be consumed only once (replay is rejected)", async () => {
  const store = new FakeConfirmationStore(record());
  const now = new Date("2029-01-01T00:00:00.000Z");
  const first = await consumeConfirmation(store, "confirm-1", now);
  const replay = await consumeConfirmation(store, "confirm-1", now);
  assert.equal(first.status, "consumed");
  assert.equal(replay.status, "expired-or-used");
});

test("concurrent confirmation requests have exactly one winner", async () => {
  const store = new FakeConfirmationStore(record());
  const now = new Date("2029-01-01T00:00:00.000Z");
  const results = await Promise.all([
    consumeConfirmation(store, "confirm-1", now),
    consumeConfirmation(store, "confirm-1", now)
  ]);
  assert.equal(results.filter(result => result.status === "consumed").length, 1);
  assert.equal(results.filter(result => result.status === "expired-or-used").length, 1);
});

test("expired confirmation is rejected without consuming it", async () => {
  const store = new FakeConfirmationStore(record({ expiresAt: new Date("2028-01-01T00:00:00.000Z") }));
  const result = await consumeConfirmation(store, "confirm-1", new Date("2029-01-01T00:00:00.000Z"));
  assert.equal(result.status, "expired-or-used");
});

test("unknown confirmation is rejected", async () => {
  const store = new FakeConfirmationStore(null);
  const result = await consumeConfirmation(store, "missing", new Date("2029-01-01T00:00:00.000Z"));
  assert.equal(result.status, "not-found");
});
