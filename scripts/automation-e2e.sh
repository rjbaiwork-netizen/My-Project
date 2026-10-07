#!/usr/bin/env bash
set -euo pipefail

: "${BACKEND_URL:?BACKEND_URL is required}"
: "${FRONTEND_URL:?FRONTEND_URL is required}"

echo "==> Automation Builder live E2E gate"

READY=0
for attempt in {1..18}; do
  if curl --fail --silent --show-error --max-time 10 "$BACKEND_URL/ready" >/tmp/automation-ready.json; then
    node -e 'const x=require("/tmp/automation-ready.json"); if(x.automationEngineVersion==="2.0" && x.status==="ready" && x.database==="ready" && x.worker?.started===true && !x.worker?.lastError) process.exit(0); process.exit(1);' && READY=1 && break
  fi
  echo "Attempt $attempt/18: backend/worker is not ready yet"
  sleep 10
done

if [[ "$READY" -ne 1 ]]; then
  echo "✗ Production readiness check failed: backend/worker did not become ready within 180 seconds."
  cat /tmp/automation-ready.json 2>/dev/null || true
  exit 1
fi

echo "✓ Automation engine v2 + database + worker are READY"

node <<'NODE'
const base=process.env.BACKEND_URL.replace(/\/$/,"");
const frontend=process.env.FRONTEND_URL.replace(/\/$/,"");

async function request(path,options={}){
  const r=await fetch(base+path,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})}});
  const text=await r.text();
  let body; try{body=JSON.parse(text)}catch{throw new Error(`${path}: invalid JSON HTTP ${r.status}: ${text}`)}
  if(!r.ok)throw new Error(`${path}: HTTP ${r.status}: ${text}`);
  return body;
}
async function pollRuns(id,expected,max=24){
  for(let i=0;i<max;i++){
    const x=await request(`/api/ai/automations/${id}/runs`);
    const run=x.data?.[0];
    if(run?.status===expected)return run;
    if(run?.status==="FAILED")throw new Error(`Automation run failed: ${run.error||"unknown"}`);
    await new Promise(r=>setTimeout(r,5000));
  }
  throw new Error(`Timed out waiting for ${expected}`);
}

const health=await request("/health");
if(health.automationEngineVersion!=="2.0")throw new Error("Automation engine v2 marker missing");

const diagnose=await request("/api/ai/automations/diagnose",{method:"POST",body:JSON.stringify({
  name:"Live E2E Diagnostic",
  trigger:{type:"manual"},
  conditions:[{field:"flag",operator:"equals",value:"ready"}],
  actions:[{type:"store-memory",content:"automation-live-e2e"}]
})});
if(diagnose.data?.valid!==true)throw new Error("Diagnostic endpoint rejected a valid automation");
console.log("✓ Diagnose API");

const created=await request("/api/ai/automations",{method:"POST",body:JSON.stringify({
  name:"Live E2E Condition + Memory",
  trigger:{type:"manual"},
  conditions:[{field:"flag",operator:"equals",value:"ready"}],
  actions:[{type:"store-memory",content:"automation-live-e2e"}]
})});
const automationId=created.data?.id;
if(!automationId)throw new Error("Automation creation returned no id");
const queued=await request(`/api/ai/automations/${automationId}/run`,{method:"POST",body:JSON.stringify({input:{flag:"ready"}})});
if(!queued.data?.id)throw new Error("Run queue returned no run id");
const success=await pollRuns(automationId,"SUCCEEDED");
if(!success.output?.storedMemoryId)throw new Error("Execution did not persist memory output");
console.log("✓ Manual trigger → condition → action → run history");

const approval=await request("/api/ai/automations",{method:"POST",body:JSON.stringify({
  name:"Live E2E Approval Gate",
  trigger:{type:"manual"},
  approval:{required:true,approver:"manual"},
  actions:[{type:"request-approval"},{type:"store-memory",content:"approval-live-e2e"}]
})});
const approvalId=approval.data?.id;
const approvalRun=await request(`/api/ai/automations/${approvalId}/run`,{method:"POST",body:JSON.stringify({input:{test:"approval"}})});
const waiting=await pollRuns(approvalId,"APPROVAL_REQUIRED");
if(waiting.status!=="APPROVAL_REQUIRED")throw new Error("Approval gate did not pause execution");
await request(`/api/ai/automation-runs/${approvalRun.data.id}/approve`,{method:"POST",body:JSON.stringify({approver:"live-e2e"})});
const approved=await pollRuns(approvalId,"SUCCEEDED");
if(!approved.output?.storedMemoryId)throw new Error("Approved execution did not finish action");
console.log("✓ Approval gate → approve → resume → success");

const page=await fetch(frontend+"/aisystem/automation-builder");
if(!page.ok)throw new Error(`Automation Builder frontend returned HTTP ${page.status}`);
console.log("✓ Automation Builder frontend route is reachable");

console.log("==============================================");
console.log("✓ AUTOMATION ENGINE: v2 live");
console.log("✓ DIAGNOSE: PASS");
console.log("✓ CONDITIONS: PASS");
console.log("✓ ACTION EXECUTION: PASS");
console.log("✓ RUN HISTORY: PASS");
console.log("✓ APPROVAL GATE: PASS");
console.log("✓ FRONTEND BUILDER ROUTE: PASS");
console.log("==============================================");
NODE
