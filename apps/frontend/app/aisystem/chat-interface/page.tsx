"use client";

import MobileAppShell from "../../../../components/layout/MobileAppShell";
import { useEffect, useState } from "react";

type Conversation={id:string;title?:string|null;updatedAt:string;_count?:{messages:number;memories:number}};
type Message={id:string;role:string;content:string;createdAt:string};

export default function AIChatInterfacePage() {
  const [conversations,setConversations]=useState<Conversation[]>([]);
  const [conversationId,setConversationId]=useState<string>();
  const [messages,setMessages]=useState<Message[]>([]);
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const base=(process.env.NEXT_PUBLIC_API_URL??"").replace(/\/$/,"");

  async function loadConversations(){
    const r=await fetch(`${base}/api/ai/conversations`,{cache:"no-store"});
    const d=await r.json();
    if(!r.ok)throw Error(d?.error?.message??"Unable to load conversations.");
    setConversations(d.data??[]);
  }
  async function openConversation(id:string){
    const r=await fetch(`${base}/api/ai/conversations/${id}`,{cache:"no-store"});
    const d=await r.json();
    if(!r.ok)throw Error(d?.error?.message??"Unable to load conversation.");
    setConversationId(id);setMessages(d.data?.messages??[]);
  }
  useEffect(()=>{void loadConversations().catch(e=>setError(e.message));},[]);

  async function send(){
    const value=message.trim();if(!value||loading)return;
    setLoading(true);setError("");
    try{
      const r=await fetch(`${base}/api/ai/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:value,conversationId})});
      const d=await r.json();
      if(!r.ok)throw Error(d?.error?.message??"AI request failed.");
      setConversationId(d.data.conversationId);
      setMessages(m=>[...m,
        {id:`u-${Date.now()}`,role:"user",content:value,createdAt:new Date().toISOString()},
        {id:`a-${Date.now()}`,role:"assistant",content:d.data.answer??"",createdAt:new Date().toISOString()}
      ]);
      setMessage("");
      await loadConversations();
    }catch(e){setError(e instanceof Error?e.message:"AI request failed.");}
    finally{setLoading(false);}
  }

  async function rename(id:string){
    const current=conversations.find(x=>x.id===id);
    const title=window.prompt("Conversation name",current?.title??"Conversation");
    if(!title?.trim())return;
    const r=await fetch(`${base}/api/ai/conversations/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({title})});
    const d=await r.json();if(!r.ok)throw Error(d?.error?.message??"Unable to rename.");
    await loadConversations();
  }

  async function remove(id:string){
    if(!window.confirm("Delete this conversation?"))return;
    const r=await fetch(`${base}/api/ai/conversations/${id}`,{method:"DELETE"});
    const d=await r.json();if(!r.ok)throw Error(d?.error?.message??"Unable to delete.");
    if(conversationId===id){setConversationId(undefined);setMessages([]);}
    await loadConversations();
  }

  return <MobileAppShell theme="dark">
    <main className="min-h-screen px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-400">AI System / Conversation</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">AI Chat</h1>
        <p className="mt-3 text-slate-400">Conversation, context, Knowledge এবং Memory একসাথে ব্যবহার করুন।</p>
        <div className="mt-8 grid gap-5 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Conversations</h2><button onClick={()=>{setConversationId(undefined);setMessages([])}} className="rounded-lg bg-white/10 px-2 py-1 text-xs">New</button></div>
            <div className="space-y-2">{conversations.map(c=><div key={c.id} className={`rounded-xl p-3 ${conversationId===c.id?"bg-blue-500/20":"bg-white/5"}`}><button className="w-full text-left text-sm font-medium" onClick={()=>void openConversation(c.id).catch(e=>setError(e.message))}>{c.title||"Untitled conversation"}</button><div className="mt-2 flex gap-2 text-[10px] text-slate-500"><span>{c._count?.messages??0} messages</span><button onClick={()=>void rename(c.id).catch(e=>setError(e.message))}>Rename</button><button onClick={()=>void remove(c.id).catch(e=>setError(e.message))}>Delete</button></div></div>)}{!conversations.length&&<p className="text-xs text-slate-500">No conversations yet.</p>}</div>
          </aside>
          <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-black/20">
            <div className="mb-5 min-h-72 space-y-3">{messages.map(m=><div key={m.id} className={`rounded-xl p-4 text-sm leading-6 whitespace-pre-wrap ${m.role==="assistant"?"bg-blue-500/10 text-slate-200":"bg-black/20 text-slate-300"}`}><div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{m.role}</div>{m.content}</div>)}{!messages.length&&<div className="grid min-h-72 place-items-center text-sm text-slate-500">Start a new conversation.</div>}</div>
            {error&&<div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
            <textarea value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send();}}} placeholder="Ask the My-Project AI Assistant..." className="min-h-28 w-full resize-y rounded-xl bg-black/20 p-4 text-sm outline-none ring-1 ring-white/10 placeholder:text-slate-500"/>
            <button type="button" onClick={()=>void send()} disabled={loading||!message.trim()} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{loading?"Thinking…":"Send"}</button>
          </section>
        </div>
      </div>
    </main>
  </MobileAppShell>;
}