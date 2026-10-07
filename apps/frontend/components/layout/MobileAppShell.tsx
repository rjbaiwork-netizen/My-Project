"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function Icon({name}:{name:"back"|"home"}) {
  if(name==="back") return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m15 18-6-6 6-6M9 12h11"/></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m4 10 8-6 8 6v9H4z"/><path d="M9 19v-5h6v5"/></svg>;
}

export default function MobileAppShell({children,theme="light"}:{children:ReactNode;theme?:"light"|"dark"}) {
  const pathname=usePathname();
  const dark=theme==="dark";
  return (
    <div className={dark?"min-h-screen bg-slate-950 text-white":"min-h-screen bg-slate-50 text-slate-950"}>
      <div className="pb-20">{children}</div>
      <nav aria-label="Quick navigation" className={"fixed inset-x-0 bottom-0 z-[90] border-t backdrop-blur-xl "+(dark?"border-white/10 bg-slate-950/95":"border-slate-200 bg-white/95")}>
        <div className="mx-auto flex h-16 max-w-xl items-center justify-between gap-1 px-2 pb-[env(safe-area-inset-bottom)]">
          <Link href="/" className={"flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold "+(dark?"text-slate-300 hover:bg-white/10":"text-slate-600 hover:bg-slate-100")}><Icon name="home"/><span>Home</span></Link>
          <Link href="/admin/dashboard" className={"flex min-w-0 flex-1 items-center justify-center rounded-xl py-2 text-xs font-semibold "+(dark?"text-slate-300 hover:bg-white/10":"text-slate-600 hover:bg-slate-100")}>Admin</Link>
          <Link href="/project/dashboard" className={"flex min-w-0 flex-1 items-center justify-center rounded-xl py-2 text-xs font-semibold "+(dark?"text-slate-300 hover:bg-white/10":"text-slate-600 hover:bg-slate-100")}>Project</Link>
          <Link href="/aisystem/chat-interface" className={"flex min-w-0 flex-1 items-center justify-center rounded-xl py-2 text-xs font-semibold "+(dark?"text-slate-300 hover:bg-white/10":"text-slate-600 hover:bg-slate-100")}>AI System</Link>
          <Link href="/" className={"flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold "+(dark?"text-slate-300 hover:bg-white/10":"text-slate-600 hover:bg-slate-100")}><Icon name="back"/><span>Back</span></Link>
        </div>
      </nav>
    </div>
  );
}
