import { Router, type Request, type Response } from "express";
import { createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { Prisma } from "../../generated/prisma/client.js";

const router = Router();
const MAX_SESSION_MS = 24 * 60 * 60 * 1000;
const IDLE_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const LOGIN_REQUEST_MS = 5 * 60 * 1000;

function sha(value: string) { return createHash("sha256").update(value).digest("hex"); }
function equal(a: string, b: string) {
  const aa = Buffer.from(a); const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}
function serviceAuthorized(req: Request) {
  const expected = process.env.ADMIN_API_TOKEN;
  const match = /^Bearer\s+(.+)$/i.exec(req.get("authorization") ?? "");
  return Boolean(expected && match?.[1] && equal(match[1].trim(), expected));
}
function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(name + " is not configured.");
  return value;
}
async function telegram(method: string, body: Record<string, unknown>) {
  const token = requiredEnv("TELEGRAM_BOT_TOKEN");
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000)
  });
  const result = await response.json().catch(() => null) as { ok?: boolean; description?: string } | null;
  if (!response.ok || !result?.ok) throw new Error("Telegram API request failed.");
  return result;
}
async function event(eventType: string, detail: Record<string, unknown>, ipHash?: string | null) {
  await prisma.adminSecurityEvent.create({ data: { eventType, detail: detail as Prisma.InputJsonValue, ipHash: ipHash ?? null } }).catch(() => undefined);
}
function getIpHash(req: Request) {
  const ip = req.ip || req.get("x-real-ip") || "";
  return ip ? sha(ip) : null;
}

router.post("/login-request", async (req, res) => {
  if (!serviceAuthorized(req)) return void res.status(401).json({ success: false, error: { message: "Unauthorized." } });
  const body = req.body as { pollToken?: unknown; sessionToken?: unknown; deviceLabel?: unknown };
  if (typeof body.pollToken !== "string" || !/^[a-f0-9]{64}$/.test(body.pollToken)
      || typeof body.sessionToken !== "string" || !/^[a-f0-9]{64}$/.test(body.sessionToken)) {
    return void res.status(400).json({ success: false, error: { message: "Invalid login request." } });
  }
  const ownerId = process.env.OWNER_TELEGRAM_USER_ID?.trim();
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!ownerId || !/^\d+$/.test(ownerId) || !botToken) {
    return void res.status(503).json({ success: false, error: { message: "Telegram Owner authentication is not configured." } });
  }
  const ipHash = getIpHash(req);
  const deviceLabel = typeof body.deviceLabel === "string" ? body.deviceLabel.slice(0, 240) : "Unknown browser";
  const login = await prisma.adminLoginRequest.create({
    data: {
      pollTokenHash: sha(body.pollToken),
      sessionTokenHash: sha(body.sessionToken),
      deviceLabel,
      ipHash,
      expiresAt: new Date(Date.now() + LOGIN_REQUEST_MS)
    }
  });
  try {
    await telegram("sendMessage", {
      chat_id: ownerId,
      text: "My-Project admin login approval requested.\nDevice: " + deviceLabel + "\nRequest: " + login.id + "\nExpires in 5 minutes. Approve only if you initiated this login.",
      reply_markup: {
        inline_keyboard: [[
          { text: "Approve login", callback_data: "admin_login:approve:" + login.id },
          { text: "Deny", callback_data: "admin_login:deny:" + login.id }
        ]]
      }
    });
  } catch {
    await prisma.adminLoginRequest.update({ where: { id: login.id }, data: { status: "EXPIRED" } });
    await event("login_notification_failed", { requestId: login.id }, ipHash);
    return void res.status(502).json({ success: false, error: { message: "Could not notify the Telegram Owner. Check bot configuration." } });
  }
  await event("login_requested", { requestId: login.id, deviceLabel }, ipHash);
  res.status(202).json({ success: true, requestId: login.id, expiresInSeconds: LOGIN_REQUEST_MS / 1000 });
});

router.post("/login-status", async (req, res) => {
  if (!serviceAuthorized(req)) return void res.status(401).json({ success: false, error: { message: "Unauthorized." } });
  const body = req.body as { requestId?: unknown; pollToken?: unknown; sessionToken?: unknown };
  if (typeof body.requestId !== "string" || typeof body.pollToken !== "string" || typeof body.sessionToken !== "string"
      || !/^[a-f0-9]{64}$/.test(body.pollToken) || !/^[a-f0-9]{64}$/.test(body.sessionToken)) {
    return void res.status(400).json({ success: false, error: { message: "Invalid login request." } });
  }
  const login = await prisma.adminLoginRequest.findUnique({ where: { id: body.requestId } });
  if (!login || !equal(login.pollTokenHash, sha(body.pollToken)) || !equal(login.sessionTokenHash, sha(body.sessionToken))) {
    return void res.status(404).json({ success: false, error: { message: "Login request not found." } });
  }
  const now = new Date();
  if (login.status === "PENDING" && login.expiresAt <= now) {
    await prisma.adminLoginRequest.updateMany({ where: { id: login.id, status: "PENDING" }, data: { status: "EXPIRED" } });
    return void res.json({ success: true, status: "expired" });
  }
  if (login.status !== "APPROVED") return void res.json({ success: true, status: login.status.toLowerCase() });
  const session = await prisma.adminSession.upsert({
    where: { loginRequestId: login.id },
    create: {
      tokenHash: login.sessionTokenHash,
      loginRequestId: login.id,
      expiresAt: new Date(now.getTime() + MAX_SESSION_MS),
      lastActivityAt: now,
      deviceLabel: login.deviceLabel,
      ipHash: login.ipHash
    },
    update: {}
  });
  const consumed = await prisma.adminLoginRequest.updateMany({
    where: { id: login.id, consumedAt: null },
    data: { consumedAt: now }
  });
  if (consumed.count === 1) await event("login_approved", { requestId: login.id, sessionId: session.id }, login.ipHash);
  if (session.revokedAt || session.expiresAt <= now || session.lastActivityAt.getTime() < now.getTime() - IDLE_TIMEOUT_MS) {
    return void res.json({ success: true, status: "expired" });
  }
  res.json({ success: true, status: "approved" });
});

