"use client";

import MobileAppShell from "../../../../components/layout/MobileAppShell";
import { useEffect, useMemo, useState } from "react";

const api=()=>((process.env.NEXT_PUBLIC_API_URL??"").replace(/\/$/,""));

type Category={id:string;key:string;name:string;progress:number;dataCount:number;memoryCount:number;knowledgeCount:number};
type Agent={id:string;name:string;description:string;status:string;brainCategories:Category[];_count:{runs:number;jobs:number;automations:number}};
type Automation={id:string;name:string;description?:string;status:string;agent?:{name:string}|null;runs?:Array<{status:string}>};

export default function Page(){
  const [agents,setAgents]=useState<Agent[]>([]);
  const [automations,setAutomations]=useState<Automation[]>([]);
  const [selected,setSelected]=useState("");
  const [name,setName]=useState("");
  const [description,setDescription]=useState("");
  const [busy,setBusy]=useState(false);\n  const [runningId,setRunningId]=useState("");
  const [error,setError]=useState("");

  async function load(){
    const r=await fetch(`${api()}/api/ai/agent-automation`,{cache:"no-store"});
    const d=await r.json();
    if(!r.ok) throw Error(d?.error?.message??"Unable to load AI Agent Bot & Automation.");
    setAgents(d.data?.agents??[]); setAutomations(d.data?.automations??[]);
    if(!selected&&d.data?.agents?.[0]) setSelected(d.data.agents[0].id);
  }
  useEffect(()=>{void load().catch(e=>setError(e.message));},[]);
  const agent=useMemo(()=>agents.find(a=>a.id===selected)??agents[0],[agents,selected]);
  const overall=agent?.brainCategories.length?Math.round(agent.brainCategories.reduce((s,c)=>s+c.progress,0)/agent.brainCategories.length):0;

  async function createAutomation(){
    if(!name.trim()||!selected)return;
    setBusy(true);setError("");
    try{
      const r=await fetch(`${api()}/api/ai/automations`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        name,description,agentId:selected,
        trigger:{type:"manual"},conditions:[],actions:[{type:"run-agent",agentId:selected}]
      })});
      const d=await r.json(); if(!r.ok)throw Error(d?.error?.message??"Unable to create automation.");
      setName("");setDescription("");await load();
    }catch(e){setError(e instanceof Error?e.message:"Request failed");}finally{setBusy(false);}
  }

  async function runAutomation(id:string){\n    setRunningId(id); setError("");\n    try{const r=await fetch(`${api()}/api/ai/automations/${id}/run`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({input:{source:"agent-automation-workspace"}})});const d=await r.json();if(!r.ok)throw Error(d?.error?.message??"Unable to queue automation.");await load();}catch(e){setError(e instanceof Error?e.message:"Unable to run automation.");}finally{setRunningId("");}\n  }\n\n  return <MobileAppShell theme="dark">
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div><p className="text-xs font-bold uppercase tracking-[.2em] text-blue-400">AI System</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">AI Agent Bot & Automation</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">নিজস্ব Agent, Brain, category-based data এবং automation এক workspace থেকে পরিচালনা করুন।</p>
          </div>
          <a href="/aisystem/orchestrator" className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/10">Multi-Agent System →</a>
        </div>

        {error&&<div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          {[["Agents",agents.length],["Active",agents.filter(a=>a.status==="ACTIVE").length],["Automations",automations.length],["Brain Growth",`${overall}%`]].map(([label,value])=>
            <div key={label as string} className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold">{value}</p></div>)}
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[.05] p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div><h2 className="text-xl font-bold">Agent Brain</h2><p className="mt-1 text-sm text-slate-400">Category অনুযায়ী Brain growth ও data coverage.</p></div>
              <select value={selected} onChange={e=>setSelected(e.target.value)} className="rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm">{agents.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select>
            </div>
            {agent&&<div className="mt-6">
              <div className="rounded-2xl border border-blue-400/10 bg-blue-400/[.05] p-5">
                <div className="flex items-end justify-between"><div><p className="text-sm font-semibold">{agent.name}</p><p className="mt-1 text-xs text-slate-500">Overall Brain Growth</p></div><strong className="text-3xl">{overall}%</strong></div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-blue-400" style={{width:`${overall}%`}}/></div>
              </div>
              <div className="mt-5 space-y-4">{agent.brainCategories.map(c=><div key={c.id}>
                <div className="flex items-center justify-between text-sm"><span className="font-semibold">{c.name}</span><span className="text-slate-400">{c.progress}%</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{width:`${c.progress}%`}}/></div>
                <p className="mt-1 text-xs text-slate-500">{c.knowledgeCount} knowledge · {c.memoryCount} memory · {c.dataCount} data</p>
              </div>)}</div>
            </div>}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[.05] p-6">
            <h2 className="text-xl font-bold">Create Automation</h2>
            <p className="mt-1 text-sm text-slate-400">প্রথম module-এ manual trigger দিয়ে safe workflow foundation তৈরি করুন।</p>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="Automation name" className="mt-5 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"/>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="What should this automation do?" className="mt-3 min-h-28 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"/>
            <button onClick={()=>void createAutomation()} disabled={busy||!name.trim()||!selected} className="mt-3 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">{busy?"Creating…":"Create Automation"}</button>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.05] p-6">
          <div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Automations</h2><p className="mt-1 text-sm text-slate-400">আপনার automation definitions-এর বর্তমান অবস্থা।</p></div><a href="/aisystem/automation" className="text-sm font-semibold text-blue-400">Open automation workspace →</a></div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">{automations.length?automations.map(a=><div key={a.id} className="rounded-xl border border-white/10 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold">{a.name}</p><p className="mt-1 text-xs text-slate-500">{a.agent?.name??"No agent assigned"} · {a.runs?.length??0} recent runs</p></div><span className="text-xs text-emerald-300">{a.status}</span></div><button onClick={()=>void runAutomation(a.id)} disabled={runningId===a.id||a.status==="PAUSED"} className="mt-4 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10 disabled:opacity-50">{runningId===a.id?"Queueing…":"Run Automation"}</button></div>):<p className="rounded-xl border border-dashed border-white/10 p-6 text-sm text-slate-500">No automations yet.</p>}</div>
        </section>
      </div>
    </main>
  </MobileAppShell>;
}
