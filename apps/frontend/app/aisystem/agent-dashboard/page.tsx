"use client";

import MobileAppShell from "../../../../components/layout/MobileAppShell";
import {useEffect,useMemo,useState} from "react";

const api=()=>((process.env.NEXT_PUBLIC_API_URL??"").replace(/\/$/,""));
type Agent={id:string;key:string;name:string;description:string;systemPrompt:string;status:"ACTIVE"|"PAUSED"|"DISABLED";createdAt:string;updatedAt:string;_count?:{runs:number;jobs:number;automations:number}};
type Run={id:string;status:string;input:any;output:any;error:string|null;startedAt:string|null;finishedAt:string|null;createdAt:string};

export default function Page(){
 const [agents,setAgents]=useState<Agent[]>([]); const [selected,setSelected]=useState(""); const [runs,setRuns]=useState<Run[]>([]);
 const [name,setName]=useState(""); const [key,setKey]=useState(""); const [description,setDescription]=useState(""); const [prompt,setPrompt]=useState("");
 const [status,setStatus]=useState<Agent["status"]>("ACTIVE"); const [input,setInput]=useState("Hello, Agent."); const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [message,setMessage]=useState("");

 async function load(){
   const r=await fetch(api()+"/api/ai/agents",{cache:"no-store"}); const d=await r.json();
   if(!r.ok)throw Error(d?.error?.message??"Unable to load agents.");
   setAgents(d.data??[]); if(!selected&&d.data?.[0])setSelected(d.data[0].id);
 }
 async function loadRuns(id=selected){if(!id)return;const r=await fetch(api()+"/api/ai/agents/"+id+"/runs",{cache:"no-store"});const d=await r.json();if(r.ok)setRuns(d.data??[]);}
 useEffect(()=>{void load().catch(e=>setError(e.message));},[]);
 useEffect(()=>{const a=agents.find(x=>x.id===selected);if(a){setName(a.name);setKey(a.key);setDescription(a.description);setPrompt(a.systemPrompt);setStatus(a.status);void loadRuns(a.id);}},[selected,agents]);
 const agent=useMemo(()=>agents.find(a=>a.id===selected)??agents[0],[agents,selected]);

 async function save(){
   if(!name.trim()||!description.trim()||!prompt.trim())return;
   setBusy(true);setError("");setMessage("");
   try{
     const editing=Boolean(agent);
     const r=await fetch(editing?api()+"/api/ai/agents/"+agent.id:api()+"/api/ai/agents",{method:editing?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(editing?{name,description,systemPrompt:prompt,status}:{key,name,description,systemPrompt:prompt,status})});
     const d=await r.json();if(!r.ok)throw Error(d?.error?.message??"Unable to save agent.");
     setMessage(editing?"Agent updated successfully.":"Agent created successfully.");await load();if(!editing&&d.data?.id)setSelected(d.data.id);
   }catch(e){setError(e instanceof Error?e.message:"Unable to save agent.");}finally{setBusy(false);}
 }
 async function createMode(){setSelected("");setName("");setKey("");setDescription("");setPrompt("");setStatus("ACTIVE");setRuns([]);setError("");setMessage("");}
 async function run(){
   if(!selected)return;setBusy(true);setError("");setMessage("");
   try{
     const r=await fetch(api()+"/api/ai/agents/"+selected+"/run",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({input})});
     const d=await r.json();if(!r.ok)throw Error(d?.error?.message??"Agent execution failed.");
     setMessage("Agent execution completed.");await loadRuns();
   }catch(e){setError(e instanceof Error?e.message:"Agent execution failed.");await loadRuns();}finally{setBusy(false);}
 }
 async function changeStatus(next:Agent["status"]){if(!selected)return;setBusy(true);try{const r=await fetch(api()+"/api/ai/agents/"+selected,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:next})});const d=await r.json();if(!r.ok)throw Error(d?.error?.message??"Unable to update status.");setMessage("Agent status updated.");await load();}catch(e){setError(e instanceof Error?e.message:"Unable to update status.");}finally{setBusy(false);}}

 return <MobileAppShell theme="dark"><main className="min-h-screen bg-slate-950 px-4 py-8 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl">
  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-400">AI System</p><h1 className="mt-2 text-3xl font-bold">AI Agent Management</h1><p className="mt-2 max-w-3xl text-sm text-slate-400">Agent identity, instructions, lifecycle, execution এবং run history এক জায়গা থেকে পরিচালনা করুন।</p></div><button onClick={()=>void createMode()} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold">+ New Agent</button></div>
  {error&&<div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>}{message&&<div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">{message}</div>}
  <section className="mt-7 grid gap-4 md:grid-cols-3"><div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><p className="text-xs text-slate-500">TOTAL AGENTS</p><p className="mt-2 text-3xl font-bold">{agents.length}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><p className="text-xs text-slate-500">ACTIVE</p><p className="mt-2 text-3xl font-bold">{agents.filter(a=>a.status==="ACTIVE").length}</p></div><div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><p className="text-xs text-slate-500">TOTAL RUNS</p><p className="mt-2 text-3xl font-bold">{agents.reduce((n,a)=>n+(a._count?.runs??0),0)}</p></div></section>
  <section className="mt-6 grid gap-6 lg:grid-cols-[.7fr_1.3fr]">
   <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-bold">Agent Registry</h2><div className="mt-4 space-y-2">{agents.map(a=><button key={a.id} onClick={()=>setSelected(a.id)} className={`w-full rounded-xl border p-4 text-left ${a.id===selected?"border-blue-400/40 bg-blue-400/10":"border-white/10 bg-black/10"}`}><div className="flex items-center justify-between gap-3"><span className="font-semibold">{a.name}</span><span className="text-[10px] font-bold text-emerald-300">{a.status}</span></div><p className="mt-1 text-xs text-slate-500">{a.key}</p><p className="mt-2 text-xs text-slate-400">{a.description}</p></button>)}</div></div>
   <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><div className="flex items-center justify-between"><h2 className="font-bold">{agent?"Agent Configuration":"Create Agent"}</h2>{agent&&<select value={status} onChange={e=>void changeStatus(e.target.value as Agent["status"])} disabled={busy} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs"><option>ACTIVE</option><option>PAUSED</option><option>DISABLED</option></select>}</div>
    {!agent&&<input value={key} onChange={e=>setKey(e.target.value)} placeholder="unique-agent-key" className="mt-4 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"/>}
    <input value={name} onChange={e=>setName(e.target.value)} placeholder="Agent name" className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"/>
    <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" className="mt-3 min-h-20 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"/>
    <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="System prompt / agent instructions" className="mt-3 min-h-40 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"/>
    <button onClick={()=>void save()} disabled={busy||!name.trim()||!description.trim()||!prompt.trim()||(!agent&&!key.trim())} className="mt-3 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50">{busy?"Saving…":agent?"Save Agent":"Create Agent"}</button>
   </div>
  </section>
  {agent&&<section className="mt-6 grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
    <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><h2 className="font-bold">Test Agent</h2><textarea value={input} onChange={e=>setInput(e.target.value)} className="mt-4 min-h-32 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"/><button onClick={()=>void run()} disabled={busy||agent.status!=="ACTIVE"} className="mt-3 rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-40">{busy?"Running…":"Run Agent"}</button><p className="mt-2 text-xs text-slate-500">Uses the same production agent execution path consumed by Automation Builder.</p></div>
    <div className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><div className="flex items-center justify-between"><div><h2 className="font-bold">Execution History</h2><p className="mt-1 text-xs text-slate-500">{runs.length} recent runs</p></div><button onClick={()=>void loadRuns()} className="rounded-lg border border-white/10 px-3 py-2 text-xs">Refresh</button></div><div className="mt-4 space-y-2">{runs.length?runs.map(run=><div key={run.id} className="rounded-xl border border-white/10 bg-black/20 p-3"><div className="flex items-center justify-between"><span className="font-semibold">{run.status}</span><span className="text-xs text-slate-500">{new Date(run.createdAt).toLocaleString()}</span></div>{run.error&&<p className="mt-1 text-xs text-red-300">{run.error}</p>}{run.output?.text&&<p className="mt-2 line-clamp-3 text-xs text-slate-400">{run.output.text}</p>}</div>):<p className="text-sm text-slate-500">No agent runs yet.</p>}</div></div>
  </section>}
 </div></main></MobileAppShell>;
}
