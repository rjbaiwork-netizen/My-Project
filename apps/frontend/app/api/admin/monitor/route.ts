import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Status = "healthy" | "degraded" | "unreachable" | "unknown" | "available" | "unavailable" | "not_connected";
const checkedAt = () => new Date().toISOString();

async function fetchJson(url: string, init: RequestInit = {}) {
  const response = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(8000) });
  let body: any = null;
  try { body = await response.json(); } catch { body = null; }
  return { response, body };
}

async function checkEndpoint(url: string | undefined): Promise<any> {
  const at = checkedAt();
  if (!url) return { status: "unknown" as Status, checkedAt: at, details: { reason: "Backend URL is not configured." } };
  const started = Date.now();
  try {
    const { response, body } = await fetchJson(url, { headers: { Accept: "application/json" } });
    return {
      status: response.ok ? "healthy" as Status : "degraded" as Status,
      httpStatus: response.status,
      latencyMs: Date.now() - started,
      checkedAt: at,
      details: {
        status: typeof body?.status === "string" ? body.status : "unknown",
        database: typeof body?.database === "string" ? body.database : undefined,
        workerStarted: typeof body?.worker?.started === "boolean" ? body.worker.started : undefined,
        workerHasError: Boolean(body?.worker?.lastError)
      }
    };
  } catch {
    return { status: "unreachable" as Status, latencyMs: Date.now() - started, checkedAt: at };
  }
}

async function getLatestCommit() {
  try {
    const { response, body } = await fetchJson("https://api.github.com/repos/rjbaiwork-netizen/My-Project/commits/main", {
      headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }
    });
    if (!response.ok) return { status: "unavailable" as Status, checkedAt: checkedAt() };
    return {
      status: "available" as Status,
      sha: typeof body?.sha === "string" ? body.sha : undefined,
      shortSha: typeof body?.sha === "string" ? body.sha.slice(0, 7) : undefined,
      message: typeof body?.commit?.message === "string" ? body.commit.message.split("\n")[0] : undefined,
      committedAt: typeof body?.commit?.committer?.date === "string" ? body.commit.committer.date : undefined,
      url: typeof body?.html_url === "string" ? body.html_url : undefined,
      checkedAt: checkedAt()
    };
  } catch {
    return { status: "unavailable" as Status, checkedAt: checkedAt() };
  }
}

function normalizeRenderStatus(status: unknown): Status {
  const value = String(status ?? "").toLowerCase();
  if (value === "live" || value === "available") return "healthy";
  if (value.includes("fail") || value.includes("error") || value.includes("canceled")) return "degraded";
  if (value.includes("progress") || value === "created" || value === "pending") return "unknown";
  return "unknown";
}

