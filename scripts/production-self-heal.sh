#!/usr/bin/env bash
set -euo pipefail

: "${RAILWAY_API_TOKEN:-}${RAILWAY_TOKEN:-}"
: "${RENDER_API_KEY:?RENDER_API_KEY is required}"
: "${RAILWAY_PROJECT_ID:?RAILWAY_PROJECT_ID is required}"
: "${RAILWAY_SERVICE_ID:?RAILWAY_SERVICE_ID is required}"
: "${RAILWAY_ENVIRONMENT_ID:?RAILWAY_ENVIRONMENT_ID is required}"
: "${RENDER_SERVICE_ID:?RENDER_SERVICE_ID is required}"
: "${BACKEND_URL:?BACKEND_URL is required}"
: "${FRONTEND_URL:?FRONTEND_URL is required}"

if [[ -n "${RAILWAY_API_TOKEN:-}" ]]; then
  unset RAILWAY_TOKEN
  export RAILWAY_API_TOKEN
  echo "==> Using Railway API token for variable management"
elif [[ -n "${RAILWAY_TOKEN:-}" ]]; then
  export RAILWAY_TOKEN
  echo "==> Using Railway project token fallback"
else
  echo "ERROR: Set RAILWAY_API_TOKEN or RAILWAY_TOKEN." >&2
  exit 1
fi

npm install --global @railway/cli >/dev/null 2>&1

railway_args=(--project "$RAILWAY_PROJECT_ID" --service "$RAILWAY_SERVICE_ID" --environment "$RAILWAY_ENVIRONMENT_ID")

echo "==> Validating Railway authentication"
if ! railway whoami >/tmp/railway-whoami.txt 2>/tmp/railway-auth-error.txt; then
  echo "ERROR: Railway authentication failed." >&2
  cat /tmp/railway-auth-error.txt >&2
  echo "Use a Railway Workspace API Token as RAILWAY_API_TOKEN for variable synchronization." >&2
  exit 1
fi
echo "✓ Railway authentication accepted"

echo "==> Reading Railway ADMIN_API_TOKEN"
TOKEN="$(railway variable list "${railway_args[@]}" --kv 2>/dev/null | sed -n 's/^ADMIN_API_TOKEN=//p' | head -n1 || true)"

if [[ -z "$TOKEN" ]]; then
  echo "==> ADMIN_API_TOKEN missing in Railway; provisioning a new 384-bit token"
  TOKEN="$(node -e 'console.log(require("crypto").randomBytes(48).toString("base64url"))')"
  printf '%s' "$TOKEN" | railway variable set ADMIN_API_TOKEN "${railway_args[@]}" --stdin >/dev/null
  echo "✓ Railway token provisioned"
else
  echo "✓ Railway token found"
fi

if [[ "${#TOKEN}" -lt 48 ]]; then
  echo "ERROR: ADMIN_API_TOKEN failed cryptographic length validation." >&2
  exit 1
fi

export ADMIN_API_TOKEN_VALUE="$TOKEN"

echo "==> Updating Render ADMIN_API_TOKEN"
curl --fail-with-body --silent --show-error \
  --request PUT \
  --url "https://api.render.com/v1/services/$RENDER_SERVICE_ID/env-vars/ADMIN_API_TOKEN" \
  --header "Authorization: Bearer $RENDER_API_KEY" \
  --header "Accept: application/json" \
  --header "Content-Type: application/json" \
  --data "$(node -e 'console.log(JSON.stringify({value:process.env.ADMIN_API_TOKEN_VALUE}))')" \
  >/dev/null
echo "✓ Render secret synchronized"

echo "==> Triggering Render deployment"
DEPLOY_ID="$(curl --fail-with-body --silent --show-error \
  --request POST \
  --url "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys" \
  --header "Authorization: Bearer $RENDER_API_KEY" \
  --header "Accept: application/json" \
  --header "Content-Type: application/json" \
  --data '{"deployMode":"build_and_deploy"}' | \
  node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const x=JSON.parse(s);process.stdout.write(x.id)})')"

echo "✓ Render deploy requested: $DEPLOY_ID"

echo "==> Waiting for Render deployment"
for attempt in {1..36}; do
  STATUS="$(curl --fail-with-body --silent --show-error \
    --url "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys/$DEPLOY_ID" \
    --header "Authorization: Bearer $RENDER_API_KEY" \
    --header "Accept: application/json" | \
    node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{const x=JSON.parse(s);process.stdout.write(x.status)})')"

  case "$STATUS" in
    live) echo "✓ Render deployment is live"; break ;;
    build_failed|update_failed|pre_deploy_failed|canceled)
      echo "ERROR: Render deployment ended with status $STATUS" >&2
      exit 1
      ;;
    *) echo "Attempt $attempt/36: Render status=$STATUS"; sleep 10 ;;
  esac
done

