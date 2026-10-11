"use client";

import MobileAppShell from "../../components/layout/MobileAppShell";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LoginRequest = { requestId: string; pollToken: string; sessionToken: string; expiresAt: number };

export default function AdminLoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState<LoginRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "pending" | "approved" | "denied" | "expired">("idle");
  const [error, setError] = useState("");

  async function requestLogin() {
    if (busy || login) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) throw new Error(data?.error?.message ?? "Unable to request Telegram approval.");
      setLogin({ requestId: data.requestId, pollToken: data.pollToken, sessionToken: data.sessionToken, expiresAt: Date.now() + (data.expiresInSeconds ?? 300) * 1000 });
      setStatus("pending");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start login.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!login || status !== "pending") return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      if (stopped) return;
      if (Date.now() >= login.expiresAt) { setStatus("expired"); setLogin(null); return; }
      try {
        const response = await fetch("/api/admin/login-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: login.requestId, pollToken: login.pollToken, sessionToken: login.sessionToken }),
          cache: "no-store"
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.success) throw new Error(data?.error?.message ?? "Could not check approval status.");
        if (data.status === "approved") {
          setStatus("approved");
          setLogin(null);
          router.replace("/aisystem/chat-interface");
          return;
        }
        if (data.status === "denied") { setStatus("denied"); setLogin(null); return; }
        if (data.status === "expired") { setStatus("expired"); setLogin(null); return; }
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Connection interrupted; retrying.");
      }
      timer = setTimeout(poll, 2000);
    };
    timer = setTimeout(poll, 1200);
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, [login, status, router]);

  return <MobileAppShell theme="dark"><main className="grid min-h-screen place-items-center px-4 py-12 text-white"><section className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl">
    <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-300">My-Project Security</p>
    <h1 className="mt-3 text-2xl font-bold">Telegram Admin Login</h1>
    <p className="mt-2 text-sm leading-6 text-slate-400">Request a secure sign-in. The configured Owner must approve this browser in Telegram before an admin session is created.</p>
    <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-semibold">Approval status</p>
      <p aria-live="polite" className="mt-2 text-sm text-slate-300">{status === "pending" ? "Waiting for Owner approval in Telegram…" : status === "approved" ? "Approved. Opening admin workspace…" : status === "denied" ? "The Owner denied this login request." : status === "expired" ? "This request expired. Start a new request." : "No active login request."}</p>
      {status === "pending" && <p className="mt-2 text-xs text-slate-500">The request expires in 5 minutes. Keep this page open while approving it in Telegram.</p>}
    </div>
    <button onClick={requestLogin} disabled={busy || !!login} className="mt-5 w-full rounded-xl bg-white px-4 py-3 font-semibold text-slate-950 disabled:opacity-50">{busy ? "Requesting approval…" : login ? "Approval requested" : "Request Telegram approval"}</button>
    {(status === "denied" || status === "expired") && <button onClick={() => { setStatus("idle"); setError(""); }} className="mt-3 w-full rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-white">Try again</button>}
    {error && <p role="alert" className="mt-4 rounded-lg border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
    <p className="mt-5 text-xs leading-5 text-slate-500">Session protection: HttpOnly, Secure, SameSite=Strict; 24-hour maximum lifetime; 2-hour inactivity timeout. Every login requires Owner approval.</p>
  </section></main></MobileAppShell>;
}
