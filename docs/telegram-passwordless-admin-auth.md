# Telegram Passwordless Admin Authentication

## Security model
- Every login request requires approval from the numeric Telegram Owner ID configured in `OWNER_TELEGRAM_USER_ID`. Sending `/start` to the bot does not enroll or authorize an account.
- The bot token, Owner ID, webhook secret, and backend service token belong only in the backend runtime environment. Never commit real values or paste them into chat.
- Login requests expire after five minutes and are bound to independent, high-entropy polling and session tokens. Only their SHA-256 hashes are persisted.
- Sessions are stored in PostgreSQL. The HttpOnly, Secure, SameSite=Strict cookie contains a 256-bit opaque token; the backend stores only its hash.
- Absolute session lifetime is 24 hours; inactivity timeout is two hours. Each protected frontend API request checks and refreshes the backend session activity timestamp.
- Logout revokes the database session before clearing the cookie. Security events are recorded without storing secrets.
- Login status and request APIs require the private frontend-to-backend `ADMIN_API_TOKEN`. The Telegram webhook additionally validates `X-Telegram-Bot-Api-Secret-Token`.

## Required backend runtime variables
- `DATABASE_URL`
- `ADMIN_API_TOKEN` (must match the frontend runtime value)
- `TELEGRAM_BOT_TOKEN`
- `OWNER_TELEGRAM_USER_ID` (the Owner's numeric Telegram user ID, not a chat title or username)
- `TELEGRAM_WEBHOOK_SECRET` (1-256 characters from `A-Z a-z 0-9 _ -`)
- `TELEGRAM_WEBHOOK_URL` (HTTPS URL ending in `/api/telegram-auth/webhook`)

Frontend runtime also needs `NEXT_PUBLIC_API_URL` pointing to the backend and the same `ADMIN_API_TOKEN`.

## Setup and activation
1. In Telegram, open the bot and send `/start` from the Owner account first, so the bot can send approval requests to that chat.
2. Add the variables to the **backend runtime service** and frontend runtime service; never place the bot token in a `NEXT_PUBLIC_*` variable or GitHub source.
3. Apply the new Prisma migration with the existing deployment migration command. Do not run this against an unintended database.
4. After the backend is deployed and all three webhook variables are set, the backend automatically registers the webhook on startup. If needed, the same operation can be run manually from a trusted environment with `node scripts/register-telegram-webhook.mjs` and the three variables set.
5. Open `/admin-login`, request a login, and approve that specific request in the Owner's Telegram chat.
6. Verify denied/expired requests, logout, idle expiry, absolute expiry, and backend unavailability before relying on it for production administration.

## Operational notes
- The legacy `ADMIN_LOGIN_PASSWORD` variable is no longer used by the login route, but it should only be removed after confirming no other service depends on it.
- Do not enable production traffic until CI/build, migration, Telegram webhook delivery, Owner ID, and session tests pass.
