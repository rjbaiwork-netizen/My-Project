import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Check = {
  status: "healthy" | "degraded" | "unreachable" | "unknown";
  httpStatus?: number;
  latencyMs?: number;
  checkedAt: string;
  details?: Record<string, unknown>;
};

async function checkEndpoint(url: string | undefined): Promise<Check> {
  const checkedAt = new Date().toISOString();
  if (!url) return { status: "unknown", checkedAt, details: { reason: "Backend URL is not configured." } };
  const started = Date.now();
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
      headers: { Accept: "application/json" }
    });
    const latencyMs = Date.now() - started;
    let body: any = {};
    try { body = await response.json(); } catch { /* Keep the health result even if the body is malformed. */ }
    return {
      status: response.ok ? "healthy" : "degraded",
      httpStatus: response.status,
      latencyMs,
      checkedAt,
      details: {
        status: typeof body?.status === "string" ? body.status : "unknown",
        database: typeof body?.database === "string" ? body.database : undefined,
        workerStarted: typeof body?.worker?.started === "boolean" ? body.worker.started : undefined,
        workerHasError: Boolean(body?.worker?.lastError)
      }
    };
  } catch {
    return { status: "unreachable", latencyMs: Date.now() - started, checkedAt };
  }
}

async function getLatestCommit() {
  try {
    const response = await fetch("https://api.github.com/repos/rjbaiwork-netizen/My-Project/commits/main", {
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
      headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }
    });
    if (!response.ok) return { status: "unavailable" as const, checkedAt: new Date().toISOString() };
    const commit: any = await response.json();
    return {
      status: "available" as const,
      sha: typeof commit?.sha === "string" ? commit.sha : undefined,
      shortSha: typeof commit?.sha === "string" ? commit.sha.slice(0, 7) : undefined,
      message: typeof commit?.commit?.message === "string" ? commit.commit.message.split("\n")[0] : undefined,
      committedAt: typeof commit?.commit?.committer?.date === "string" ? commit.commit.committer.date : undefined,
      url: typeof commit?.html_url === "string" ? commit.html_url : undefined,
      checkedAt: new Date().toISOString()
    };
  } catch {
    return { status: "unavailable" as const, checkedAt: new Date().toISOString() };
  }
}

export async function GET() {
  const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const [backend, readiness, latestCommit] = await Promise.all([
    checkEndpoint(backendBase ? `${backendBase}/health` : undefined),
    checkEndpoint(backendBase ? `${backendBase}/ready` : undefined),
    getLatestCommit()
  ]);

  const databaseStatus = readiness.details?.database === "ready"
    ? "healthy"
    : readiness.status === "unreachable" || readiness.status === "unknown"
      ? "unknown"
      : "degraded";
  const workerStatus = readiness.status === "healthy" && readiness.details?.workerStarted === true && readiness.details?.workerHasError !== true
    ? "healthy"
    : readiness.status === "unreachable" || readiness.status === "unknown"
      ? "unknown"
      : "degraded";

  return NextResponse.json({
    success: true,
    checkedAt: new Date().toISOString(),
    refreshIntervalSeconds: 15,
    frontend: { status: "healthy", checkedAt: new Date().toISOString(), details: { note: "This monitoring endpoint is responding." } },
    backend,
    readiness,
    database: { status: databaseStatus, checkedAt: readiness.checkedAt },
    aiWorker: { status: workerStatus, checkedAt: readiness.checkedAt },
    github: { status: latestCommit.status, latestCommit },
    integrations: {
      render: { status: "not_connected", note: "Render deployment API credentials/integration are not configured in this monitoring module yet." },
      railway: { status: "not_connected", note: "Railway deployment API credentials/integration are not configured in this monitoring module yet." }
    }
  }, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } });
}
