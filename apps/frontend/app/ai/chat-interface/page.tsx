"use client";

import { useState } from "react";

export default function AIChatInterfacePage() {
  const [message, setMessage] = useState("");
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">My Project / AI</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">AI Chat Interface</h1>
        <p className="mt-3 text-slate-400">Dedicated AI interaction workspace.</p>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Start a message..." className="min-h-32 w-full resize-y rounded-xl bg-black/20 p-4 text-sm outline-none ring-1 ring-white/10 placeholder:text-slate-500" />
          <button type="button" className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950">Send</button>
        </div>
      </div>
    </main>
  );
}
