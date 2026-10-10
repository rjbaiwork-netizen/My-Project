export type PendingConfirmation = {
  id: string;
  action: unknown;
  expiresAt: Date;
  consumedAt: Date | null;
};

export type ConfirmationDelegate = {
  findUnique(args: { where: { id: string } }): Promise<PendingConfirmation | null>;
  updateMany(args: {
    where: { id: string; consumedAt: null; expiresAt: { gt: Date } };
    data: { consumedAt: Date };
  }): Promise<{ count: number }>;
};

export type ConsumeConfirmationResult =
  | { status: "not-found" }
  | { status: "expired-or-used" }
  | { status: "consumed"; confirmation: PendingConfirmation };

export async function consumeConfirmation(
  delegate: ConfirmationDelegate,
  id: string,
  now = new Date()
): Promise<ConsumeConfirmationResult> {
  const pending = await delegate.findUnique({ where: { id } });
  if (!pending) return { status: "not-found" };
  if (pending.consumedAt || pending.expiresAt.getTime() <= now.getTime()) {
    return { status: "expired-or-used" };
  }

  // The conditional update is the atomic single-use gate. A read alone cannot prevent races.
  const result = await delegate.updateMany({
    where: { id, consumedAt: null, expiresAt: { gt: now } },
    data: { consumedAt: now }
  });
  if (result.count !== 1) return { status: "expired-or-used" };
  return { status: "consumed", confirmation: pending };
}
