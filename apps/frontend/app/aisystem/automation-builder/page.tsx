"use client";

import MobileAppShell from "../../../../components/layout/MobileAppShell";
import { useEffect, useState } from "react";

const api=()=>((process.env.NEXT_PUBLIC_API_URL??"").replace(/\/$/,""));
const triggers=["manual","schedule","new-content","content-updated","new-task","agent-completed","knowledge-updated","approval-completed","webhook","system-event"];
const actions=["run-agent","create-task","generate-content","update-content","search-knowledge","store-memory","request-approval","send-notification","run-agent-chain","start-automation","stop-automation"];

type Agent={id:string;name:string};
type Condition={field:string;operator:string;value:string};
type Action={type:string;[key:string]:unknown};

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

  useEffect(()=>{fetch(`${api()}/api/ai/agents`,{cache:"no-store"}).then(r=>r.json()).then(d=>{const a=d.data??[];setAgents(a);if(a[0])setAgentId(a[0].id)}).catch(()=>setMessage("Unable to load agents."))},[]);

  function addCondition(){if(!conditionField.trim())return;setConditions([...conditions,{field:conditionField.trim(),operator:conditionOperator,value:conditionValue}]);setConditionField("");setConditionValue("")}
  function addStep(){setSteps([...steps,{type:"run-agent"}])}
  async function save(){
    if(!name.trim()||!agentId||steps.length===0)return;
    setBusy(true);setMessage("");
    try{
      const actions=steps.map(s=>s.type==="run-agent"?{...s,agentId}:s);
      const r=await fetch(`${api()}/api/ai/automations`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        name:name.trim(),description,agentId,
        trigger:trigger==="schedule"?{type:"schedule",intervalSeconds:Number(schedule)||3600}:{type:trigger},
        conditions,
        actions,
        approval:{required:approval},
      })});
      const d=await r.json();if(!r.ok)throw Error(d?.error?.message??"Unable to save automation.");
      setMessage("Automation saved successfully.");
    }catch(e){setMessage(e instanceof Error?e.message:"Unable to save automation.")}finally{setBusy(false)}
  }

  return <MobileAppShell theme="dark"><main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-5xl">
    <div><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-400">AI Agent Bot & Automation</p><h1 className="mt-2 text-3xl font-bold">Automation Builder</h1><p className="mt-2 text-sm text-slate-400">Build a workflow visually: WHEN → IF → THEN → APPROVAL → SCHEDULE.</p></div>
    {message&&<div className="mt-5 rounded-xl border border-white/10 bg-white/[.05] p-4 text-sm text-slate-200">{message}</div>}
    <section className="mt-6 space-y-5">
      <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-bold">Automation</h2><input value={name} onChange={e=>setName(e.target.value)} placeholder="Automation name" className="mt-4 w-full rounded-xl border border-white/10 bg-black/20 p-3"/><textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" className="mt-3 min-h-24 w-full rounded-xl border border-white/10 bg-black/20 p-3"/><select value={agentId} onChange={e=>setAgentId(e.target.value)} className="mt-3 w-full rounded-xl border border-white/10 bg-slate-900 p-3">{agents.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
      <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-bold">1. WHEN</h2><select value={trigger} onChange={e=>setTrigger(e.target.value)} className="mt-4 w-full rounded-xl border border-white/10 bg-slate-900 p-3">{triggers.map(t=><option key={t}>{t}</option>)}</select>{trigger==="schedule"&&<input value={schedule} onChange={e=>setSchedule(e.target.value)} type="number" min="60" placeholder="Interval seconds" className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 p-3"/>}</div>
      <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-bold">2. IF</h2><div className="mt-4 grid gap-2 md:grid-cols-3"><input value={conditionField} onChange={e=>setConditionField(e.target.value)} placeholder="Field" className="rounded-xl border border-white/10 bg-black/20 p-3"/><select value={conditionOperator} onChange={e=>setConditionOperator(e.target.value)} className="rounded-xl border border-white/10 bg-slate-900 p-3"><option>equals</option><option>not_equals</option><option>contains</option><option>greater_than</option><option>less_than</option></select><input value={conditionValue} onChange={e=>setConditionValue(e.target.value)} placeholder="Value" className="rounded-xl border border-white/10 bg-black/20 p-3"/></div><button onClick={addCondition} className="mt-3 rounded-lg border border-white/10 px-3 py-2 text-sm">Add condition</button><div className="mt-3 space-y-2">{conditions.map((c,i)=><div key={i} className="rounded-lg bg-black/20 p-3 text-sm text-slate-300">{String(c.field)} {String(c.operator)} {String(c.value)} <button onClick={()=>setConditions(conditions.filter((_,n)=>n!==i))} className="float-right text-red-300">Remove</button></div>)}</div></div>
      <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-bold">3. THEN</h2><div className="mt-4 space-y-3">{steps.map((s,i)=><div key={i} className="flex gap-2"><select value={s.type} onChange={e=>setSteps(steps.map((x,n)=>n===i?{...x,type:e.target.value}:x))} className="flex-1 rounded-xl border border-white/10 bg-slate-900 p-3">{actions.map(a=><option key={a}>{a}</option>)}</select><button onClick={()=>setSteps(steps.filter((_,n)=>n!==i))} disabled={steps.length===1} className="rounded-xl border border-white/10 px-3 disabled:opacity-30">×</button></div>)}<button onClick={addStep} className="rounded-lg border border-white/10 px-3 py-2 text-sm">+ Add action</button></div></div>
      <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-bold">4. APPROVAL</h2><label className="mt-4 flex items-center gap-3 text-sm"><input type="checkbox" checked={approval} onChange={e=>setApproval(e.target.checked)}/> Require approval before execution</label></div>
      <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-bold">5. SCHEDULE</h2><p className="mt-2 text-sm text-slate-400">{trigger==="schedule"?`Runs every ${schedule} seconds.`:"Schedule is controlled by the WHEN trigger."}</p></div>
      <div className="flex justify-end"><button onClick={()=>void save()} disabled={busy||!name.trim()||!agentId} className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50">{busy?"Saving…":"Save Automation"}</button></div>
    </section>
  </div></main></MobileAppShell>
}