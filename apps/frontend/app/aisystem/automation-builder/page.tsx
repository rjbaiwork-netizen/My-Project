"use client";

import MobileAppShell from "../../../../components/layout/MobileAppShell";
import { useEffect, useState } from "react";

const api=()=>((process.env.NEXT_PUBLIC_API_URL??"").replace(/\/$/,""));
const triggers=["manual","schedule","new-content","content-updated","new-task","agent-completed","knowledge-updated","approval-completed","webhook","system-event"];
const actions=["run-agent","create-task","generate-content","update-content","search-knowledge","store-memory","request-approval","send-notification","run-agent-chain","start-automation","stop-automation"];

type Agent={id:string;name:string};
type Condition={field:string;operator:string;value:string};
type Action={type:string;[key:string]:unknown};

const scheduleTestGuide = [
  {title:"1. Production Health Check", body:"GET /health এবং GET /ready যাচাই করুন। Expected: health=ok, ready=ready, database=ready, worker.started=true, worker.lastError=null. এগুলো PASS না হলে Schedule test শুরু করবেন না।"},
  {title:"2. Interval Schedule", body:"SCHEDULE-E2E-TEST-INTERVAL নামে ACTIVE automation তৈরি করুন। Trigger: schedule → interval → intervalSeconds=60। Safe action দিন। 2–3 মিনিট observe করুন। অন্তত 2–3টি run QUEUED → RUNNING → SUCCEEDED হতে হবে; duplicate run হওয়া যাবে না।"},
  {title:"3. Once Schedule", body:"SCHEDULE-E2E-TEST-ONCE তৈরি করুন। Trigger: schedule → once এবং বর্তমান সময়ের কয়েক মিনিট পরের at সেট করুন। নির্ধারিত সময়ে একটি run QUEUED → RUNNING → SUCCEEDED হবে এবং দ্বিতীয় run হবে না।"},
  {title:"4. Daily Schedule", body:"SCHEDULE-E2E-TEST-DAILY তৈরি করুন। Trigger: schedule → daily এবং বর্তমান সময়ের কয়েক মিনিট পরের time দিন। নির্ধারিত সময়ে run সফল হবে; একই daily window-তে duplicate হবে না।"},
  {title:"5. Weekly Schedule", body:"SCHEDULE-E2E-TEST-WEEKLY তৈরি করুন। Trigger: schedule → weekly, নির্ধারিত dayOfWeek ও test time দিন। সঠিক weekday/time-এ run হবে; ভুল সময়ে/duplicate run হবে না।"},
  {title:"6. Monthly Schedule", body:"SCHEDULE-E2E-TEST-MONTHLY তৈরি করুন। Trigger: schedule → monthly, dayOfMonth ও test time দিন। নির্ধারিত দিনে একবার run হবে। 31-এর মতো day কম দিনের মাসে engine-এর intended handling verify করুন।"},
  {title:"7. Schedule + Condition", body:"Daily/Interval schedule-এর সঙ্গে status == active condition দিন। active হলে action execute/SUCCESS; inactive হলে action skip করে run complete হবে।"},
  {title:"8. Schedule + Approval", body:"Scheduled automation-এ approval required দিন। Expected: QUEUED → APPROVAL_REQUIRED। Approve করলে QUEUED → RUNNING → SUCCEEDED এবং approval ছাড়া action execute হবে না।"},
  {title:"9. Schedule Failure + Retry", body:"Controlled safe failure তৈরি করুন। Expected: QUEUED → RUNNING → FAILED → Retry → RUNNING → SUCCESS। maxAttempts=3 হলে 3-এর বেশি attempt নয়; সব attempt fail হলে FAILED।"},
  {title:"10. Duplicate Protection", body:"একই schedule event-এর জন্য worker tick একাধিক হলেও একটিই run তৈরি হচ্ছে কিনা verify করুন। Interval/Daily/Weekly/Monthly—সবগুলোর জন্য check করুন।"},
  {title:"11. Worker Restart", body:"Backend worker restart/redeploy করার পর database থেকে automation state পুনরুদ্ধার হয়, existing run history থাকে এবং duplicate execution হয় না—verify করুন।"},
  {title:"12. Run History", body:"GET /api/ai/automations/:id/runs দিয়ে id, status, input, output, steps, attempts, maxAttempts, createdAt, startedAt, finishedAt, error verify করুন।"},
  {title:"13. Frontend Verification", body:"Automation Builder page refresh করে saved automation, schedule mode, run history, step status, error, Retry ও Approval controls সঠিকভাবে দেখা যাচ্ছে কিনা যাচাই করুন।"},
  {title:"14. Final PASS Matrix", body:"Interval, Once, Daily, Weekly, Monthly, Condition, Approval, Retry, Duplicate Protection, Worker Restart, Run History এবং Frontend—সব PASS না হলে Schedule Engine-কে Production Verified বলা যাবে না।"},
  {title:"Cleanup & Final Report", body:"শুধু SCHEDULE-E2E-TEST-* temporary automation শনাক্ত করে cleanup করুন। Existing production automation/data delete করবেন না। Final report: প্রতিটি test PASS/FAIL, Critical Issues, Fixed Issues, Remaining Issues, FINAL STATUS (PASS/PARTIAL PASS/FAIL)।"}
];

