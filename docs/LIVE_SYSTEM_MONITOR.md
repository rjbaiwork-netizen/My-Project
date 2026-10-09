# Live System Monitor — platform API setup

The Admin Panel monitor checks the app's backend health/readiness and GitHub's public `main` commit. Platform deployment history is fetched server-side and is shown as not connected until its credential is configured.

## Render frontend service environment

Set these in the Render service environment (not in the browser, source code, or public `NEXT_PUBLIC_*` variables):

- `RENDER_API_KEY` — a Render API key with read access to the My-Project service/deployments.
- `RENDER_SERVICE_ID` — defaults to `srv-db2e1dm0tbcc738tfkk0`; override only if the service changes.
- `RAILWAY_PROJECT_TOKEN` — preferred: a Railway project token scoped to the My-Project production project/environment; OR
- `RAILWAY_API_TOKEN` — an account/workspace token with read access to the project. Do not set both unless you intend to prefer the project token.
- `RAILWAY_PROJECT_ID` — defaults to `828ab857-c542-4cc1-b1de-6cb1a7b155d5`.
- `RAILWAY_ENVIRONMENT_ID` — defaults to `bbb86f7a-4adb-4d60-b790-73276a65958e`.
- `RAILWAY_SERVICE_ID` — defaults to `8d0e4be9-457d-4b49-b81d-3e375240559a`.

The existing `NEXT_PUBLIC_API_URL` and `ADMIN_API_TOKEN` variables must also remain configured. The monitor API verifies admin access against the backend's protected workspace endpoint before returning monitoring data.

## Token handling and behavior

- Tokens are used only in the Next.js server route and are never returned to the browser.
- Render uses `Authorization: Bearer <RENDER_API_KEY>`.
- Railway project tokens use the `Project-Access-Token` header; account/workspace tokens use `Authorization: Bearer`.
- The monitor only reads recent deployment records; it does not trigger deploys, restart services, or mutate database data.
- Missing tokens appear as `Not connected`. Invalid tokens or API failures appear as `Unavailable` with a safe diagnostic message.
- Failed/crashed deployments in the latest five records are surfaced as recent deployment errors. This is not a replacement for full provider build/runtime log access.

## After setting variables

1. Save the variables on the Render frontend service and allow Render to redeploy.
2. Open `/admin/monitoring` while signed in/authorized.
3. Use **Refresh now** and confirm Render/Railway deployment history is returned.
4. Verify the token scopes and IDs if either provider remains unavailable.
