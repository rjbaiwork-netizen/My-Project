#!/usr/bin/env node
const token = process.env.TELEGRAM_BOT_TOKEN;
const url = process.env.TELEGRAM_WEBHOOK_URL;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
if (!token || !url || !secret) {
  console.error("Set TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_URL and TELEGRAM_WEBHOOK_SECRET.");
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
const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ url: url, secret_token: secret, allowed_updates: ["message", "callback_query"], drop_pending_updates: false })
});
const result = await response.json().catch(() => null);
if (!response.ok || !result?.ok) {
  console.error("Telegram webhook registration failed.");
  process.exit(1);
}
console.log("Telegram webhook registered.");
