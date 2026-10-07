"use client";
import MobileAppShell from "../../../components/layout/MobileAppShell";
import { useEffect, useState } from "react";

type Stats={sections:number;visible:number;agents:number;activeAgents:number;automations:number;conversations:number};

export default function AdminDashboardPage() {
  const [stats,setStats]=useState<Stats>({sections:0,visible:0,agents:0,activeAgents:0,automations:0,conversations:0});
  const [error,setError]=useState("");
  useEffect(()=>{
    void (async()=>{
      try{
        const [sectionsRes,aiRes]=await Promise.all([
          fetch("/api/admin/sections",{cache:"no-store"}),
          fetch(`${(process.env.NEXT_PUBLIC_API_URL??"").replace(/\/$/,"")}/api/ai/control-center`,{cache:"no-store"})
        ]);
        const sections=await sectionsRes.json();
        const ai=await aiRes.json();
        if(!sectionsRes.ok||!sections?.success)throw new Error(sections?.error?.message??"Unable to load CMS status.");
        if(!aiRes.ok||!ai?.success)throw new Error(ai?.error?.message??"Unable to load AI status.");
        setStats({
          sections:Array.isArray(sections.data)?sections.data.length:0,
          visible:Array.isArray(sections.data)?sections.data.filter((x:any)=>x.isVisible).length:0,
          agents:Number(ai.data?.summary?.agents??0),
          activeAgents:Number(ai.data?.summary?.activeAgents??0),
          automations:Number(ai.data?.summary?.automations??0),
          conversations:Number(ai.data?.summary?.conversations??0)
        });
      }catch(e){setError(e instanceof Error?e.message:"Unable to load dashboard status.");}
    })();
  },[]);
  const cards=[
    [String(stats.sections),"CMS Sections","Database-backed website content"],
    [String(stats.visible),"Visible","Currently published sections"],
    [String(stats.agents),`AI Agents • ${stats.activeAgents} active`,"Configured agent registry"],
    [String(stats.automations),"Automations","Configured workflow definitions"],
    [String(stats.conversations),"Conversations","Stored AI conversations"]
  ];
  return <MobileAppShell theme="light"><main className="px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl">
    <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">Management Dashboard</p>
    <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Welcome back</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Manage website content and connected AI tools from one professional workspace.</p></div><a href="/admin/system-config" className="inline-flex w-fit rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">Manage content</a></div>
    {error&&<p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{cards.map(([value,title,desc])=><div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-3xl font-bold">{value}</p><p className="mt-2 text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-slate-500">{desc}</p></div>)}</div>
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_.8fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">Quick actions</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><a href="/admin/system-config" className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50"><b className="text-sm">Website content</b><p className="mt-1 text-xs text-slate-500">Edit, publish or hide sections.</p></a><a href="/aisystem/control-center" className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50"><b className="text-sm">AI Control Center</b><p className="mt-1 text-xs text-slate-500">Monitor agents, memory, knowledge and automations.</p></a></div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">System status</h2><div className="mt-4 space-y-3">{[["Website",stats.sections>0],["AI System",stats.agents>0],["Content Management",stats.sections===10]].map(([x,ok])=><div key={String(x)} className="flex items-center justify-between text-sm"><span className="text-slate-600">{x}</span><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${ok?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{ok?"Ready":"Needs setup"}</span></div>)}</div></section>
    </div>
  </div></main></MobileAppShell>;
}
