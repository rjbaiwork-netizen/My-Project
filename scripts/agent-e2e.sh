#!/usr/bin/env bash
set -euo pipefail

BACKEND_URL="${BACKEND_URL%/}"
AGENTS_JSON="$(curl -fsS --retry 3 --retry-all-errors "$BACKEND_URL/api/ai/agents")"

AGENT_ID="$(node -e '
const d=JSON.parse(process.argv[1]);
const a=(d.data||[]).find(x=>x.status==="ACTIVE");
if(!a) process.exit(2);
process.stdout.write(a.id);
' "$AGENTS_JSON")"

echo "✓ Active agent selected: $AGENT_ID"

RUN_RESPONSE="$(curl -fsS --retry 3 --retry-all-errors   -H 'Content-Type: application/json'   -d '{"input":{"message":"Live production E2E test: reply with a short confirmation that the AI Agent can execute successfully."}}'   "$BACKEND_URL/api/ai/agents/$AGENT_ID/run")"

RUN_ID="$(node -e '
const d=JSON.parse(process.argv[1]);
if(!d.success || !d.data?.id) process.exit(2);
process.stdout.write(d.data.id);
' "$RUN_RESPONSE")"

echo "✓ Agent run queued: $RUN_ID"

for i in $(seq 1 18); do
  RUNS_JSON="$(curl -fsS --retry 2 --retry-all-errors "$BACKEND_URL/api/ai/agents/$AGENT_ID/runs")"
  STATUS="$(node -e '
const d=JSON.parse(process.argv[1]), id=process.argv[2];
const r=(d.data||[]).find(x=>x.id===id);
process.stdout.write(r?.status||"MISSING");
' "$RUNS_JSON" "$RUN_ID")"

  echo "Agent run status: $STATUS"

  if [ "$STATUS" = "SUCCEEDED" ]; then
    node -e '
const d=JSON.parse(process.argv[1]), id=process.argv[2];
const r=(d.data||[]).find(x=>x.id===id);
if(!r?.output?.text) process.exit(3);
console.log("✓ OpenAI response received:", r.output.text.slice(0,240));
' "$RUNS_JSON" "$RUN_ID"
    echo "AI Agent live E2E PASS"
    exit 0
  fi

  if [ "$STATUS" = "FAILED" ]; then
    node -e '
const d=JSON.parse(process.argv[1]), id=process.argv[2];
const r=(d.data||[]).find(x=>x.id===id);
console.error("AI Agent run failed:", r?.error || "unknown error");
process.exit(1);
' "$RUNS_JSON" "$RUN_ID"
  fi

  sleep 5
done

echo "AI Agent live E2E TIMEOUT"
exit 1
