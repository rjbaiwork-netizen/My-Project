"use client";

import MobileAppShell from "../../../../components/layout/MobileAppShell";
import {useEffect,useState} from "react";

const api=()=>((process.env.NEXT_PUBLIC_API_URL??"").replace(/\/$/,""));

type Data={keyStatus:{knowledge:boolean;agent:boolean;production:boolean};summary:Record<string,number>;agents:any[];automations:any[];conversations:any[];knowledge:any[];memories:any[]};

export default function Page(){
 const [data,setData]=useState<Data|null>(null); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
 async function load(){setError("");const r=await fetch(api()+"/api/ai/control-center",{cache:"no-store"});const d=await r.json();if(!r.ok)throw Error(d?.error?.message??"Unable to load control center.");setData(d.data);}
 useEffect(()=>{void load().catch(e=>setError(e.message));},[]);
 async function runChain(){
   if(!data||data.agents.filter(a=>a.status==="ACTIVE").length<2)return;
   setBusy(true);setError("");
   try{
    const ids=data.agents.filter(a=>a.status==="ACTIVE").slice(0,2).map(a=>a.id);
    const r=await fetch(api()+"/api/ai/agent-chain/run",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({agentIds:ids,input:{source:"control-center",message:"Validate the current project context and summarize the next safe action."}})});
    const d=await r.json();if(!r.ok)throw Error(d?.error?.message??"Agent chain failed.");
    alert("Agent chain queued/completed successfully.");
   }catch(e){setError(e instanceof Error?e.message:"Agent chain failed.");}finally{setBusy(false);}
 }
 const s=data?.summary;
 return <MobileAppShell theme="dark"><main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl">
  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-400">AI System</p><h1 className="mt-2 text-3xl font-bold">Unified AI Control Center</h1><p className="mt-2 text-sm text-slate-400">Chat, Knowledge, Memory, Agents এবং Automation-এর operational overview.</p></div><div className="flex gap-2"><button onClick={()=>void load()} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold">Refresh</button><button disabled={busy} onClick={()=>void runChain()} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold disabled:opacity-50">Run Agent Chain</button></div></div>
  {error&&<div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}
  {!data?<div className="mt-8 rounded-2xl border border-white/10 bg-white/[.05] p-6 text-slate-400">Loading AI system…</div>:<>
   <section className="mt-7 grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">{[["Agents",s?.agents],["Active",s?.activeAgents],["Automations",s?.automations],["Chats",s?.conversations],["Knowledge",s?.knowledge],["Indexed",s?.indexedKnowledge],["Memories",s?.memories]].map(([k,v])=><div key={String(k)} className="rounded-2xl border border-white/10 bg-white/[.05] p-4"><div className="text-xs text-slate-400">{k}</div><div className="mt-2 text-2xl font-bold">{v??0}</div></div>)}</section>
   <section className="mt-6 grid gap-4 lg:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-semibold">OpenAI Routing</h2><div className="mt-4 space-y-3">{Object.entries(data.keyStatus).map(([k,v])=><div key={k} className="flex items-center justify-between rounded-xl bg-black/20 p-3"><span className="text-sm capitalize">{k}</span><span className={v?"text-emerald-300":"text-red-300"}>{v?"Configured":"Missing"}</span></div>)}</div></div>
   <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-semibold">Agents</h2><div className="mt-4 space-y-2">{data.agents.slice(0,8).map(a=><div key={a.id} className="flex justify-between rounded-xl bg-black/20 p-3"><span>{a.name}</span><span className="text-xs text-slate-400">{a.status}</span></div>)}</div></div>
   <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-semibold">Recent Automation</h2><div className="mt-4 space-y-2">{data.automations.slice(0,8).map(a=><div key={a.id} className="rounded-xl bg-black/20 p-3"><div className="font-medium">{a.name}</div><div className="text-xs text-slate-400">{a.status} · {a.trigger?.type??"manual"}</div></div>)}</div></div></section>
  </>}</div></main></MobileAppShell>;
}