"use client";
import MobileAppShell from "../../../../components/layout/MobileAppShell";

export default function Page() {
  return (
    <MobileAppShell theme="dark">
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">My Project / AI System</p>
          <div className="mt-3 flex items-start gap-4">
            <span className="text-3xl" aria-hidden="true">🔎</span>
            <div><h1 className="text-3xl font-bold tracking-tight">RAG / Vector Search</h1><p className="mt-3 max-w-3xl text-slate-400">Retrieval-Augmented Generation এবং vector-based knowledge retrieval-এর workspace।</p></div>
          </div>
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm font-semibold text-slate-200">AI System Workspace</p>
            <p className="mt-2 text-sm text-slate-400">This page is the dedicated foundation for this AI System capability. Execution engines and production integrations can be connected in the next implementation phase.</p>
          </div>
        </div>
      </main>
    </MobileAppShell>
  );
}
