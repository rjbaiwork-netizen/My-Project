import { readFile } from "node:fs/promises";
import path from "node:path";
import { projectDocuments, type DocumentFormat } from "../../../../lib/project-documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supportedFormats: DocumentFormat[] = ["md", "txt", "html"];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toPlainText(markdown: string): string {
  return markdown
    .replace(/^\\s*[-*_]{3,}\\s*$/gm, "")
    .replace(/^\\s{0,3}#{1,6}\\s+/gm, "")
    .replace(/^\\s*>\\s?/gm, "")
    .replace(/^\\s*[-*+]\\s+/gm, "• ")
    .replace(/^\\s*\\d+\\.\\s+/gm, "")
    .replace(/\\*\\*(.*?)\\*\\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\\*(.*?)\\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/\\[(.*?)\\]\\((https?:[^)]+)\\)/g, "$1 ($2)")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\\|.*\\|$/gm, (line) => line.replace(/^\\|/, "").replace(/\\|$/, "").replace(/\\|/g, "  |  "))
    .replace(/^\\s*:?[-]+:?([| :?-]*).*$/gm, "")
    .trim() + "\\n";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const document = projectDocuments.find((item) => item.id === id);

  if (!document) {
    return new Response("Document not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const requested = new URL(request.url).searchParams.get("format") ?? "md";
  if (!supportedFormats.includes(requested as DocumentFormat) ||
      !document.formats.includes(requested as DocumentFormat)) {
    return new Response("Unsupported document format", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  try {
    const filePath = path.join(process.cwd(), "public", "docs", document.filename);
    const markdown = await readFile(filePath, "utf8");
    const baseName = document.filename.replace(/\\.md$/i, "");
    let body = markdown;
    let contentType = "text/markdown; charset=utf-8";
    let filename = baseName + ".md";

    if (requested === "txt") {
      body = toPlainText(markdown);
      contentType = "text/plain; charset=utf-8";
      filename = baseName + ".txt";
    } else if (requested === "html") {
      body = `<!doctype html>
<html lang="bn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(document.title)}</title>
<style>body{font-family:system-ui,sans-serif;max-width:900px;margin:2rem auto;padding:0 1rem;line-height:1.7;color:#172033}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}</style>
</head>
<body><h1>${escapeHtml(document.title)}</h1><pre>${escapeHtml(markdown)}</pre></body>
</html>`;
      contentType = "text/html; charset=utf-8";
      filename = baseName + ".html";
    }

    return new Response(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Document file not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
