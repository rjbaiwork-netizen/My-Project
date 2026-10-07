"use client";

import MobileAppShell from "../../../../components/layout/MobileAppShell";
import { useEffect, useState } from "react";

const api=()=>((process.env.NEXT_PUBLIC_API_URL??"").replace(/\/$/,""));
const triggers=["manual","schedule","new-content","content-updated","new-task","agent-completed","knowledge-updated","approval-completed","webhook","system-event"];
const actions=["run-agent","create-task","generate-content","update-content","search-knowledge","store-memory","request-approval","send-notification","run-agent-chain","start-automation","stop-automation"];

type Agent={id:string;name:string};
type Condition={field:string;operator:string;value:string};
type Action={type:string;[key:string]:unknown};
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
      trigger:trigger==="schedule"?{type:"schedule",intervalSeconds:Number(schedule)||3600}:{type:trigger},
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
      setMessage("Automation saved successfully. Self-healing validation passed.");
      setDiagnosis({valid:true,issues:[],fixes:repairLog,diagnosis:"Automation configuration passed validation."});
    }catch(e){setMessage(e instanceof Error?e.message:"Unable to save automation.")}finally{setBusy(false)}
  }

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

    {message&&<div className="mt-5 rounded-xl border border-white/10 bg-white/[.05] p-4 text-sm text-slate-200">{message}</div>}
    <section className="mt-6 space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-bold">Automation</h2><input value={name} onChange={e=>setName(e.target.value)} placeholder="Automation name" className="mt-4 w-full rounded-xl border border-white/10 bg-black/20 p-3"/><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" className="mt-3 min-h-24 w-full rounded-xl border border-white/10 bg-black/20 p-3"/><select value={agentId} onChange={e=>setAgentId(e.target.value)} className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900 p-3">{agents.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
      <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-bold">1. WHEN</h2><select value={trigger} onChange={e=>setTrigger(e.target.value)} className="mt-4 w-full rounded-xl border border-white/10 bg-slate-900 p-3">{triggers.map(t=><option key={t}>{t}</option>)}</select>{trigger==="schedule"&&<input value={schedule} onChange={e=>setSchedule(e.target.value)} type="number" min="60" placeholder="Interval seconds" className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 p-3"/>}</div>
      <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-bold">2. IF</h2><div className="mt-4 grid gap-2 md:grid-cols-3"><input value={conditionField} onChange={e=>setConditionField(e.target.value)} placeholder="Field" className="rounded-xl border border-white/10 bg-black/20 p-3"/><select value={conditionOperator} onChange={e=>setConditionOperator(e.target.value)} className="rounded-xl border border-white/10 bg-slate-900 p-3"><option>equals</option><option>not_equals</option><option>contains</option><option>greater_than</option><option>less_than</option></select><input value={conditionValue} onChange={e=>setConditionValue(e.target.value)} placeholder="Value" className="rounded-xl border border-white/10 bg-black/20 p-3"/></div><button onClick={addCondition} className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-sm">Add condition</button><div className="mt-3 space-y-2">{conditions.map((c,i)=><div key={i} className="rounded-lg bg-black/20 p-3 text-sm text-slate-300">{String(c.field)} {String(c.operator)} {String(c.value)} <button onClick={()=>setConditions(conditions.filter((_,n)=>n!==i))} className="float-right text-red-300">Remove</button></div>)}</div></div>
      <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-bold">3. THEN</h2><div className="mt-4 space-y-3">{steps.map((s,i)=><div key={i} className="flex gap-2"><select value={s.type} onChange={e=>setSteps(steps.map((x,n)=>n===i?{...x,type:e.target.value}:x))} className="flex-1 rounded-xl border border-white/10 bg-slate-900 p-3">{actions.map(a=><option key={a}>{a}</option>)}</select><button onClick={()=>setSteps(steps.filter((_,n)=>n!==i))} disabled={steps.length===1} className="rounded-xl border border-white/10 px-3 disabled:opacity-30">×</button></div>)}<button onClick={addStep} className="rounded-lg border border-white/10 px-3 py-2 text-sm">+ Add action</button></div></div>
      <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-bold">4. APPROVAL</h2><label className="mt-4 flex items-center gap-3 text-sm"><input type="checkbox" checked={approval} onChange={e=>setApproval(e.target.checked)}/> Require approval before execution</label><p className="mt-2 text-xs text-slate-500">Approval configuration is retained in the automation payload for the execution engine.</p></div>
      <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-bold">5. SCHEDULE</h2><p className="mt-2 text-sm text-slate-400">{trigger==="schedule"?`Runs every ${schedule} seconds.`:"Schedule is controlled by the WHEN trigger."}</p></div>
      <div className="flex justify-end"><button onClick={()=>void save()} disabled={busy||!name.trim()||!agentId} className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">{busy?"Saving…":"Save Automation"}</button></div>
    </section>
  </div></main></MobileAppShell>
}
