"use client";

import Link from "next/link";
import { useState } from "react";

const groups = [
  { title: "Admin Workspace", links: [["Dashboard", "/admin/dashboard"], ["Profile", "/admin/profile"], ["Settings", "/admin/settings"], ["System Configuration", "/admin/system-config"], ["Live System Monitor", "/admin/monitoring"]] },
  { title: "Project Workspace", links: [["Dashboard", "/project/dashboard"], ["Profile", "/project/profile"], ["Settings", "/project/settings"]] },
  { title: "AI Workspace", links: [["Chat Interface", "/ai/chat-interface"], ["AI Bot", "/ai/ai-bot"]] },
] as const;

export default function WorkspaceNav({ theme = "light" }: { theme?: "light" | "dark" }) {
  const [open, setOpen] = useState(false);
  const dark = theme === "dark";
  return (
    <nav aria-label="Workspace navigation" className={dark ? "border-b border-white/10 bg-slate-950" : "border-b border-slate-200 bg-white"}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className={dark ? "text-sm font-semibold text-white" : "text-sm font-semibold text-slate-950"}>My Project</Link>
        <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className={dark ? "rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10" : "rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"}>
          {open ? "Close Menu" : "Workspace Menu"}
        </button>
      </div>
      {open && (
        <div className={dark ? "border-t border-white/10 bg-slate-950" : "border-t border-slate-100 bg-white"}>
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:grid-cols-3 sm:px-6 lg:px-8">
            {groups.map((group) => (
              <section key={group.title}>
                <h2 className={dark ? "px-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500" : "px-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-400"}>{group.title}</h2>
                <div className="mt-1 grid gap-1">
                  {group.links.map(([label, href]) => (
                    <Link key={href} href={href} onClick={() => setOpen(false)} className={dark ? "rounded-lg px-2 py-2 text-sm text-slate-300 hover:bg-white/10 hover:text-white" : "rounded-lg px-2 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950"}>{label}</Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
