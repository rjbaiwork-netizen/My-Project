"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Website", icon: "⌂" },
  { href: "/admin/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/aisystem/chat-interface", label: "AI Chat", icon: "✦" },
  { href: "/aisystem/knowledge-base", label: "Knowledge", icon: "◈" },
  { href: "/aisystem/automation", label: "Automation", icon: "↗" },
];

function active(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export default function MobileAppShell({children,theme="light"}:{children:ReactNode;theme?:"light"|"dark"}) {
  const pathname = usePathname();
  const dark = theme === "dark";
  const surface = dark ? "border-white/10 bg-slate-900/80 text-white" : "border-slate-200 bg-white/90 text-slate-950";
  const muted = dark ? "text-slate-400" : "text-slate-500";

  return (
    <div className={dark ? "min-h-screen bg-[#070b14] text-white" : "min-h-screen bg-[#f6f8fb] text-slate-950"}>
      <div className="flex min-h-screen">
        <aside className={"sticky top-0 hidden h-screen w-64 shrink-0 border-r p-5 lg:flex lg:flex-col " + (dark ? "border-white/10 bg-[#0b1020]" : "border-slate-200 bg-white")}>
          <Link href="/" className="mb-8 flex items-center gap-3 px-2">
            <span className={"grid h-10 w-10 place-items-center rounded-2xl font-bold " + (dark ? "bg-white text-slate-950" : "bg-slate-950 text-white")}>M</span>
            <span><strong className="block text-sm">My Project</strong><span className={"text-xs " + muted}>Professional workspace</span></span>
          </Link>
          <p className={"px-2 pb-2 text-[10px] font-bold uppercase tracking-[.2em] " + muted}>Workspace</p>
          <nav className="space-y-1">
            {nav.map(item => <Link key={item.href} href={item.href} className={"flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition " + (active(pathname,item.href) ? (dark ? "bg-white text-slate-950" : "bg-slate-950 text-white") : (dark ? "text-slate-300 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"))}><span className="w-5 text-center">{item.icon}</span>{item.label}</Link>)}
          </nav>
          <div className={"mt-auto rounded-2xl border p-4 " + (dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50")}>
            <p className="text-xs font-bold">AI System</p>
            <p className={"mt-1 text-xs leading-5 " + muted}>Manage conversations, knowledge and automation from one workspace.</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className={"sticky top-0 z-40 border-b backdrop-blur-xl " + surface}>
            <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
              <div className="flex items-center gap-3 lg:hidden">
                <span className={"grid h-9 w-9 place-items-center rounded-xl font-bold " + (dark ? "bg-white text-slate-950" : "bg-slate-950 text-white")}>M</span>
                <strong className="text-sm">My Project</strong>
              </div>
              <div className={"hidden max-w-md flex-1 items-center rounded-xl border px-3 py-2 text-sm md:flex " + (dark ? "border-white/10 bg-white/5 " : "border-slate-200 bg-slate-50 ") + muted}>⌕&nbsp; Search workspace</div>
              <div className="ml-auto flex items-center gap-2">
                <button aria-label="Notifications" className={"rounded-xl border px-3 py-2 text-sm " + (dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white")}>◔</button>
                <Link href="/admin/profile" className={"rounded-xl border px-3 py-2 text-sm font-semibold " + (dark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white")}>Profile</Link>
              </div>
            </div>
          </header>
          <div className="pb-24 lg:pb-8">{children}</div>
        </div>
      </div>

      <nav aria-label="Mobile navigation" className={"fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-xl lg:hidden " + (dark ? "border-white/10 bg-slate-950/95" : "border-slate-200 bg-white/95")}>
        <div className="mx-auto flex h-16 max-w-xl items-center justify-around gap-1 px-2 pb-[env(safe-area-inset-bottom)]">
          {nav.slice(0,5).map(item => <Link key={item.href} href={item.href} className={"flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1.5 text-[10px] font-semibold " + (active(pathname,item.href) ? (dark ? "bg-white/10 text-white" : "bg-slate-100 text-slate-950") : muted)}><span className="text-base">{item.icon}</span><span>{item.label}</span></Link>)}
        </div>
      </nav>
    </div>
  );
}
