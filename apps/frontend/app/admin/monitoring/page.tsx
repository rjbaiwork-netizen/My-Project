"use client";

import MobileAppShell from "../../../components/layout/MobileAppShell";
import { useCallback, useEffect, useState } from "react";

type Status = "healthy" | "degraded" | "unreachable" | "unknown" | "available" | "unavailable" | "not_connected";
type Deployment = { id?: string; status?: string; createdAt?: string; finishedAt?: string; updatedAt?: string; commit?: string; message?: string; branch?: string; url?: string };
type Integration = { status: Status; note: string; deployments?: Deployment[]; recentErrors?: Deployment[]; checkedAt?: string };
type RegistryFeature = { id: string; name: string; description: string; source?: string; addedAt?: string; commit?: string };
type RegistryUpdate = { id: string; commit?: string; title: string; date: string; url?: string; features?: string[]; changedFiles?: string[]; deploymentStatus?: string };
type RegistryPayload = { features: RegistryFeature[]; updates: RegistryUpdate[] };
type WorkflowRun = { id: number; name?: string; status?: string; conclusion?: string | null; createdAt?: string; updatedAt?: string; url?: string; commit?: string; branch?: string };
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
  githubActions?: { status: Status; note: string; runs: WorkflowRun[]; checkedAt: string };
  connectionCenter?: Record<string, { configured: boolean; status: Status }>;
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
  const [registryData, setRegistryData] = useState<RegistryPayload | null>(null);
  const [registryError, setRegistryError] = useState("");
  const [registrySearch, setRegistrySearch] = useState("");
  const [registryView, setRegistryView] = useState<"all" | "features" | "updates">("all");

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

  useEffect(() => {
    let cancelled = false;
    const loadRegistry = async () => {
      try {
        const response = await fetch("/api/admin/feature-registry", {
          cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok || !payload?.success) throw new Error(payload?.error?.message ?? "Unable to load feature registry.");
        if (!cancelled) {
          setRegistryData(payload.registry as RegistryPayload);
          setRegistryError("");
        }
      } catch (e) {
        if (!cancelled) setRegistryError(e instanceof Error ? e.message : "Feature registry request failed.");
      }
    };
    void loadRegistry();
    const timer = window.setInterval(() => void loadRegistry(), 15000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  const searchTerm = registrySearch.trim().toLowerCase();
  const visibleFeatures = (registryData?.features ?? []).filter((feature) => `${feature.name} ${feature.description} ${feature.source ?? ""} ${feature.commit ?? ""}`.toLowerCase().includes(searchTerm));
  const visibleUpdates = (registryData?.updates ?? []).filter((update) => `${update.title} ${update.commit ?? ""} ${(update.features ?? []).join(" ")} ${(update.changedFiles ?? []).join(" ")}`.toLowerCase().includes(searchTerm));
  const latest = data?.github?.latestCommit;
  const worker = data?.readiness?.details?.workerStarted === true && data?.readiness?.details?.workerHasError !== true;
  const database = data?.readiness?.details?.database === "ready";
  const render = data?.integrations?.render;
  const railway = data?.integrations?.railway;
  const recentErrors = [...(render?.recentErrors ?? []), ...(railway?.recentErrors ?? [])].slice(0, 6);
  const connectionRows = [
    { name: "Backend / Admin API", key: "backend", detail: "Backend health, readiness and protected admin check" },
    { name: "GitHub main API", key: "github", detail: "Latest commit metadata from public repository API" },
    { name: "GitHub Actions", key: "githubActions", detail: "Recent CI/build workflow runs" },
    { name: "Render API", key: "render", detail: "Private deployment history and provider logs" },
    { name: "Railway API", key: "railway", detail: "Private deployment history and failed-deployment logs" },
  ];
  const diagnoses: { level: "error" | "warning" | "info"; title: string; action: string }[] = [];
  if (data?.backend.status === "unreachable") diagnoses.push({ level: "error", title: "Backend API unreachable", action: "Check Railway service health, public URL, port binding and recent deployment logs." });
  if (data?.backend.status === "degraded") diagnoses.push({ level: "error", title: "Backend health endpoint returned a non-success response", action: "Open backend logs and inspect the latest deploy before changing environment variables." });
  if (data && data.database.status !== "healthy") diagnoses.push({ level: data.database.status === "degraded" ? "error" : "warning", title: "Database readiness is not confirmed", action: "Verify DATABASE_URL exists on the backend service and the database is running; check migration/startup logs." });
  if (data && data.aiWorker.status !== "healthy") diagnoses.push({ level: data.aiWorker.status === "degraded" ? "warning" : "info", title: "AI worker health is not confirmed", action: "Check backend readiness details and worker startup/error logs." });
  if (data?.githubActions?.runs?.some((run) => run.conclusion === "failure")) diagnoses.push({ level: "error", title: "GitHub Actions has a failed workflow", action: "Open the failed workflow run and inspect the first failing step." });
  if (render?.status === "not_connected") diagnoses.push({ level: "warning", title: "Render deployment API is not connected", action: "Add RENDER_API_KEY to the Render frontend service environment; keep it server-side." });
  if (railway?.status === "not_connected") diagnoses.push({ level: "warning", title: "Railway deployment API is not connected", action: "Add RAILWAY_PROJECT_TOKEN (preferred) or RAILWAY_API_TOKEN to the Render frontend service environment." });
  if (render?.status === "unavailable" || railway?.status === "unavailable") diagnoses.push({ level: "warning", title: "A platform API request failed", action: "Check token scope, resource IDs and provider API availability; credentials are never shown here." });
  if (!diagnoses.length && data) diagnoses.push({ level: "info", title: "No active monitor-detected issue", action: "Health/readiness checks are currently passing; this does not guarantee every application feature works." });

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

          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            Monitoring starts automatically; no separate monitoring access token is required.
            Platform deployment history and provider logs still require server-side Render/Railway credentials.
          </div>

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

          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">API Connection Center</p><h2 className="mt-1 text-xl font-bold">Connected services & access diagnostics</h2><p className="mt-1 text-sm text-slate-500">Shows whether each integration is configured, without revealing credentials.</p></div>
              <span className="text-xs text-slate-500">Read-only · auto-refresh 15s</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {connectionRows.map((connection) => {
                const state = data?.connectionCenter?.[connection.key];
                return <div key={connection.key} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold">{connection.name}</p><StatusBadge status={state?.status ?? "unknown"} /></div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{connection.detail}</p>
                  <p className="mt-3 text-xs font-medium">{state?.configured ? "Configuration: detected" : "Configuration: missing / not detected"}</p>
                </div>;
              })}
            </div>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Automated Diagnosis</p><h2 className="mt-1 text-xl font-bold">Issue detection & suggested next steps</h2></div><StatusBadge status={diagnoses.some((item) => item.level === "error") ? "degraded" : diagnoses.some((item) => item.level === "warning") ? "unknown" : "healthy"} /></div>
              <div className="mt-4 space-y-3">
                {diagnoses.map((item, index) => <div key={index} className={`rounded-xl border p-3 ${item.level === "error" ? "border-rose-200 bg-rose-50" : item.level === "warning" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"}`}>
                  <p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-sm leading-5 text-slate-600">{item.action}</p>
                </div>)}
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">These are rule-based diagnostics from observed status—not AI guesses or proof of root cause. No deploy, restart, or data mutation is performed.</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">CI / Build Timeline</p><h2 className="mt-1 text-xl font-bold">Recent GitHub Actions runs</h2></div><StatusBadge status={data?.githubActions?.status} /></div>
              <p className="mt-1 text-sm text-slate-500">{data?.githubActions?.note ?? "Waiting for GitHub Actions status."}</p>
              <div className="mt-4 space-y-2">
                {(data?.githubActions?.runs ?? []).map((run) => <div key={run.id} className="rounded-lg border border-slate-100 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold">{run.name ?? "GitHub workflow"}</p><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${run.conclusion === "success" ? "bg-emerald-50 text-emerald-700" : run.conclusion === "failure" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"}`}>{run.conclusion ?? run.status ?? "unknown"}</span></div>
                  <p className="mt-1 text-xs text-slate-500">{run.branch ?? "branch unavailable"} · {run.createdAt ? new Date(run.createdAt).toLocaleString() : "time unavailable"}</p>
                  {run.commit && <p className="mt-1 font-mono text-[11px] text-slate-400">{run.commit.slice(0, 8)}</p>}
                  {run.url && <a href={run.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-blue-700 hover:underline">Open workflow run ↗</a>}
                </div>)}
                {!data?.githubActions?.runs?.length && <p className="text-sm text-slate-500">No public workflow runs were returned. Private repository access may require a GitHub token.</p>}
              </div>
            </article>
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
            <p className="mt-4 text-xs leading-5 text-slate-500">To enable platform deployment history, configure RENDER_API_KEY and either RAILWAY_PROJECT_TOKEN or RAILWAY_API_TOKEN as server-side environment variables on the Render frontend service. These provider credentials remain required for private deployment/log APIs; never place them in browser code or GitHub source files.</p>
          </section>

          <section className="mt-6">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">Project Change Ledger</p>
                <h2 className="mt-1 text-xl font-bold">Feature Registry & Update History</h2>
                <p className="mt-1 text-sm text-slate-500">Feature inventory and append-only history from GitHub main commits.</p>
              </div>
              <span className="text-xs text-slate-500">{registryData ? `${registryData.features.length} features · ${registryData.updates.length} updates` : "Waiting for registry"}</span>
            </div>
            {registryError && <div role="alert" className="mb-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{registryError}</div>}
            <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="block">
                <span className="sr-only">Search features and updates</span>
                <input
                  value={registrySearch}
                  onChange={(event) => setRegistrySearch(event.target.value)}
                  placeholder="Search features, commits, or changed files…"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </label>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Registry view">
                {([{ id: "all", label: "All" }, { id: "features", label: "Features" }, { id: "updates", label: "Updates" }] as const).map((option) => (
                  <button key={option.id} type="button" onClick={() => setRegistryView(option.id)} aria-pressed={registryView === option.id} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${registryView === option.id ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600"}`}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid items-start gap-4 lg:grid-cols-2">
              {registryView !== "updates" && <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold">Existing Features</h3>
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{registryData?.features.length ?? 0} tracked</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">এ পর্যন্ত রেজিস্ট্রিতে নথিভুক্ত ফিচার। নতুন feature-ধরনের main commit হলে workflow তালিকায় নতুন এন্ট্রি যোগ করবে।</p>
                <div className="mt-4 space-y-3">
                  {visibleFeatures.map((feature) => (
                    <div key={feature.id} className="rounded-xl border border-slate-100 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{feature.name}</p>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">{feature.source ?? "GitHub"}</span>
                      </div>
                      <p className="mt-1 text-sm leading-5 text-slate-600">{feature.description}</p>
                      {feature.commit && <a href={`https://github.com/rjbaiwork-netizen/My-Project/commit/${feature.commit}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-blue-700 hover:underline">View source commit ↗</a>}
                    </div>
                  ))}
                  {!visibleFeatures.length && <p className="text-sm text-slate-500">{searchTerm ? "No features match this search." : "Feature list is not available yet."}</p>}
                </div>
              </article>}

              {registryView !== "features" && <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold">Update History</h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">Newest first</span>
                </div>
                <p className="mt-1 text-sm text-slate-500">প্রতিটি main-branch commit-এর রেকর্ড; পুরোনো রেকর্ড রেখে নতুনটি উপরে যোগ হবে।</p>
                <div className="mt-4 space-y-3">
                  {visibleUpdates.map((update) => (
                    <div key={update.id} className="rounded-xl border border-slate-100 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-900">{update.title}</p>
                        <span className="text-[11px] text-slate-500">{update.date ? new Date(update.date).toLocaleString() : "Date unavailable"}</span>
                      </div>
                      {update.commit && <p className="mt-1 font-mono text-[11px] text-slate-400">{update.commit.slice(0, 7)}</p>}
                      {!!update.features?.length && <div className="mt-2 flex flex-wrap gap-1.5">{update.features.map((feature) => <span key={feature} className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-800">{feature}</span>)}</div>}
                      {!!update.changedFiles?.length && <details className="mt-2"><summary className="cursor-pointer text-xs font-semibold text-slate-600">Changed files ({update.changedFiles.length})</summary><ul className="mt-2 space-y-1 pl-4 text-xs text-slate-500">{update.changedFiles.map((file) => <li key={file} className="list-disc break-all">{file}</li>)}</ul></details>}
                      <p className="mt-2 text-xs leading-5 text-slate-500">Deployment: {update.deploymentStatus ?? "Not verified"}</p>
                      {update.url && <a href={update.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-xs font-semibold text-blue-700 hover:underline">Open GitHub commit ↗</a>}
                    </div>
                  ))}
                  {!visibleUpdates.length && <p className="text-sm text-slate-500">{searchTerm ? "No updates match this search." : "No update history is available yet."}</p>}
                </div>
              </article>}
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">Automation records pushes to main. Commit messages beginning with feat: or feature: are also added to Existing Features. GitHub recording does not itself prove Render/Railway deployment success; deployment status must be verified separately.</p>
          </section>
        </div>
      </main>
    </MobileAppShell>
  );
}
