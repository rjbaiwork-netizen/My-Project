# Live System Monitor — platform API setup

The Admin Monitor automatically displays application health/readiness, integration configuration status, GitHub's public main commit and recent GitHub Actions runs, Render/Railway deployments and logs when authorized, rule-based diagnosis recommendations, Feature Registry, and Update History. No separate `MONITOR_ACCESS_TOKEN` is required.

## Render frontend service environment

For backend health/readiness, keep these server-side variables configured:

- `NEXT_PUBLIC_API_URL`
- `ADMIN_API_TOKEN` — server-side service credential used to check the protected backend workspace endpoint.

For private platform deployment history and logs, set provider credentials on the Render frontend service (not in browser code, source code, or public `NEXT_PUBLIC_*` variables):

- `RENDER_API_KEY` — Render API key with read access to the My-Project service/deployments.
- `RENDER_SERVICE_ID` — defaults to `srv-db2e1dm0tbcc738tfkk0`.
- `RENDER_OWNER_ID` — defaults to `tea-d6vpjsnkijhs73d06c6g`.
- `RAILWAY_PROJECT_TOKEN` — preferred project-scoped token; OR
- `RAILWAY_API_TOKEN` — account/workspace token with read access. If both exist, project token is preferred.
- `RAILWAY_PROJECT_ID`, `RAILWAY_ENVIRONMENT_ID`, `RAILWAY_SERVICE_ID` — defaults are defined in the monitor route and may be overridden if resources change.

## Behavior and security

- The separate monitor access-token prompt has been removed.
- App health and the feature registry do not require a user-entered token.
- Render and Railway API credentials are still required to retrieve private provider deployment history/logs. Without them, those cards show `Not connected`.
- Provider tokens are used only server-side and are never returned to the browser.
- API Connection Center reports only whether required credentials are configured; it never returns credential values. GitHub Actions run metadata is read from the repository's public Actions API; private-repository workflow data may need a server-side GitHub token in a future enhancement.
- Automated Diagnosis uses explicit status rules to suggest checks. It is not a guaranteed root-cause analysis or an AI-generated diagnosis.
- The monitor performs read-only checks; it does not trigger deployments, restart services, or mutate database data.
- Render warning/error logs from the last 24 hours and Railway logs for recent failed deployments are shown when provider API access permits.
- The monitoring and registry endpoints are readable without a separate monitor token. Do not put sensitive secrets or private personal data in the registry.

## After deployment

1. Open `/admin/monitoring`; it should load without a token prompt.
2. Confirm health/readiness and Feature Registry/Update History render.
3. Add provider credentials in Render environment settings if you want private deployment history and logs.
4. Confirm the Render deployment succeeds before treating this change as live.