async function getRenderDeployments() {
  const apiKey = process.env.RENDER_API_KEY;
  const serviceId = process.env.RENDER_SERVICE_ID ?? "srv-db2e1dm0tbcc738tfkk0";
  if (!apiKey) return {
    status: "not_connected" as Status,
    note: "Add RENDER_API_KEY to the Render frontend service environment. The token is only used server-side.",
    deployments: [],
    checkedAt: checkedAt()
  };
  try {
    const { response, body } = await fetchJson(`https://api.render.com/v1/services/${encodeURIComponent(serviceId)}/deploys?limit=5`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }
    });
    if (!response.ok) return {
      status: "unavailable" as Status,
      note: response.status === 401 || response.status === 403 ? "Render API token was rejected or lacks access." : `Render API returned HTTP ${response.status}.`,
      deployments: [],
      checkedAt: checkedAt()
    };
    const rows = Array.isArray(body) ? body : Array.isArray(body?.deploys) ? body.deploys : [];
    const deployments = rows.slice(0, 5).map((item: any) => {
      const d = item?.deploy ?? item;
      return {
        id: d?.id,
        status: d?.status ?? "unknown",
        createdAt: d?.createdAt,
        finishedAt: d?.finishedAt,
        commit: d?.commit?.id,
        message: d?.commit?.message,
        url: d?.id ? `https://dashboard.render.com/web/${serviceId}/deploys/${d.id}` : undefined
      };
    });
    const ownerId = process.env.RENDER_OWNER_ID ?? "tea-d6vpjsnkijhs73d06c6g";
    let logs: any[] = [];
    try {
      const startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const endTime = new Date().toISOString();
      const params = new URLSearchParams({
        ownerId, direction: "backward", limit: "10", startTime, endTime
      });
      params.append("resource", serviceId);
      params.append("type", "app");
      params.append("type", "build");
      params.append("level", "error");
      params.append("level", "warn");
      const logResult = await fetchJson(`https://api.render.com/v1/logs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }
      });
      if (logResult.response.ok && Array.isArray(logResult.body?.logs)) {
        logs = logResult.body.logs.map((log: any) => {
          const labels = Array.isArray(log?.labels) ? log.labels : [];
          const level = labels.find((label: any) => label?.name === "level")?.value ?? "error";
          return { id: log?.id, status: String(level).toUpperCase(), createdAt: log?.timestamp, message: log?.message, url: undefined };
        });
      }
    } catch { /* Deployment status remains available if the logs API is unavailable. */ }
    const latestStatus = normalizeRenderStatus(deployments[0]?.status);
    return {
      status: latestStatus === "unknown" && deployments.length === 0 ? "unavailable" as Status : latestStatus,
      note: deployments.length ? "Deployment history retrieved from the Render API." : "Render API connected; no deployment records were returned.",
      deployments,
      recentErrors: [
        ...deployments.filter((d: any) => normalizeRenderStatus(d.status) === "degraded"),
        ...logs
      ].slice(0, 10),
      checkedAt: checkedAt()
    };
  } catch {
    return { status: "unavailable" as Status, note: "Render API request failed or timed out.", deployments: [], checkedAt: checkedAt() };
  }
}

async function getRailwayDeployments() {
  const projectToken = process.env.RAILWAY_PROJECT_TOKEN;
  const apiToken = process.env.RAILWAY_API_TOKEN;
  const projectId = process.env.RAILWAY_PROJECT_ID ?? "828ab857-c542-4cc1-b1de-6cb1a7b155d5";
  const environmentId = process.env.RAILWAY_ENVIRONMENT_ID ?? "bbb86f7a-4adb-4d60-b790-73276a65958e";
  const serviceId = process.env.RAILWAY_SERVICE_ID ?? "8d0e4be9-457d-4b49-b81d-3e375240559a";
  if (!projectToken && !apiToken) return {
    status: "not_connected" as Status,
    note: "Add RAILWAY_PROJECT_TOKEN or RAILWAY_API_TOKEN to the Render frontend service environment. Token remains server-side.",
    deployments: [],
    checkedAt: checkedAt()
  };
  const query = `query deployments($input: DeploymentListInput!, $first: Int) {
    deployments(input: $input, first: $first) {
      edges { node { id status createdAt updatedAt url meta } }
    }
  }`;
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
    if (projectToken) headers["Project-Access-Token"] = projectToken;
    else headers.Authorization = `Bearer ${apiToken}`;
    const { response, body } = await fetchJson("https://backboard.railway.com/graphql/v2", {
      method: "POST",
      headers,
      body: JSON.stringify({
        query,
        variables: { input: { projectId, serviceId, environmentId }, first: 5 }
      })
    });
    if (!response.ok || body?.errors?.length) return {
      status: "unavailable" as Status,
      note: response.status === 401 || response.status === 403 ? "Railway API token was rejected or lacks access." : "Railway API request failed; verify token scope and project/service IDs.",
      deployments: [],
      checkedAt: checkedAt()
    };
    const rows = body?.data?.deployments?.edges;
    const deployments = Array.isArray(rows) ? rows.map((edge: any) => {
      const d = edge?.node ?? {};
      const meta = d?.meta ?? {};
      return {
        id: d?.id,
        status: d?.status ?? "unknown",
        createdAt: d?.createdAt,
        updatedAt: d?.updatedAt,
        url: d?.url,
        commit: meta?.commitHash,
        message: meta?.commitMessage,
        branch: meta?.branch
      };
    }).slice(0, 5) : [];
    const latest = String(deployments[0]?.status ?? "").toUpperCase();
    const status: Status = latest === "SUCCESS" ? "healthy"
      : ["FAILED", "CRASHED"].includes(latest) ? "degraded"
      : ["BUILDING", "DEPLOYING", "INITIALIZING", "QUEUED", "WAITING"].includes(latest) ? "unknown"
      : deployments.length ? "unknown" : "unavailable";
    return {
      status,
      note: deployments.length ? "Deployment history retrieved from the Railway API." : "Railway API connected; no deployment records were returned.",
      deployments,
      recentErrors: deployments.filter((d: any) => ["FAILED", "CRASHED"].includes(String(d.status).toUpperCase())),
      checkedAt: checkedAt()
    };
  } catch {
    return { status: "unavailable" as Status, note: "Railway API request failed or timed out.", deployments: [], checkedAt: checkedAt() };
  }
}

export async function GET(_request: NextRequest) {
  const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  const adminToken = process.env.ADMIN_API_TOKEN;
  if (!backendBase || !adminToken) {
    return NextResponse.json({ success: false, error: { message: "Monitoring requires the backend URL and configured admin service token." } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  // Reuse the backend's existing admin-protected endpoint to avoid exposing monitoring data publicly.
  try {
    const authCheck = await fetch(`${backendBase}/api/admin/workspace`, {
      headers: { Authorization: `Bearer ${adminToken}`, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(6000)
    });
    if (authCheck.status === 401 || authCheck.status === 403) {
      return NextResponse.json({ success: false, error: { message: "Admin authorization check failed." } }, { status: 401, headers: { "Cache-Control": "no-store" } });
    }
    if (!authCheck.ok) {
      return NextResponse.json({ success: false, error: { message: "Admin authorization service is temporarily unavailable." } }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
  } catch {
    return NextResponse.json({ success: false, error: { message: "Unable to verify admin access with the backend." } }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const [backend, readiness, latestCommit, render, railway] = await Promise.all([
    checkEndpoint(`${backendBase}/health`),
    checkEndpoint(`${backendBase}/ready`),
    getLatestCommit(),
    getRenderDeployments(),
    getRailwayDeployments()
  ]);

  const databaseStatus = readiness.details?.database === "ready" ? "healthy" as Status
    : readiness.status === "unreachable" || readiness.status === "unknown" ? "unknown" as Status : "degraded" as Status;
  const workerStatus = readiness.status === "healthy" && readiness.details?.workerStarted === true && readiness.details?.workerHasError !== true ? "healthy" as Status
    : readiness.status === "unreachable" || readiness.status === "unknown" ? "unknown" as Status : "degraded" as Status;

  return NextResponse.json({
    success: true,
    checkedAt: checkedAt(),
    refreshIntervalSeconds: 15,
    frontend: { status: "healthy" as Status, checkedAt: checkedAt(), details: { note: "This monitoring endpoint is responding." } },
    backend,
    readiness,
    database: { status: databaseStatus, checkedAt: readiness.checkedAt },
    aiWorker: { status: workerStatus, checkedAt: readiness.checkedAt },
    github: { status: latestCommit.status, latestCommit },
    integrations: { render, railway }
  }, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate", "Vary": "Cookie, Authorization" } });
}
