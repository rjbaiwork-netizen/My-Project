"use client";
import MobileAppShell from "../../../../components/layout/MobileAppShell";

const cards = [
  ["Overview","A clear, focused workspace for this capability.","Ready"],
  ["Recent activity","Activity and results will appear here as the system is used.","Available"],
  ["Quick action","Start working with this feature from the controls below.","Open"]
];

export default function Page() {
  return (
    <MobileAppShell theme="dark">
      <main className="px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-400">AI System</p>
          <div className="mt-2 flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-xl">{icon}</span>
            <div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Create Content</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">Blog, Services, Portfolio এবং অন্যান্য content দ্রুত তৈরি করুন।</p></div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {cards.map(([label,text,status])=><section key={label} className="rounded-2xl border border-white/10 bg-white/[.05] p-5 shadow-xl shadow-black/10"><div className="flex items-center justify-between"><h2 className="font-bold">{label}</h2><span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">{status}</span></div><p className="mt-3 text-sm leading-6 text-slate-400">{text}</p></section>)}
          </div>
        </div>
      </main>
    </MobileAppShell>
  );
}
