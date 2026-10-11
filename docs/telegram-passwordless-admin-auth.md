# Dedicated TOTPS Telegram Passwordless Admin Authentication

## Separation
- This module uses only the dedicated `@TOTPS_Bot` authentication bot. It must not share or reuse the token for `@ExpertBrainAIBot`, which belongs to the separate events/documents/notifications workflow.
- Telegram updates are received using Bot API long polling (`getUpdates`); no webhook URL or webhook secret is required.
- The backend verifies `TELEGRAM_TOTPS_BOT_TOKEN` using Telegram `getMe` and compares the returned numeric ID and username to `BOT_TELEGRAM_USER_ID` and `BOT_TELEGRAM_USERNAME` before polling.
- Authorization depends on the configured numeric `OWNER_TELEGRAM_USER_ID`. The Owner username is informational only because usernames can change.

## Required backend runtime variables
- `DATABASE_URL`
- `ADMIN_API_TOKEN` (derived from the existing `ADMIN_LOGIN_PASSWORD` secret by the GitHub Actions sync workflow; no separate GitHub Secret is needed)
- `TELEGRAM_TOTPS_BOT_TOKEN`
- `BOT_TELEGRAM_USER_ID`
- `BOT_TELEGRAM_USERNAME` (for example, `@TOTPS_Bot`)
- `OWNER_TELEGRAM_USER_ID` (numeric Telegram user ID)
- `OWNER_TELEGRAM_USERNAME` (informational; never the sole authorization check)

Frontend runtime also needs `NEXT_PUBLIC_API_URL` pointing to the Railway backend and the same derived `ADMIN_API_TOKEN`.

## Setup
1. Keep the real bot token and identity values in GitHub Repository Secrets only; the sync workflow sends the bot token to the Railway backend and never to Render or a `NEXT_PUBLIC_*` variable. The token must exist as `TELEGRAM_TOTPS_BOT_TOKEN` for this to work.
2. The sync workflow derives `ADMIN_API_TOKEN` from the existing `ADMIN_LOGIN_PASSWORD` using SHA-256 with a fixed context string, then sets the same value in Railway and Render. Use a strong password and rerun the workflow after rotating it.
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
- The workflow `.github/workflows/sync-telegram-secrets.yml` copies the dedicated Telegram secrets from GitHub Actions into the Railway backend and copies only `ADMIN_API_TOKEN` plus `NEXT_PUBLIC_API_URL` into Render. Bot credentials must never be sent to Render.
- GitHub Secrets do not automatically trigger a workflow when their values change. After rotating a secret, manually run **Sync GitHub Secrets to My-Project runtimes** from GitHub Actions.
- The current reported repository-secret list does not include `TELEGRAM_TOTPS_BOT_TOKEN`. If it is not already stored under that exact name, the workflow cannot sync the real bot credential from GitHub; do not substitute `ADMIN_LOGIN_PASSWORD`, Railway credentials, or a username.
- No separate `ADMIN_API_TOKEN` GitHub Secret is required; the workflow derives a service credential from `ADMIN_LOGIN_PASSWORD`. Do not use a Telegram bot token as the service-to-service credential.
- This sync workflow is in the feature branch until PR #43 is merged; it cannot sync production from the draft PR. Production Telegram login is not active until the PR is reviewed/merged, the workflow runs successfully, and the Owner starts the bot with `/start`.