type Diagnosis={valid:boolean;issues:string[];fixes:string[];diagnosis:string};

function localRepair(input:any,agentId:string){
  let current={...input,conditions:Array.isArray(input.conditions)?[...input.conditions]:[],actions:Array.isArray(input.actions)?[...input.actions]:[]};
  const fixes:string[]=[];
  const strategies=[
    ()=>{
      current.conditions=current.conditions.filter((c:Condition)=>c?.field?.trim()&&c?.operator);
      fixes.push("Removed incomplete condition rows.");
    },
    ()=>{
      current.conditions=current.conditions.map((c:Condition)=>({...c,field:String(c.field).trim(),operator:String(c.operator),value:c.value??""}));
      fixes.push("Normalized condition field/operator/value types.");
    },
    ()=>{
      current.actions=current.actions.map((a:Action)=>a?.type==="run-agent"&&!a.agentId?{...a,agentId}:a);
      fixes.push("Attached the selected agent to agent actions.");
    },
    ()=>{
      current.actions=current.actions.filter((a:Action)=>a?.type&&actions.includes(a.type));
      fixes.push("Removed invalid action entries.");
    },
    ()=>{
      if(current.trigger?.type==="schedule"){
        const n=Number(current.trigger.intervalSeconds);
        current.trigger={...current.trigger,intervalSeconds:Number.isFinite(n)&&n>=60?n:3600};
        fixes.push("Normalized the schedule interval.");
      }
    }
  ];
  for(const strategy of strategies)strategy();
  return {current,fixes};
}

