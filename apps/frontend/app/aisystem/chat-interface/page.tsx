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
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">My Project / AI System</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">AI Assistant / Chat Agent</h1>
          <p className="mt-3 text-slate-400">Project-aware conversational AI with persistent conversation memory and knowledge retrieval.</p>
          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
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
