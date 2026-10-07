"use client";
import MobileAppShell from "../../../components/layout/MobileAppShell";
import { useEffect, useState } from "react";
import { adminWorkspaceApi, type AdminWorkspaceSettings } from "../../../lib/api";

export default function AdminProfilePage() {
  const [profile,setProfile]=useState<AdminWorkspaceSettings|null>(null);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  useEffect(()=>{void adminWorkspaceApi.get().then(setProfile).catch(e=>setMessage(e instanceof Error?e.message:"Unable to load profile."));},[]);
  async function save(){
    if(!profile)return;
    setSaving(true);setMessage("");
    try{setProfile(await adminWorkspaceApi.update({displayName:profile.displayName,email:profile.email,timezone:profile.timezone}));setMessage("Profile saved.");}
    catch(e){setMessage(e instanceof Error?e.message:"Unable to save profile.");}
    finally{setSaving(false);}
  }
  return <MobileAppShell theme="light"><main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950"><div className="mx-auto max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">My Project / Admin</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Admin Profile</h1><p className="mt-3 text-slate-600">Persistent administrator identity and workspace profile.</p><section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{!profile?<p className="text-sm text-slate-500">Loading…</p>:<div className="space-y-5"><label className="block text-sm font-medium">Display name<input value={profile.displayName} onChange={e=>setProfile({...profile,displayName:e.target.value})} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5"/></label><label className="block text-sm font-medium">Email<input value={profile.email} onChange={e=>setProfile({...profile,email:e.target.value})} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5"/></label><label className="block text-sm font-medium">Timezone<input value={profile.timezone} onChange={e=>setProfile({...profile,timezone:e.target.value})} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5"/></label><button onClick={()=>void save()} disabled={saving} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving?"Saving…":"Save profile"}</button>{message&&<p className="text-sm text-slate-600">{message}</p>}</div>}</section></div></main></MobileAppShell>;
}