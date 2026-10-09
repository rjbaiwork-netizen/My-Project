"use client";

import MobileAppShell from "../../../components/layout/MobileAppShell";
import { useCallback, useEffect, useState } from "react";

type Status = "healthy" | "degraded" | "unreachable" | "unknown" | "available" | "unavailable" | "not_connected";
type Deployment = { id?: string; status?: string; createdAt?: string; finishedAt?: string; updatedAt?: string; commit?: string; message?: string; branch?: string; url?: string };
type Integration = { status: Status; note: string; deployments?: Deployment[]; recentErrors?: Deployment[]; checkedAt?: string };
type MonitorData = {
  success: boolean;
  checkedAt: string;
  refreshIntervalSeconds: number;
  frontend: { status: Status; checkedAt: string; details?: { note?: string } };
  backend: { status: Status; httpStatus?: number; latencyMs?: number; checkedAt: string };
  readiness: { status: Status; httpStatus?: number; latencyMs?: number; checkedAt: string; details?: Record<string, unknown> };
  database: { status: Status; checkedAt: string };
  aiWorker: { status: Status; checkedAt: string };
  github: { status: Status; latestCommit?: { shortSha?: string; sha?: string; message?: string; committedAt?: string; url?: string; checkedAt?: string } };
  integrations: { render: Integration; railway: Integration };
};

function StatusBadge({ status }: { status?: Status }) {
  const label = status === "healthy" ? "Healthy"
    : status === "degraded" ? "Degraded"
    : status === "unreachable" ? "Unreachable"
    : status === "available" ? "Connected"
    : status === "unavailable" ? "Unavailable"
    : status === "not_connected" ? "Not connected"
    : "Unknown";
  const classes = status === "healthy" || status === "available"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "degraded" || status === "unreachable" || status === "unavailable"
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-amber-200 bg-amber-50 text-amber-800";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${classes}`}>{label}</span>;
}

function MetricCard({ title, status, detail, latency }: { title: string; status?: Status; detail?: string; latency?: number }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-600">{title}</h2>
        <StatusBadge status={status} />
      </div>
      <p className="mt-4 text-sm text-slate-500">{detail ?? "No additional details available."}</p>
      {typeof latency === "number" && <p className="mt-3 text-xs text-slate-400">Response: {latency} ms</p>}
    </section>
  );
}

