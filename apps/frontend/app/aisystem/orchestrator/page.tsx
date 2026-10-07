"use client";
import MobileAppShell from "../../../../components/layout/MobileAppShell";

export default function Page() {
  return (
    <MobileAppShell theme="dark">
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-400">AI System</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Multi-Agent System</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">একাধিক AI Agent একসাথে কাজ করে জটিল কাজ ভাগ করে সম্পন্ন করার জন্য এই workspace।</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[["AI Assistant","General questions and conversations"],["Knowledge Agent","Finds useful information from your knowledge"],["Automation Agent","Handles scheduled and automated tasks"]].map(([title,desc])=><article key={title} className="rounded-2xl border border-white/10 bg-white/[.05] p-5"><div className="flex items-center justify-between"><h2 className="font-bold">{title}</h2><span className="h-2.5 w-2.5 rounded-full bg-emerald-400"/></div><p className="mt-2 text-sm leading-6 text-slate-400">{desc}</p><button className="mt-5 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/10">View agent</button></article>)}
          </div>
          <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.04] p-6"><h2 className="text-lg font-bold">How it works</h2><div className="mt-5 grid gap-3 md:grid-cols-3">{["Understand the request","Choose the right AI Agent","Complete and report the result"].map((x,i)=><div key={x} className="rounded-xl border border-white/10 p-4"><span className="text-xs font-bold text-blue-400">0{i+1}</span><p className="mt-2 text-sm text-slate-300">{x}</p></div>)}</div></section>
        </div>
      </main>
    </MobileAppShell>
  );
}