router.post("/session/verify", async (req, res) => {
  if (!serviceAuthorized(req)) return void res.status(401).json({ success: false });
  const token = req.body?.token;
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) return void res.json({ success: true, authenticated: false });
  const now = new Date();
  const session = await prisma.adminSession.findUnique({ where: { tokenHash: sha(token) } });
  if (!session || session.revokedAt || session.expiresAt <= now) return void res.json({ success: true, authenticated: false });
  if (session.lastActivityAt.getTime() < now.getTime() - IDLE_TIMEOUT_MS) {
    await prisma.adminSession.updateMany({ where: { id: session.id, revokedAt: null }, data: { revokedAt: now } });
    await event("session_idle_expired", { sessionId: session.id }, session.ipHash);
    return void res.json({ success: true, authenticated: false });
  }
  await prisma.adminSession.updateMany({
    where: { id: session.id, revokedAt: null, expiresAt: { gt: now } },
    data: { lastActivityAt: now }
  });
  res.json({ success: true, authenticated: true, expiresAt: session.expiresAt.toISOString() });
});

router.post("/session/revoke", async (req, res) => {
  if (!serviceAuthorized(req)) return void res.status(401).json({ success: false });
  const token = req.body?.token;
  if (typeof token === "string" && /^[a-f0-9]{64}$/.test(token)) {
    const now = new Date();
    const session = await prisma.adminSession.findUnique({ where: { tokenHash: sha(token) } });
    if (session && !session.revokedAt) {
      await prisma.adminSession.update({ where: { id: session.id }, data: { revokedAt: now } });
      await event("session_revoked", { sessionId: session.id }, session.ipHash);
    }
  }
  res.json({ success: true });
});

router.post("/webhook", async (req, res) => {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret || !equal(req.get("x-telegram-bot-api-secret-token") ?? "", secret)) {
    return void res.status(403).json({ ok: false });
  }
  const update = req.body as {
    callback_query?: { id: string; from: { id: number }; data?: string; message?: { chat: { id: number }; message_id: number } };
    message?: { from?: { id: number }; chat: { id: number }; text?: string };
  };
  const ownerId = process.env.OWNER_TELEGRAM_USER_ID?.trim();
  const callback = update.callback_query;
  if (callback) {
    if (!ownerId || String(callback.from.id) !== ownerId) {
      await telegram("answerCallbackQuery", { callback_query_id: callback.id, text: "Not authorized.", show_alert: true }).catch(() => undefined);
      return void res.json({ ok: true });
    }
    const match = /^admin_login:(approve|deny):([a-zA-Z0-9_-]+)$/.exec(callback.data ?? "");
    if (!match) {
      await telegram("answerCallbackQuery", { callback_query_id: callback.id, text: "Unknown action." }).catch(() => undefined);
      return void res.json({ ok: true });
    }
    const [, action, requestId] = match;
    const now = new Date();
    const status = action === "approve" ? "APPROVED" : "DENIED";
    const result = await prisma.adminLoginRequest.updateMany({
      where: { id: requestId, status: "PENDING", expiresAt: { gt: now } },
      data: { status, approvedAt: action === "approve" ? now : null }
    });
    await telegram("answerCallbackQuery", { callback_query_id: callback.id, text: result.count === 1 ? (action === "approve" ? "Login approved." : "Login denied.") : "Request expired or already handled." }).catch(() => undefined);
    if (callback.message) {
      await telegram("editMessageText", {
        chat_id: callback.message.chat.id,
        message_id: callback.message.message_id,
        text: result.count === 1
          ? (action === "approve" ? "My-Project login approved." : "My-Project login denied.")
          : "This login request has expired or was already handled."
      }).catch(() => undefined);
    }
    await event(result.count === 1 ? (action === "approve" ? "telegram_approval_granted" : "telegram_approval_denied") : "telegram_approval_rejected", { requestId });
    return void res.json({ ok: true });
  }
  const message = update.message;
  if (message?.text?.startsWith("/")) {
    const authorized = Boolean(ownerId && message.from && String(message.from.id) === ownerId);
    const text = authorized
      ? "My-Project Admin Security Bot\nLogin approvals are sent here automatically.\nCommands: /start, /help, /status"
      : "This bot is restricted to the configured Owner account.";
    await telegram("sendMessage", { chat_id: message.chat.id, text }).catch(() => undefined);
  }
  res.json({ ok: true });
});

export default router;
