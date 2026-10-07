"use client";
import {useEffect,useState} from "react";
import MobileAppShell from "../../../../components/layout/MobileAppShell";
type Provider={id:string;name:string;protocol:string;keyConfigured:boolean;capabilities:string[];models:Record<string,string>;enabled:boolean};
type Event={id:string;provider:string;purpose:string;operation:string;success:boolean;statusCode?:number;error?:string;fallbackFrom?:string|null;latencyMs:number;createdAt:string};
export default function Page(){
 const [providers,setProviders]=useState<Provider[]>([]),[events,setEvents]=useState<Event[]>([]),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const load=async()=>{const [p,e]=await Promise.all([fetch("/api/ai/providers",{cache:"no-store"}),fetch("/api/ai/providers/events?limit=50",{cache:"no-store"})]);const pj=await p.json(),ej=await e.json();if(pj.success)setProviders(pj.data.providers);if(ej.success)setEvents(ej.data);};
 useEffect(()=>{void load()},[]);
 const reindex=async()=>{setBusy(true);setMessage("");const r=await fetch("/api/ai/providers?action=reindex",{method:"POST"});const j=await r.json();setMessage(j.success?"Reindexed "+j.data.indexed+" knowledge documents.":j.error?.message??"Reindex failed.");setBusy(false);};
 return <MobileAppShell theme="dark"><main className="min-h-screen bg-slate-950 px-4 py-8 text-white"><div className="mx-auto max-w-6xl">
  <p className="text-xs font-bold uppercase tracking-[.2em] text-blue-400">AI System / Provider Router</p><h1 className="mt-2 text-3xl font-bold">AI Provider Router</h1>
  <p className="mt-3 max-w-3xl text-slate-400">Capability-based routing, automatic failover and internal provider event logging. API secrets are never displayed here.</p>
  <div className="mt-6 flex flex-wrap gap-3"><button onClick={()=>void load()} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm">Refresh</button><button disabled={busy} onClick={()=>void reindex()} className="rounded-xl bg-blue-600 px-4 py-2 text-sm disabled:opacity-50">{busy?"Reindexing…":"Reindex knowledge"}</button>{message&&<span className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300">{message}</span>}</div>
  <section className="mt-8 grid gap-4 md:grid-cols-2">{providers.map(p=><article key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-5"><div className="flex items-center justify-between"><h2 className="font-bold">{p.name}</h2><span className={p.keyConfigured?"text-emerald-400":"text-amber-400"}>{p.keyConfigured?"Configured":"Not configured"}</span></div><p className="mt-2 text-xs text-slate-500">{p.protocol} · {p.id}</p><div className="mt-4 flex flex-wrap gap-2">{p.capabilities.map(c=><span key={c} className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-300">{c}</span>)}</div></article>)}</section>
  <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5"><h2 className="font-bold">Provider Events</h2><div className="mt-4 space-y-2">{events.map(e=><div key={e.id} className="grid gap-1 rounded-xl border border-white/5 bg-black/10 p-3 text-xs md:grid-cols-6"><span>{e.provider}</span><span>{e.purpose}</span><span>{e.operation}</span><span className={e.success?"text-emerald-400":"text-red-400"}>{e.success?"SUCCESS":"FAILED"} {e.statusCode??""}</span><span>{e.latencyMs}ms</span><span className="truncate text-slate-500">{e.fallbackFrom?"fallback from "+e.fallbackFrom:"primary"} · {new Date(e.createdAt).toLocaleString()}</span></div>)}</div></section>
 </div></main></MobileAppShell>
}
