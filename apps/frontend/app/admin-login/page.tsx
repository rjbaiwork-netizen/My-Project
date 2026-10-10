"use client";

import MobileAppShell from "../../components/layout/MobileAppShell";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        cache: "no-store"
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.error?.message ?? `Login failed (HTTP ${response.status}).`);
      setPassword("");
      router.replace("/aisystem/chat-interface");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return <MobileAppShell theme="dark"><main className="grid min-h-screen place-items-center px-4 py-12 text-white"><section className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl"><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-300">My-Project Security</p><h1 className="mt-3 text-2xl font-bold">Administrator login</h1><p className="mt-2 text-sm leading-6 text-slate-400">Use the administrator password configured in the frontend server environment. It is never stored in browser storage.</p><form onSubmit={submit} className="mt-6 space-y-4"><label className="block text-sm font-medium" htmlFor="admin-password">Admin password</label><input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-xl bg-black/30 px-4 py-3 outline-none ring-1 ring-white/15 focus:ring-blue-400" /><button disabled={busy || !password} className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">{busy ? "Signing in…" : "Sign in"}</button></form>{error && <p role="alert" className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}<p className="mt-5 text-xs leading-5 text-slate-500">Session is signed server-side, HttpOnly, Secure, SameSite=Strict, and expires after 8 hours.</p></section></main></MobileAppShell>;
}
