#!/usr/bin/env node
const token = process.env.TELEGRAM_TOTPS_BOT_TOKEN;
const url = process.env.TELEGRAM_WEBHOOK_URL;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
const expectedBotId = process.env.BOT_TELEGRAM_USER_ID;
const expectedBotUsername = process.env.BOT_TELEGRAM_USERNAME?.replace(/^@/, "").toLowerCase();
if (!token || !url || !secret || !expectedBotId || !expectedBotUsername) {
  console.error("Set TELEGRAM_TOTPS_BOT_TOKEN, BOT_TELEGRAM_USER_ID, BOT_TELEGRAM_USERNAME, TELEGRAM_WEBHOOK_URL and TELEGRAM_WEBHOOK_SECRET.");
  process.exit(1);
}
const parsed = new URL(url);
if (parsed.protocol !== "https:" || !parsed.pathname.endsWith("/api/telegram-auth/webhook")) {
  console.error("TELEGRAM_WEBHOOK_URL must be HTTPS and end with /api/telegram-auth/webhook.");
  process.exit(1);
}
if (!/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
  console.error("TELEGRAM_WEBHOOK_SECRET must use Telegram's allowed secret-token characters and be 1-256 characters.");
  process.exit(1);
}
const identityResponse = await fetch(`https://api.telegram.org/bot${token}/getMe`, { signal: AbortSignal.timeout(8000) });
const identity = await identityResponse.json().catch(() => null);
if (!identityResponse.ok || !identity?.ok
    || String(identity.result?.id ?? "") !== expectedBotId
    || String(identity.result?.username ?? "").toLowerCase() !== expectedBotUsername) {
  console.error("Telegram token identity does not match BOT_TELEGRAM_USER_ID / BOT_TELEGRAM_USERNAME.");
  process.exit(1);
}
const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: url, secret_token: secret, allowed_updates: ["message", "callback_query"], drop_pending_updates: false }),
  signal: AbortSignal.timeout(8000)
});
const result = await response.json().catch(() => null);
if (!response.ok || !result?.ok) {
  console.error("Telegram webhook registration failed.");
  process.exit(1);
}
console.log("TOTPS Telegram webhook registered after bot identity verification.");