if [[ "$STATUS" != "live" ]]; then
  echo "ERROR: Render deployment did not become live in time." >&2
  exit 1
fi

echo "==> Running production smoke tests"

READY=0
for attempt in {1..30}; do
  if curl --fail --silent --show-error --max-time 10 "$BACKEND_URL/health" >/tmp/health.json \
    && curl --fail --silent --show-error --max-time 10 "$BACKEND_URL/api/sections" >/tmp/sections.json \
    && curl --fail --silent --show-error --max-time 15 "$FRONTEND_URL" >/tmp/frontend.html; then
    READY=1
    break
  fi
  echo "Attempt $attempt/30: production endpoints not ready"
  sleep 10
done

if [[ "$READY" -ne 1 ]]; then
  echo "ERROR: Production endpoints did not become ready within 5 minutes." >&2
  exit 1
fi

node <<'NODE'
const fs = require("fs");
const health = JSON.parse(fs.readFileSync("/tmp/health.json","utf8"));
const sections = JSON.parse(fs.readFileSync("/tmp/sections.json","utf8"));
const frontend = fs.readFileSync("/tmp/frontend.html","utf8");

if (health.success !== true || health.status !== "ok") throw new Error("Backend health check failed");
if (sections.success !== true || !Array.isArray(sections.data)) throw new Error("Public CMS response invalid");

const expected = ["HEADER","HERO","ABOUT","SERVICES","PORTFOLIO","PRICING","TESTIMONIALS","BLOG","CONTACT","FOOTER"];
const actual = new Set(sections.data.map(x => x.key));
for (const key of expected) if (!actual.has(key)) throw new Error(`Missing CMS section: ${key}`);
if (sections.data.length < 10) throw new Error("Expected at least 10 CMS sections");
if (/No published content|This site is being prepared/i.test(frontend)) throw new Error("Frontend rendered CMS empty state");

console.log("✓ Backend health");
console.log("✓ Public CMS: all 10 canonical sections");
console.log("✓ Frontend: published CMS content present");
NODE

echo "==> Verifying backend rejects unauthenticated admin access"
ADMIN_STATUS="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 10 "$BACKEND_URL/api/admin/sections")"
[[ "$ADMIN_STATUS" == "401" ]] || { echo "Expected backend admin 401, got $ADMIN_STATUS" >&2; exit 1; }
echo "✓ Backend admin auth boundary returns 401"

echo "==> Verifying frontend admin proxy with synced secret"
curl --fail-with-body --silent --show-error --max-time 15 "$FRONTEND_URL/api/admin/sections" >/tmp/admin.json
node -e 'const x=require("/tmp/admin.json");if(x.success!==true||!Array.isArray(x.data)||x.data.length<10)throw new Error("Frontend admin proxy authentication failed");console.log("✓ Frontend admin proxy authenticated successfully")'

echo "==> Testing authenticated visibility toggle + restoration"
node <<'NODE'
const fs = require("fs");
const admin = JSON.parse(fs.readFileSync("/tmp/admin.json","utf8"));
const section = admin.data[0];
if (!section?.id || typeof section.isVisible !== "boolean") throw new Error("Invalid admin section fixture");

const base = process.env.FRONTEND_URL;
const token = process.env.ADMIN_API_TOKEN_VALUE;

async function call(path, body) {
  const r = await fetch(base + path, {
    method: "PATCH",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify(body)
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`PATCH ${path} returned ${r.status}: ${text}`);
  return JSON.parse(text);
}

(async()=>{
  await call(`/api/admin/sections/${section.id}/visibility`, {isVisible: !section.isVisible});
  await call(`/api/admin/sections/${section.id}/visibility`, {isVisible: section.isVisible});

  const result = await call(`/api/admin/sections/${section.id}`, {
    title: section.title,
    content: section.content
  });
  if (result.success !== true) throw new Error("Content update response invalid");
  console.log("✓ Visibility toggle + restoration: HTTP 200");
  console.log("✓ JSON content update: HTTP 200");
})().catch(e=>{console.error(e);process.exit(1)});
NODE

echo "==> Verifying workspace routes"
for route in \
  /admin/dashboard /admin/profile /admin/settings /admin/system-config \
  /project/dashboard /project/profile /project/settings \
  /ai/chat-interface /ai/ai-bot; do
  code="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 "$FRONTEND_URL$route")"
  [[ "$code" == "200" ]] || { echo "ERROR: $route returned HTTP $code" >&2; exit 1; }
  echo "✓ $route -> 200"
done

echo "=============================================="
echo "✓ SECRET SYNC: Railway -> Render"
echo "✓ RENDER DEPLOY: live"
echo "✓ CMS DATA: 10 canonical sections"
echo "✓ ADMIN AUTH: backend + frontend proxy"
echo "✓ ADMIN MUTATIONS: visibility + JSON update"
echo "✓ WORKSPACE ROUTES: all production routes 200"
echo "=============================================="
