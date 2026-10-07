"use client";

import MobileAppShell from "../../../../components/layout/MobileAppShell";
import { useEffect, useMemo, useState } from "react";

type Knowledge={id:string;title:string;content:string;source?:string|null;embedding?:unknown;createdAt:string;updatedAt:string};

export default function KnowledgePage(){
  const base=(process.env.NEXT_PUBLIC_API_URL??"").replace(/\/$/,"");
  const [items,setItems]=useState<Knowledge[]>([]);
  const [title,setTitle]=useState("");
  const [content,setContent]=useState("");
  const [source,setSource]=useState("");
  const [query,setQuery]=useState("");
  const [editing,setEditing]=useState<string|null>(null);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);

  async function load(){
    const r=await fetch(base+"/api/ai/knowledge",{cache:"no-store"});
    const d=await r.json();
    if(!r.ok)throw Error(d?.error?.message??"Unable to load knowledge.");
    setItems(d.data??[]);
  }
  useEffect(()=>{void load().catch(e=>setError(e.message));},[]);

  const visible=useMemo(()=>items.filter(x=>(x.title+" "+x.content+" "+(x.source??"")).toLowerCase().includes(query.toLowerCase())),[items,query]);

  function startEdit(x:Knowledge){
    setEditing(x.id);setTitle(x.title);setContent(x.content);setSource(x.source??"");setError("");
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function reset(){setEditing(null);setTitle("");setContent("");setSource("");}

  async function save(){
    if(!title.trim()||!content.trim())return;
    setLoading(true);setError("");
    try{
      const url=editing?base+"/api/ai/knowledge/"+editing:base+"/api/ai/knowledge";
      const r=await fetch(url,{method:editing?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,content,source})});
      const d=await r.json();if(!r.ok)throw Error(d?.error?.message??"Unable to save knowledge.");
      reset();await load();
    }catch(e){setError(e instanceof Error?e.message:"Save failed");}finally{setLoading(false);}
  }

  async function remove(id:string){
    if(!window.confirm("Delete this knowledge document?"))return;
    const r=await fetch(base+"/api/ai/knowledge/"+id,{method:"DELETE"});
    const d=await r.json();if(!r.ok)throw Error(d?.error?.message??"Unable to delete knowledge.");
    if(editing===id)reset();await load();
  }

  return <MobileAppShell theme="dark"><main className="min-h-screen px-4 py-8 text-white sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-400">AI System / Knowledge</p>
      <h1 className="mt-2 text-3xl font-bold">Knowledge Base</h1>
      <p className="mt-3 text-slate-400">Verified project knowledge indexed for AI retrieval.</p>
      <div className="mt-8 grid gap-5 lg:grid-cols-[380px_1fr]">
        <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-5">
          <div className="flex items-center justify-between"><h2 className="font-bold">{editing?"Edit Knowledge":"Add Knowledge"}</h2>{editing&&<button onClick={reset} className="text-xs text-slate-400">Cancel</button>}</div>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Title" className="mt-4 w-full rounded-xl bg-black/20 p-3 text-sm ring-1 ring-white/10"/>
          <input value={source} onChange={e=>setSource(e.target.value)} placeholder="Source (optional)" className="mt-3 w-full rounded-xl bg-black/20 p-3 text-sm ring-1 ring-white/10"/>
          <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Knowledge content..." className="mt-3 min-h-52 w-full rounded-xl bg-black/20 p-3 text-sm leading-6 ring-1 ring-white/10"/>
          <button onClick={()=>void save()} disabled={loading||!title.trim()||!content.trim()} className="mt-3 rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{loading?"Saving…":editing?"Update Knowledge":"Index Knowledge"}</button>
          {error&&<p className="mt-3 text-sm text-red-300">{error}</p>}
        </section>
        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-bold">{visible.length} documents</h2>
            <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search knowledge..." className="w-full max-w-sm rounded-xl bg-slate-900 p-3 text-sm ring-1 ring-white/10"/>
          </div>
          <div className="space-y-3">{visible.map(x=><article key={x.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-start justify-between gap-4"><div className="min-w-0"><h3 className="font-semibold">{x.title}</h3>{x.source&&<p className="mt-1 text-xs text-blue-300">{x.source}</p>}</div><div className="flex shrink-0 gap-3 text-xs"><button onClick={()=>startEdit(x)} className="text-slate-300">Edit</button><button onClick={()=>void remove(x.id).catch(e=>setError(e.message))} className="text-red-300">Delete</button></div></div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{x.content}</p>
            <p className="mt-3 text-[10px] text-slate-500">{x.embedding?"Indexed":"Indexing pending"} · Updated {new Date(x.updatedAt).toLocaleString()}</p>
          </article>)}{!visible.length&&<p className="rounded-xl border border-white/10 p-6 text-sm text-slate-500">No knowledge documents found.</p>}</div>
        </section>
      </div>
    </div>
  </main></MobileAppShell>;
}