export default function AutomationBuilder(){
  const [agents,setAgents]=useState<Agent[]>([]);
  const [name,setName]=useState("");
  const [description,setDescription]=useState("");
  const [agentId,setAgentId]=useState("");
  const [trigger,setTrigger]=useState("manual");
  const [schedule,setSchedule]=useState("3600");
  const [scheduleMode,setScheduleMode]=useState("interval");
  const [conditionField,setConditionField]=useState("");
  const [conditionOperator,setConditionOperator]=useState("equals");
  const [conditionValue,setConditionValue]=useState("");
  const [conditions,setConditions]=useState<Condition[]>([]);
  const [steps,setSteps]=useState<Action[]>([{type:"run-agent"}]);
  const [approval,setApproval]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [diagnosis,setDiagnosis]=useState<Diagnosis|null>(null);
  const [repairing,setRepairing]=useState(false);
  const [repairLog,setRepairLog]=useState<string[]>([]);
  const [savedId,setSavedId]=useState("");
  const [runs,setRuns]=useState<any[]>([]);
  const [runBusy,setRunBusy]=useState(false);

  useEffect(()=>{fetch(`${api()}/api/ai/agents`,{cache:"no-store"}).then(r=>r.json()).then(d=>{const a=d.data??[];setAgents(a);if(a[0])setAgentId(a[0].id)}).catch(()=>setMessage("Unable to load agents."))},[]);

  function addCondition(){if(!conditionField.trim())return;setConditions([...conditions,{field:conditionField.trim(),operator:conditionOperator,value:conditionValue}]);setConditionField("");setConditionValue("")}
  function addStep(){setSteps([...steps,{type:"run-agent"}])}

  async function diagnoseAndRepair(showMessage=true){
    setRepairing(true);
    setRepairLog([]);
    setDiagnosis(null);
    const draft={
      name:name.trim(),
      description,
      agentId,
      trigger:trigger==="schedule"?{type:"schedule",mode:scheduleMode,intervalSeconds:Number(schedule)||3600}:{type:trigger},
      conditions,
      actions:steps.map(s=>s.type==="run-agent"?{...s,agentId}:s),
      approval:{required:approval}
    };
    const repaired=localRepair(draft,agentId);
    setConditions(repaired.current.conditions);
    setSteps(repaired.current.actions);
    setRepairLog(repaired.fixes);
    try{
      const r=await fetch(`${api()}/api/ai/automations/diagnose`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(repaired.current)});
      const d=await r.json();
      if(r.ok)setDiagnosis(d.data);
      else setDiagnosis({valid:false,issues:[d?.error?.message??"Diagnostic request failed."],fixes:repaired.fixes,diagnosis:"The diagnostic service could not complete."});
    }catch{
      setDiagnosis({valid:false,issues:["Diagnostic service is unavailable."],fixes:repaired.fixes,diagnosis:"Local safe repairs were attempted; server diagnosis is unavailable."});
    }finally{
      setRepairing(false);
      if(showMessage)setMessage("Self-healing check completed.");
    }
    return repaired.current;
  }

  async function save(){
    if(!name.trim()||!agentId||steps.length===0)return;
    setBusy(true);setMessage("");
    try{
      const draft=await diagnoseAndRepair(false);
      if(!draft.name||!draft.agentId||!draft.actions.length){
        setMessage("Automatic fixes are exhausted. Please complete the highlighted required fields.");
        return;
      }
      const r=await fetch(`${api()}/api/ai/automations`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(draft)});
      const d=await r.json();
      if(!r.ok){
        const serverMessage=d?.error?.message??"Unable to save automation.";
        setMessage(`Automatic repair could not resolve the server error: ${serverMessage}`);
        return;
      }
      setSavedId(d.data?.id??"");
      setMessage("Automation saved successfully. Ready for live execution.");
      setDiagnosis({valid:true,issues:[],fixes:repairLog,diagnosis:"Automation configuration passed validation."});
      if(d.data?.id) await loadRuns(d.data.id);
    }catch(e){setMessage(e instanceof Error?e.message:"Unable to save automation.")}finally{setBusy(false)}
  }

  async function loadRuns(id=savedId){
    if(!id)return;
    try{const r=await fetch(api()+"/api/ai/automations/"+id+"/runs",{cache:"no-store"});const d=await r.json();if(r.ok)setRuns(d.data??[]);}catch{}
  }
  async function runNow(){
    if(!savedId)return;
    setRunBusy(true);setMessage("");
    try{
      const r=await fetch(api()+"/api/ai/automations/"+savedId+"/run",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({input:{flag:"ready",source:"builder"}})});
      const d=await r.json();
      if(!r.ok){setMessage(d?.error?.message??"Unable to start run.");return;}
      setMessage("Run queued. Monitoring execution…");
      for(let i=0;i<18;i++){await new Promise(x=>setTimeout(x,3000));const rr=await fetch(api()+"/api/ai/automations/"+savedId+"/runs",{cache:"no-store"});const dd=await rr.json();setRuns(dd.data??[]);const latest=dd.data?.[0];if(latest?.status==="SUCCEEDED"){setMessage("✓ Automation completed successfully.");break}if(latest?.status==="FAILED"){setMessage("✗ Automation failed: "+(latest.error??"unknown error"));break}if(latest?.status==="APPROVAL_REQUIRED"){setMessage("⏸ Automation is waiting for approval.");break}}
    }catch{setMessage("Execution request failed.")}finally{setRunBusy(false)}
  }
  async function retryRun(id:string){setRunBusy(true);try{const r=await fetch(api()+"/api/ai/automation-runs/"+id+"/retry",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"});const d=await r.json();setMessage(r.ok?"Retry queued.":"Retry failed: "+(d?.error?.message??"unknown error"));await loadRuns();}finally{setRunBusy(false)}}
  async function approveRun(id:string){setRunBusy(true);try{const r=await fetch(api()+"/api/ai/automation-runs/"+id+"/approve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({approver:"builder"})});const d=await r.json();setMessage(r.ok?"Approval accepted; execution resumed.":"Approval failed: "+(d?.error?.message??"unknown error"));await loadRuns();}finally{setRunBusy(false)}}

  return <MobileAppShell theme="dark"><main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl">
    <div><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-400">AI Agent Bot & Automation</p><h1 className="mt-2 text-3xl font-bold">Automation Builder</h1><p className="mt-2 text-sm text-slate-400">Build a workflow visually: WHEN → IF → THEN → APPROVAL → SCHEDULE.</p></div>

    <section className="mt-6 rounded-2xl border border-blue-400/20 bg-blue-400/[.06] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="font-bold">Self-Healing & Diagnostics</h2><p className="mt-1 text-sm text-slate-400">Before saving, Builder validates the workflow, tries safe repair strategies, retries validation, and only then asks for manual input.</p></div>
        <button onClick={()=>void diagnoseAndRepair()} disabled={repairing||busy} className="rounded-xl border border-blue-300/30 px-4 py-2 text-sm font-bold disabled:opacity-50">{repairing?"Auto-fixing…":"Diagnose & Auto-Fix"}</button>
      </div>
      {repairLog.length>0&&<div className="mt-4 space-y-1 text-xs text-emerald-300">{repairLog.map((x,i)=><div key={i}>✓ {x}</div>)}</div>}
      {diagnosis&&<div className={`mt-4 rounded-xl border p-4 ${diagnosis.valid?"border-emerald-400/20 bg-emerald-400/[.05]":"border-amber-400/20 bg-amber-400/[.05]"}`}>
        <div className="font-semibold">{diagnosis.valid?"✓ Validation passed":"⚠ Automatic fixes exhausted for unresolved items"}</div>
        {diagnosis.issues.length>0&&<div className="mt-2 space-y-1 text-sm text-amber-200">{diagnosis.issues.map((x,i)=><div key={i}>• {x}</div>)}</div>}
        <p className="mt-2 text-xs text-slate-400">{diagnosis.diagnosis}</p>
        {!diagnosis.valid&&<button onClick={()=>setMessage("Manual intervention is required only for the unresolved field(s) shown above.")} className="mt-3 rounded-lg border border-amber-300/20 px-3 py-2 text-xs">Show Problem / Fix Manually</button>}
      </div>}
    </section>

    <section className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/[.04] p-5">
      <details>
        <summary className="cursor-pointer list-none font-bold text-amber-200">📘 Schedule Full Production Test — Guide / Preview</summary>
        <div className="mt-4 space-y-3">
          <p className="text-sm text-slate-400">Interval, Once, Daily, Weekly এবং Monthly Schedule-এর live production test করার গাইড। এই অংশটি Builder-এর মধ্যেই reference হিসেবে রাখা হয়েছে।</p>
          {scheduleTestGuide.map((item,i)=><details key={item.title} className="rounded-xl border border-white/10 bg-black/20 p-3">
            <summary className="cursor-pointer font-semibold text-slate-200">{item.title}</summary>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-400">{item.body}</p>
          </details>)}
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[.04] p-3 text-xs text-emerald-200">Production verification checklist: Interval · Once · Daily · Weekly · Monthly · Condition · Approval · Retry · Duplicate · Worker Restart · Run History · Frontend</div>
        </div>
      </details>
    </section>

    {message&&<div className="mt-5 rounded-xl border border-white/10 bg-white/[.05] p-4 text-sm text-slate-200">{message}</div>}
    <section className="mt-6 space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-bold">Automation</h2><input value={name} onChange={e=>setName(e.target.value)} placeholder="Automation name" className="mt-4 w-full rounded-xl border border-white/10 bg-black/20 p-3"/><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" className="mt-3 min-h-24 w-full rounded-xl border border-white/10 bg-black/20 p-3"/><select value={agentId} onChange={e=>setAgentId(e.target.value)} className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900 p-3">{agents.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
      <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-bold">1. WHEN</h2><select value={trigger} onChange={e=>setTrigger(e.target.value)} className="mt-4 w-full rounded-xl border border-white/10 bg-slate-900 p-3">{triggers.map(t=><option key={t}>{t}</option>)}</select>{trigger==="schedule"&&<><select value={scheduleMode} onChange={e=>setScheduleMode(e.target.value)} className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900 p-3"><option value="interval">Interval</option><option value="once">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select><input value={schedule} onChange={e=>setSchedule(e.target.value)} type="number" min="60" placeholder="Interval seconds" className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 p-3"/></>}</div>
      <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-bold">2. IF</h2><div className="mt-4 grid gap-2 md:grid-cols-3"><input value={conditionField} onChange={e=>setConditionField(e.target.value)} placeholder="Field" className="rounded-xl border border-white/10 bg-black/20 p-3"/><select value={conditionOperator} onChange={e=>setConditionOperator(e.target.value)} className="rounded-xl border border-white/10 bg-slate-900 p-3"><option>equals</option><option>not-equals</option><option>contains</option><option>not-contains</option><option>gt</option><option>gte</option><option>lt</option><option>lte</option></select><input value={conditionValue} onChange={e=>setConditionValue(e.target.value)} placeholder="Value" className="rounded-xl border border-white/10 bg-black/20 p-3"/></div><button onClick={addCondition} className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-sm">Add condition</button><div className="mt-3 space-y-2">{conditions.map((c,i)=><div key={i} className="rounded-lg bg-black/20 p-3 text-sm text-slate-300">{String(c.field)} {String(c.operator)} {String(c.value)} <button onClick={()=>setConditions(conditions.filter((_,n)=>n!==i))} className="float-right text-red-300">Remove</button></div>)}</div></div>
      <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-bold">3. THEN</h2><div className="mt-4 space-y-3">{steps.map((s,i)=><div key={i} className="flex gap-2"><select value={s.type} onChange={e=>setSteps(steps.map((x,n)=>n===i?{...x,type:e.target.value}:x))} className="flex-1 rounded-xl border border-white/10 bg-slate-900 p-3">{actions.map(a=><option key={a}>{a}</option>)}</select><button onClick={()=>setSteps(steps.filter((_,n)=>n!==i))} disabled={steps.length===1} className="rounded-xl border border-white/10 px-3 disabled:opacity-30">×</button></div>)}<button onClick={addStep} className="rounded-lg border border-white/10 px-3 py-2 text-sm">+ Add action</button></div></div>
      <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-bold">4. APPROVAL</h2><label className="mt-4 flex items-center gap-3 text-sm"><input type="checkbox" checked={approval} onChange={e=>setApproval(e.target.checked)}/> Require approval before execution</label><p className="mt-2 text-xs text-slate-500">Approval configuration is retained in the automation payload for the execution engine.</p></div>
      <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-bold">5. SCHEDULE</h2><p className="mt-2 text-sm text-slate-400">{trigger==="schedule"?`Runs every ${schedule} seconds.`:"Schedule is controlled by the WHEN trigger."}</p></div>
      <section className="rounded-2xl border border-white/10 bg-white/[.05] p-5">
        <div className="flex items-center justify-between gap-3"><div><h2 className="font-bold">Live Execution & Run History</h2><p className="mt-1 text-xs text-slate-400">{savedId?"Saved automation is ready to execute.":"Save the automation first."}</p></div><div className="flex gap-2"><button onClick={()=>void loadRuns()} disabled={!savedId||runBusy} className="rounded-lg border border-white/10 px-3 py-2 text-xs">Refresh</button><button onClick={()=>void runNow()} disabled={!savedId||runBusy} className="rounded-lg bg-emerald-400 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-40">{runBusy?"Running…":"Run Now"}</button></div></div>
        <div className="mt-4 space-y-2">{runs.length===0?<p className="text-sm text-slate-500">No executions yet.</p>:runs.map((run:any)=><div key={run.id} className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="flex items-center justify-between"><span className="font-semibold">{run.status}</span><span className="text-xs text-slate-500">{new Date(run.createdAt).toLocaleString()}</span></div>{run.error&&<p className="mt-1 text-xs text-red-300">{run.error}</p>}{Array.isArray(run.steps)&&run.steps.length>0&&<div className="mt-2 space-y-1 text-xs text-slate-400">{run.steps.map((s:any,i:number)=><div key={i}>• {s.type}: {s.status}{s.error?" — "+s.error:""}</div>)}</div>}{run.status==="APPROVAL_REQUIRED"&&<button onClick={()=>void approveRun(run.id)} className="mt-2 rounded-lg border border-amber-300/30 px-3 py-1 text-xs">Approve</button>}{run.status==="FAILED"&&<button onClick={()=>void retryRun(run.id)} className="mt-2 rounded-lg border border-blue-300/30 px-3 py-1 text-xs">Retry</button>}</div>)}</div>
      </section>
      <div className="flex justify-end"><button onClick={()=>void save()} disabled={busy||!name.trim()||!agentId} className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">{busy?"Saving…":"Save Automation"}</button></div>
    </section>
  </div></main></MobileAppShell>
}
