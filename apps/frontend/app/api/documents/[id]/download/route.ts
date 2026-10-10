import { readFile } from "node:fs/promises";
import path from "node:path";
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import PDFDocument from "pdfkit";
import { projectDocuments, type DocumentFormat } from "../../../../../lib/project-documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supportedFormats: DocumentFormat[] = ["md", "txt", "html", "docx", "pdf"];

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
    .replace(/^\s*[-*_]{3,}\s*$/gm, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "• ")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/\[(.*?)\]\((https?:[^)]+)\)/g, "$1 ($2)")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\|.*\|$/gm, (line) => line.replace(/^\|/, "").replace(/\|$/, "").replace(/\|/g, "  |  "))
    .replace(/^\s*:?[-]+:?([| :?-]*).*$/gm, "")
    .trim() + "\n";
}

function makeDocx(markdown: string, title: string): Promise<Buffer> {
  const paragraphs = markdown.split(/\r?\n/).map((line) => {
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const headingLevel = level === 1 ? HeadingLevel.HEADING_1
        : level === 2 ? HeadingLevel.HEADING_2
        : HeadingLevel.HEADING_3;
      return new Paragraph({ heading: headingLevel, children: [new TextRun(heading[2])] });
    }
    const clean = line
      .replace(/^\s*>\s?/, "")
      .replace(/^\s*[-*+]\s+/, "• ")
      .replace(/^\s*\d+\.\s+/, "• ")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/^\|.*\|$/, (row) => row.replace(/^\|/, "").replace(/\|$/, "").replace(/\|/g, "   |   "));
    return new Paragraph({ children: [new TextRun(clean || " ")] });
  });
  const doc = new Document({
    creator: "My-Project Document Library",
    title,
    description: "Exported project report",
    sections: [{ properties: {}, children: paragraphs }],
  });
  return Packer.toBuffer(doc);
}

async function makePdf(markdown: string, title: string): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const pdf = new PDFDocument({ autoFirstPage: true, margin: 48, size: "A4", info: { Title: title, Author: "My-Project" } });
    const chunks: Buffer[] = [];
    pdf.on("data", (chunk: Buffer) => chunks.push(chunk));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);

    // Prefer an installed Bengali font so Bengali glyphs can be embedded in the PDF.
    const fontCandidates = [
      path.join(process.cwd(), "node_modules/@fontsource/noto-sans-bengali/files/noto-sans-bengali-bengali-400-normal.woff2"),
      path.join(process.cwd(), "node_modules/@fontsource/noto-sans-bengali/files/noto-sans-bengali-bengali-400-normal.woff"),
    ];
    let fontReady = false;
    for (const fontPath of fontCandidates) {
      try {
        await readFile(fontPath);
        pdf.font(fontPath);
        fontReady = true;
        break;
      } catch {
        // Try the next available font format.
      }
    }
    if (!fontReady) pdf.font("Helvetica");

    pdf.fontSize(16).text(title, { align: "left" });
    pdf.moveDown(0.8);
    pdf.fontSize(9.5).text(toPlainText(markdown), { lineGap: 3, paragraphGap: 4 });
    pdf.end();
  });
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
    const baseName = document.filename.replace(/\.md$/i, "");
    let body: string | Buffer = markdown;
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
    } else if (requested === "docx") {
      body = await makeDocx(markdown, document.title);
      contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      filename = baseName + ".docx";
    } else if (requested === "pdf") {
      body = await makePdf(markdown, document.title);
      contentType = "application/pdf";
      filename = baseName + ".pdf";
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
  } catch (error) {
    console.error("Document export failed:", error);
    return new Response("Document export failed", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
