"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { CMSSection } from "../../lib/api";
import { getText } from "../sections/content";

const publicLinks = [["Home","#hero"],["About","#about"],["Services","#services"],["Portfolio","#portfolio"],["Pricing","#pricing"],["Blog","#blog"],["Contact","#contact"]] as const;
const groups = [
  { title:"Admin Workspace", links:[["Dashboard","/admin/dashboard"],["Profile","/admin/profile"],["Settings","/admin/settings"],["System Configuration","/admin/system-config"]] },
  { title:"Project Workspace", links:[["Dashboard","/project/dashboard"],["Profile","/project/profile"],["Settings","/project/settings"]] },
  { title:"AI System", links:[["Chat Interface","/aisystem/chat-interface"],["AI Agent Dashboard","/aisystem/agent-dashboard"],["Knowledge Base","/aisystem/knowledge-base"],["Automation","/aisystem/automation"],["Orchestrator","/aisystem/orchestrator"]] },
] as const;

function Icon({name}:{name:"menu"|"close"|"home"|"back"|"chevron"}) {
  if(name==="close") return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 6 12 12M18 6 6 18"/></svg>;
  if(name==="home") return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 10 8-6 8 6v9H4z"/><path d="M9 19v-5h6v5"/></svg>;
  if(name==="back") return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m15 18-6-6 6-6M9 12h11"/></svg>;
  if(name==="chevron") return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 9 6 6 6-6"/></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
}

export default function Header({section}:{section:CMSSection}) {
  const [open,setOpen]=useState(false);
  const tagline=getText(section.content,"tagline","My Project");
  useEffect(()=>{ document.body.classList.toggle("overflow-hidden",open); return()=>document.body.classList.remove("overflow-hidden"); },[open]);

  return (
    <>
      <header id="header" className="sticky top-0 z-[100] border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:h-[72px] sm:px-6 lg:px-8">
          <Link href="#hero" onClick={()=>setOpen(false)} className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-sm font-bold text-white">{(section.title||"M").trim().slice(0,1).toUpperCase()}</span>
            <span className="min-w-0"><span className="block max-w-[42vw] truncate text-sm font-bold text-slate-950 sm:max-w-52">{section.title||"My Project"}</span><span className="hidden truncate text-xs text-slate-500 sm:block">{tagline}</span></span>
          </Link>
          <nav aria-label="Desktop navigation" className="ml-auto hidden items-center gap-1 lg:flex">
            {publicLinks.map(([label,href])=><Link key={href} href={href} className="rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950">{label}</Link>)}
          </nav>
          <p className="mx-auto truncate text-sm font-semibold text-slate-800 lg:hidden">{tagline}</p>
          <button type="button" onClick={()=>setOpen(true)} aria-label="Open navigation menu" aria-expanded={open} className="ml-auto grid h-11 w-11 shrink-0 place-items-center rounded-full text-slate-900 hover:bg-slate-100 lg:ml-2"><Icon name="menu"/></button>
        </div>
      </header>

      <div className={"fixed inset-0 z-[200] transition "+(open?"visible":"invisible")} aria-hidden={!open}>
        <button type="button" aria-label="Close navigation" onClick={()=>setOpen(false)} className={"absolute inset-0 bg-slate-950/50 transition-opacity "+(open?"opacity-100":"opacity-0")}/>
        <aside id="mobile-navigation-drawer" aria-label="Application navigation" className={"absolute inset-y-0 right-0 flex w-full max-w-[430px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out "+(open?"translate-x-0":"translate-x-full")}>
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Navigation</p><p className="text-base font-bold text-slate-950">My Project</p></div>
            <button type="button" onClick={()=>setOpen(false)} aria-label="Close navigation menu" className="grid h-11 w-11 place-items-center rounded-full hover:bg-slate-100"><Icon name="close"/></button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
            <section><h2 className="px-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Public Pages</h2><div className="mt-2 grid grid-cols-2 gap-2">{publicLinks.map(([label,href])=><Link key={href} href={href} onClick={()=>setOpen(false)} className="rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 active:bg-slate-100">{label}</Link>)}</div></section>
            {groups.map(group=><section key={group.title} className="mt-6 border-t border-slate-100 pt-5"><h2 className="px-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{group.title}</h2><div className="mt-2 grid gap-1">{group.links.map(([label,href])=><Link key={href} href={href} onClick={()=>setOpen(false)} className="flex min-h-12 items-center justify-between rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 active:bg-slate-100"><span>{label}</span><span className="text-slate-300"><Icon name="chevron"/></span></Link>)}</div></section>)}
          </div>
          <div className="shrink-0 border-t border-slate-200 bg-white p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"><Link href="/" onClick={()=>setOpen(false)} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-bold text-white"><Icon name="home"/>Back to Home</Link></div>
        </aside>
      </div>
    </>
  );
}
