"use client";

import MobileAppShell from "../../../../components/layout/MobileAppShell";
import { useState } from "react";

export default function AIChatInterfacePage() {
  const [message,setMessage]=useState("");
  const [answer,setAnswer]=useState("");
  const [conversationId,setConversationId]=useState<string>();
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function send() {
    const value=message.trim();
    if(!value||loading)return;
    setLoading(true); setError("");
    try {
      const base=(process.env.NEXT_PUBLIC_API_URL??"").replace(/\/$/,"");
      const response=await fetch(`${base}/api/ai/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:value,conversationId})});
      const data=await response.json();
      if(!response.ok) throw new Error(data?.error?.message??"AI request failed.");
      setConversationId(data.data.conversationId);
      setAnswer(data.data.answer??"");
      setMessage("");
    } catch(e) { setError(e instanceof Error?e.message:"AI request failed."); }
    finally { setLoading(false); }
  }

  return (
    <MobileAppShell theme="dark">
      <main className="px-4 py-8 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-400">AI System / Conversation</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">AI Chat</h1>
          <p className="mt-3 text-slate-400">Ask questions, work with your knowledge, and keep conversations in one professional workspace.</p>
          <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-black/20">
            {answer&&<div className="mb-5 rounded-xl bg-black/20 p-4 text-sm leading-6 text-slate-200 whitespace-pre-wrap">{answer}</div>}
            {error&&<div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
            <textarea value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send();}}} placeholder="Ask the My-Project AI Assistant..." className="min-h-32 w-full resize-y rounded-xl bg-black/20 p-4 text-sm outline-none ring-1 ring-white/10 placeholder:text-slate-500" />
            <button type="button" onClick={()=>void send()} disabled={loading||!message.trim()} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{loading?"Thinking…":"Send"}</button>
          </div>
        </div>
      </main>
    </MobileAppShell>
  );
}
