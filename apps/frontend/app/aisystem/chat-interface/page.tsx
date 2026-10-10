"use client";

import MobileAppShell from "../../../../components/layout/MobileAppShell";
import { useEffect, useRef, useState } from "react";

type Conversation={id:string;title?:string|null;updatedAt:string;_count?:{messages:number;memories:number}};
type Message={id:string;role:string;content:string;createdAt:string};
type ContextItem={id:string;title?:string;content:string;source?:string|null;namespace?:string};
type Agent={id:string;name:string;status:string};

async function readJson(r:Response){
  const text=await r.text();
  let data:any={};
  try{data=text?JSON.parse(text):{};}catch{throw Error(`Server returned a non-JSON response (HTTP ${r.status}).`);}
  if(!r.ok)throw Error(data?.error?.message??`Request failed (HTTP ${r.status}).`);
  return data;
}

export default function AIChatInterfacePage(){
  const base="";
  const [conversations,setConversations]=useState<Conversation[]>([]);
  const [conversationId,setConversationId]=useState<string>();
  const [messages,setMessages]=useState<Message[]>([]);
  const [message,setMessage]=useState("");
  const [context,setContext]=useState<{knowledge:ContextItem[];memories:ContextItem[]}>({knowledge:[],memories:[]});
  const [agents,setAgents]=useState<Agent[]>([]); const [agentId,setAgentId]=useState("");
  const [loading,setLoading]=useState(false),[error,setError]=useState("");
  const [pendingControl,setPendingControl]=useState<any>(null);
  const endRef=useRef<HTMLDivElement>(null);

  async function loadConversations(){const d=await readJson(await fetch(`${base}/api/ai/conversations`,{cache:"no-store"}));setConversations(d.data??[]);}
  async function openConversation(id:string){setError("");const d=await readJson(await fetch(`${base}/api/ai/conversations/${id}`,{cache:"no-store"}));setConversationId(id);setMessages(d.data?.messages??[]);setContext({knowledge:[],memories:[]});}
  useEffect(()=>{void loadConversations().catch(e=>setError(e instanceof Error?e.message:"Unable to load conversations.")); void (async()=>{try{const d=await readJson(await fetch(`${base}/api/ai/agents`,{cache:"no-store"}));setAgents((d.data??[]).filter((a:Agent)=>a.status==="ACTIVE"));}catch{}})();},[]);
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[messages,loading]);

  function newConversation(){setConversationId(undefined);setMessages([]);setContext({knowledge:[],memories:[]});setError("");}
  async function send(confirm=false, controlMessage?:string, confirmationId?:string){
    const value=(controlMessage??message).trim();if(!value||loading)return;
    setLoading(true);setError("");
    try{
      let controlResponse=await fetch("/api/ai/control-chat",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(confirm?{message:value,confirm,confirmationId}:{message:value,confirm}),
        cache:"no-store"
      });
      if((controlResponse.status===404||controlResponse.status===502||controlResponse.status===503||controlResponse.status===504)&&!confirm){
        await new Promise(resolve=>setTimeout(resolve,600));
        controlResponse=await fetch("/api/ai/control-chat",{
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({message:value,confirm}),
          cache:"no-store"
        });
      }
      const control=await readJson(controlResponse);
      if(control.data?.mode==="action_preview"){
        setPendingControl({message:value,action:control.data.action,confirmationId:control.data.confirmationId});
        setMessages(m=>[...m,{id:`u-${Date.now()}`,role:"user",content:value,createdAt:new Date().toISOString()},{id:`p-${Date.now()+1}`,role:"assistant",content:`আমি এই actionটি করতে প্রস্তুত: ${JSON.stringify(control.data.action,null,2)}\n\nConfirm চাপলে এটি execute হবে.`,createdAt:new Date().toISOString()}]);
        setMessage(""); return;
      }
      if(control.data?.mode==="executed"){
        setPendingControl(null);
        setMessages(m=>[...m,{id:`u-${Date.now()}`,role:"user",content:value,createdAt:new Date().toISOString()},{id:`x-${Date.now()+1}`,role:"assistant",content:control.data.summary??"Action completed.",createdAt:new Date().toISOString()}]);
        setMessage(""); return;
      }
      const d=await readJson(await fetch(`${base}/api/ai/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:value,conversationId,agentId:agentId||undefined})}));
      setConversationId(d.data.conversationId);
      setMessages(m=>[...m,{id:`u-${Date.now()}`,role:"user",content:value,createdAt:new Date().toISOString()},{id:`a-${Date.now()+1}`,role:"assistant",content:d.data.answer??"",createdAt:new Date().toISOString()}]);
      setContext({knowledge:d.data.knowledge??[],memories:d.data.memories??[]});
      setMessage(""); await loadConversations();
    }catch(e){setError(e instanceof Error?e.message:"AI request failed.");}
    finally{setLoading(false);}
  }
  async function rename(id:string){
    const current=conversations.find(x=>x.id===id);const title=window.prompt("Conversation name",current?.title??"Conversation");
    if(!title?.trim())return;
    try{await readJson(await fetch(`${base}/api/ai/conversations/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({title})}));await loadConversations();}
    catch(e){setError(e instanceof Error?e.message:"Unable to rename.");}
  }
  async function remove(id:string){
    if(!window.confirm("Delete this conversation?"))return;
    try{await readJson(await fetch(`${base}/api/ai/conversations/${id}`,{method:"DELETE"}));if(conversationId===id)newConversation();await loadConversations();}
    catch(e){setError(e instanceof Error?e.message:"Unable to delete.");}
  }

  return <MobileAppShell theme="dark"><main className="min-h-screen px-4 py-8 text-white sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl">
    <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-400">AI System / Conversation</p><h1 className="mt-2 text-3xl font-bold tracking-tight">AI Chat</h1>
    <p className="mt-3 text-slate-400">Conversation, Knowledge এবং Memory একসাথে ব্যবহার করুন।</p>
    <div className="mt-4"><a href="/aisystem/chat-interface/work-plan" className="inline-flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm font-semibold text-blue-200 hover:bg-blue-400/20">Chat Interface Work Plan ও Verification Checklist →</a></div>
    <div className="mt-8 grid gap-5 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-2xl border border-white/10 bg-slate-900/80 p-4"><div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Conversations</h2><button onClick={newConversation} className="rounded-lg bg-white/10 px-2 py-1 text-xs">New</button></div>
        <div className="space-y-2">{conversations.map(c=><div key={c.id} className={`rounded-xl p-3 ${conversationId===c.id?"bg-blue-500/20":"bg-white/5"}`}><button className="w-full text-left text-sm font-medium" onClick={()=>void openConversation(c.id)}>{c.title||"Untitled conversation"}</button><div className="mt-2 flex gap-2 text-[10px] text-slate-500"><span>{c._count?.messages??0} messages</span><button onClick={()=>void rename(c.id)}>Rename</button><button onClick={()=>void remove(c.id)}>Delete</button></div></div>)}{!conversations.length&&<p className="text-xs text-slate-500">No conversations yet.</p>}</div>
      </aside>
      <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-2xl shadow-black/20">
        <div className="mb-5 min-h-72 space-y-3">{messages.map(m=><div key={m.id} className={`rounded-xl p-4 text-sm leading-6 whitespace-pre-wrap ${m.role==="assistant"?"bg-blue-500/10 text-slate-200":"bg-black/20 text-slate-300"}`}><div className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">{m.role}</div>{m.content}</div>)}{loading&&<div className="rounded-xl bg-blue-500/10 p-4 text-sm text-slate-400">Thinking…</div>}{!messages.length&&<div className="grid min-h-72 place-items-center text-sm text-slate-500">Start a new conversation.</div>}<div ref={endRef}/></div>
        {context.knowledge.length+context.memories.length>0&&<div className="mb-4 rounded-xl border border-white/10 bg-black/20 p-4"><p className="text-xs font-bold uppercase tracking-wider text-slate-500">Context used for latest response</p><div className="mt-3 grid gap-3 md:grid-cols-2">{context.knowledge.length>0&&<div><p className="text-xs font-semibold text-blue-300">Knowledge ({context.knowledge.length})</p>{context.knowledge.map(x=><p key={x.id} className="mt-1 truncate text-xs text-slate-400">{x.title}</p>)}</div>}{context.memories.length>0&&<div><p className="text-xs font-semibold text-blue-300">Memory ({context.memories.length})</p>{context.memories.map(x=><p key={x.id} className="mt-1 truncate text-xs text-slate-400">{x.namespace??x.content}</p>)}</div>}</div></div>}
        {error&&<div className="mb-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</div>}
        <div className="mb-3 flex items-center gap-3"><label className="text-xs text-slate-400">Optional agent execution</label><select value={agentId} onChange={e=>setAgentId(e.target.value)} className="rounded-lg bg-black/30 px-3 py-2 text-xs ring-1 ring-white/10"><option value="">Chat only</option>{agents.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div>\n        <textarea value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send();}}} placeholder="Ask the My-Project AI Assistant..." className="min-h-28 w-full resize-y rounded-xl bg-black/20 p-4 text-sm outline-none ring-1 ring-white/10 placeholder:text-slate-500"/>
        {pendingControl&&<div className="mb-3 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs text-amber-100"><p className="font-semibold">AI action requires confirmation.</p><div className="mt-2 flex gap-2"><button type="button" onClick={()=>{const p=pendingControl;setPendingControl(null);void send(true,p.message,p.confirmationId);}} className="rounded-lg bg-white px-3 py-2 font-semibold text-slate-950">Confirm</button><button type="button" onClick={()=>setPendingControl(null)} className="rounded-lg bg-black/20 px-3 py-2">Cancel</button></div></div>}        <button type="button" onClick={()=>void send()} disabled={loading||!message.trim()} className="mt-4 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50">{loading?"Thinking…":"Send"}</button>
      </section>
    </div>
  </div></main></MobileAppShell>;
}