export default function AdminMonitoringPage() {
  const [data, setData] = useState<MonitorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [monitorToken, setMonitorToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    setError("");
    try {
      const response = await fetch("/api/admin/monitor", { cache: "no-store", headers: { Authorization: `Bearer ${monitorToken}` } });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.error?.message ?? "Unable to retrieve monitoring status.");
      setData(payload as MonitorData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Monitoring request failed.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  const latest = data?.github?.latestCommit;
  const worker = data?.readiness?.details?.workerStarted === true && data?.readiness?.details?.workerHasError !== true;
  const database = data?.readiness?.details?.database === "ready";
  const render = data?.integrations?.render;
  const railway = data?.integrations?.railway;
  const recentErrors = [...(render?.recentErrors ?? []), ...(railway?.recentErrors ?? [])].slice(0, 6);

  return (
    <MobileAppShell theme="light">
      <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Admin / Operations</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Live System Monitor</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Live health checks for the frontend, backend, database readiness, AI worker and latest GitHub commit.</p>
            </div>
            <button type="button" onClick={() => void load(true)} disabled={!monitorToken || refreshing} className="inline-flex w-fit items-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
              {refreshing ? "Refreshing…" : "Refresh now"}
            </button>
          </header>

          <form onSubmit={(event) => { event.preventDefault(); setData(null); setLoading(true); setMonitorToken(tokenInput.trim()); }} className="mt-5 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row">
            <input type="password" autoComplete="current-password" value={tokenInput} onChange={(event) => setTokenInput(event.target.value)} placeholder="Monitoring access token" aria-label="Monitoring access token" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500" />
            <button type="submit" className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Connect monitor</button>
            {monitorToken && <button type="button" onClick={() => { setMonitorToken(""); setData(null); setTokenInput(""); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Disconnect</button>}
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
            <span>{loading ? "Checking services…" : "Auto-refresh: every 15 seconds"}</span>
            <span>Last checked: {data?.checkedAt ? new Date(data.checkedAt).toLocaleString() : "Not checked yet"}</span>
          </div>

          {error && <div role="alert" className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Frontend" status={data?.frontend.status} detail="Monitoring page/API responding" />
            <MetricCard title="Backend API" status={data?.backend.status} detail={typeof data?.backend.httpStatus === "number" ? `HTTP ${data.backend.httpStatus}` : "Backend health endpoint"} latency={data?.backend.latencyMs} />
            <MetricCard title="PostgreSQL readiness" status={data?.database.status} detail={database ? "Backend readiness reports database ready" : "Database readiness not confirmed"} latency={data?.readiness.latencyMs} />
            <MetricCard title="AI Worker" status={data?.aiWorker.status} detail={worker ? "Worker started; no reported worker error" : "Worker health not confirmed"} />
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">GitHub · main</h2><StatusBadge status={data?.github.status} /></div>
              {latest?.sha ? <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Latest commit</p>
                <p className="mt-1 font-mono text-lg font-bold">{latest.shortSha}</p>
                <p className="mt-2 text-sm text-slate-700">{latest.message}</p>
                {latest.committedAt && <p className="mt-2 text-xs text-slate-500">Committed: {new Date(latest.committedAt).toLocaleString()}</p>}
                {latest.url && <a href={latest.url} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-blue-700 hover:underline">Open commit on GitHub ↗</a>}
              </div> : <p className="mt-4 text-sm text-slate-500">Latest commit could not be retrieved.</p>}
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold">Deployment integrations</h2>
              <p className="mt-1 text-sm text-slate-500">Platform API status and the latest five deployment records, when credentials are configured.</p>
              <div className="mt-4 space-y-5">
                {([{ name: "Render", item: render }, { name: "Railway", item: railway }] as const).map(({ name, item }) => (
                  <section key={name} className="border-t border-slate-100 pt-4 first:border-0 first:pt-0">
                    <div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold">{name}</p><StatusBadge status={item?.status} /></div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item?.note ?? "Waiting for status."}</p>
                    {!!item?.deployments?.length && <div className="mt-3 space-y-2">
                      {item.deployments.slice(0, 3).map((deployment, index) => (
                        <div key={deployment.id ?? index} className="rounded-lg bg-slate-50 px-3 py-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-slate-800">{deployment.status ?? "Unknown"}</span>
                            <span className="text-[11px] text-slate-500">{deployment.createdAt ? new Date(deployment.createdAt).toLocaleString() : "Time unavailable"}</span>
                          </div>
                          {deployment.message && <p className="mt-1 line-clamp-2 text-xs text-slate-600">{deployment.message.split("\\n")[0]}</p>}
                          {deployment.commit && <p className="mt-1 font-mono text-[11px] text-slate-400">{deployment.commit.slice(0, 8)}</p>}
                          {deployment.url && <a href={deployment.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex text-xs font-semibold text-blue-700 hover:underline">Open deployment ↗</a>}
                        </div>
                      ))}
                    </div>}
                  </section>
                ))}
              </div>
            </article>
          </section>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">Recent deployment errors</h2><StatusBadge status={recentErrors.length ? "degraded" : render?.status === "not_connected" || railway?.status === "not_connected" ? "unknown" : "healthy"} /></div>
            {recentErrors.length ? <div className="mt-3 space-y-2">{recentErrors.map((item, index) => <div key={item.id ?? index} className="rounded-lg border border-rose-100 bg-rose-50 p-3"><p className="text-sm font-semibold text-rose-800">{item.status} · {item.message ?? item.id ?? "Deployment error"}</p><p className="mt-1 text-xs text-rose-700">{item.createdAt ? new Date(item.createdAt).toLocaleString() : "Timestamp unavailable"}</p></div>)}</div> : <p className="mt-2 text-sm text-slate-500">No failed deployment is present in the currently retrieved records. This does not replace platform log inspection.</p>}
            <p className="mt-4 text-xs leading-5 text-slate-500">To enable platform deployment history, configure RENDER_API_KEY and either RAILWAY_PROJECT_TOKEN or RAILWAY_API_TOKEN as server-side environment variables on the Render frontend service. Never place these tokens in browser code or GitHub source files.</p>
          </section>
        </div>
      </main>
    </MobileAppShell>
  );
}
