"use client";
import MobileAppShell from "../../../components/layout/MobileAppShell";
import { useEffect, useState } from "react";
import { adminWorkspaceApi, type AdminWorkspaceSettings } from "../../../lib/api";

export default function AdminSettingsPage() {
  const [settings,setSettings]=useState<AdminWorkspaceSettings|null>(null);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  useEffect(()=>{void adminWorkspaceApi.get().then(setSettings).catch(e=>setMessage(e instanceof Error?e.message:"Unable to load settings."));},[]);
  async function save(){
    if(!settings)return;
    setSaving(true);setMessage("");
    try{setSettings(await adminWorkspaceApi.update({theme:settings.theme,notificationsEnabled:settings.notificationsEnabled,maintenanceMode:settings.maintenanceMode}));setMessage("Settings saved.");}
    catch(e){setMessage(e instanceof Error?e.message:"Unable to save settings.");}
    finally{setSaving(false);}
  }
  return <MobileAppShell theme="light"><main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950"><div className="mx-auto max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">My Project / Admin</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Admin Settings</h1><p className="mt-3 text-slate-600">Persistent workspace preferences and operational controls.</p><section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">{!settings?<p className="text-sm text-slate-500">Loading…</p>:<div className="space-y-5"><label className="block text-sm font-medium">Theme<select value={settings.theme} onChange={e=>setSettings({...settings,theme:e.target.value as AdminWorkspaceSettings["theme"]})} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label><label className="flex items-center justify-between rounded-xl border border-slate-200 p-4 text-sm"><span>Notifications enabled</span><input type="checkbox" checked={settings.notificationsEnabled} onChange={e=>setSettings({...settings,notificationsEnabled:e.target.checked})}/></label><label className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm"><span>Maintenance mode</span><input type="checkbox" checked={settings.maintenanceMode} onChange={e=>setSettings({...settings,maintenanceMode:e.target.checked})}/></label><button onClick={()=>void save()} disabled={saving} className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving?"Saving…":"Save settings"}</button>{message&&<p className="text-sm text-slate-600">{message}</p>}</div>}</section></div></main></MobileAppShell>;
}