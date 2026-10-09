"use client";

import MobileAppShell from "../../../components/layout/MobileAppShell";
import { useCallback, useEffect, useState } from "react";

type Status = "healthy" | "degraded" | "unreachable" | "unknown" | "available" | "unavailable" | "not_connected";
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
  integrations: {
    render: { status: Status; note: string };
    railway: { status: Status; note: string };
  };
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    setError("");
    try {
      const response = await fetch("/api/admin/monitor", { cache: "no-store" });
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
            <button type="button" onClick={() => void load(true)} disabled={refreshing} className="inline-flex w-fit items-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60">
              {refreshing ? "Refreshing…" : "Refresh now"}
            </button>
          </header>

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
              <p className="mt-1 text-sm text-slate-500">Deployment state is not guessed; platform API connections are shown separately.</p>
              <div className="mt-4 space-y-4">
                <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">Render</p><p className="mt-1 text-xs leading-5 text-slate-500">{data?.integrations.render.note ?? "Waiting for status."}</p></div><StatusBadge status={data?.integrations.render.status} /></div>
                <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">Railway</p><p className="mt-1 text-xs leading-5 text-slate-500">{data?.integrations.railway.note ?? "Waiting for status."}</p></div><StatusBadge status={data?.integrations.railway.status} /></div>
              </div>
            </article>
          </section>

          <p className="mt-6 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-900">
            This first implementation uses live health/readiness endpoints and GitHub’s public commit API. Render and Railway deployment history, build logs, and platform metrics require a separate secure platform-API integration and are intentionally not represented as live until connected.
          </p>
        </div>
      </main>
    </MobileAppShell>
  );
}
