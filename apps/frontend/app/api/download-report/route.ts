import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "docs", "my-project-full-blueprint-bn.md");

  try {
    const report = await readFile(filePath, "utf8");

    return new Response(report, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'attachment; filename="My-Project-Full-Blueprint-Live-Audit-BN.md"; filename*=UTF-8\'\'My-Project-Full-Blueprint-Live-Audit-BN.md',
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Report file not found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
