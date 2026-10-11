# Dedicated TOTPS Telegram Passwordless Admin Authentication

## Separation
- This module uses only the dedicated `@TOTPS_Bot` authentication bot. It must not share or reuse the token for `@ExpertBrainAIBot`, which belongs to the separate events/documents/notifications workflow.
- Telegram updates are received using Bot API long polling (`getUpdates`); no webhook URL or webhook secret is required.
- The backend verifies `TELEGRAM_TOTPS_BOT_TOKEN` using Telegram `getMe` and compares the returned numeric ID and username to `BOT_TELEGRAM_USER_ID` and `BOT_TELEGRAM_USERNAME` before polling.
- Authorization depends on the configured numeric `OWNER_TELEGRAM_USER_ID`. The Owner username is informational only because usernames can change.

## Required backend runtime variables
- `DATABASE_URL`
- `ADMIN_API_TOKEN` (must match the frontend runtime value)
- `TELEGRAM_TOTPS_BOT_TOKEN`
- `BOT_TELEGRAM_USER_ID`
- `BOT_TELEGRAM_USERNAME` (for example, `@TOTPS_Bot`)
- `OWNER_TELEGRAM_USER_ID` (numeric Telegram user ID)
- `OWNER_TELEGRAM_USERNAME` (informational; never the sole authorization check)

Frontend runtime also needs `NEXT_PUBLIC_API_URL` pointing to the Railway backend and the same `ADMIN_API_TOKEN`.

## Setup
1. Put the bot token and identity values in Railway **backend service Variables**, not in source code or any `NEXT_PUBLIC_*` variable.
2. Set the same `ADMIN_API_TOKEN` value in the Railway backend and Render frontend runtime.
3. In Telegram, open the dedicated bot as the Owner and send `/start` at least once so the bot can send private login approval requests.
4. Keep the backend at exactly one active replica while this process owns the bot's long-polling connection. Do not run a second poller for the same bot token.
5. Apply the existing Prisma migration using the deployment migration command against the intended database only.
6. Open `/admin-login`, request a login, then approve or deny that specific browser request in the Owner's Telegram chat.

## Security controls
- Login requests expire after five minutes and are bound to independent, high-entropy polling and session tokens. Only SHA-256 hashes are persisted.
- The callback handler accepts approval/denial only when the callback sender's numeric Telegram ID matches `OWNER_TELEGRAM_USER_ID`.
- Sessions are stored in PostgreSQL. The HttpOnly, Secure, SameSite=Strict cookie contains a 256-bit opaque token; the backend stores only its hash.
- Absolute session lifetime is 24 hours; inactivity timeout is two hours. Logout revokes the database session before clearing the cookie.
- Private login APIs require the frontend-to-backend `ADMIN_API_TOKEN`. Security events are recorded without storing tokens or passwords.
- `ADMIN_LOGIN_PASSWORD` is not used by this Telegram login route; remove it from other runtime/CI configurations only after confirming no other workflow depends on it.

## Validation
- CI must pass monorepo builds, Prisma schema validation, and admin-auth security tests.
- Before production use, verify a fresh login request, Owner approval, denial, expiry, logout revocation, idle timeout, and behavior when Telegram is unavailable.
- GitHub Repository Secrets are used by workflows only when explicitly mapped into a workflow; they do not automatically become Railway runtime Variables.
