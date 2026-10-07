"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const groups = [
  {title:"Website",items:[["/","Home"],["/admin/system-config","Content"],["/admin/settings","Settings"]]},
  {title:"Dashboard",items:[["/dashboard","Overview"]]},
  {title:"AI System",items:[
    ["/aisystem/chat-interface","AI Chat"],["/aisystem/website-assistant","Website Assistant"],
    ["/aisystem/knowledge-base","Knowledge Base"],["/aisystem/memory","AI Memory"],
    ["/aisystem/agent-dashboard","AI Agents"],["/aisystem/automation","Automation"],
    ["/aisystem/jobs","Tasks"],["/aisystem/approvals","Approvals"],["/aisystem/monitoring","Monitoring"]
  ]}
];

function isActive(pathname:string,href:string){return href==="/" ? pathname==="/" : pathname.startsWith(href);}

export default function MobileAppShell({children,theme="light"}:{children:ReactNode;theme?:"light"|"dark"}) {
 const pathname=usePathname(); const dark=theme==="dark";
 return <div className={dark?"min-h-screen bg-[#070b14] text-white":"min-h-screen bg-[#f6f8fb] text-slate-950"}>
  <div className="flex min-h-screen">
   <aside className={"sticky top-0 hidden h-screen w-72 shrink-0 border-r p-5 lg:flex lg:flex-col "+(dark?"border-white/10 bg-[#0b1020]":"border-slate-200 bg-white")}>
    <Link href="/" className="mb-8 flex items-center gap-3 px-2"><span className={"grid h-10 w-10 place-items-center rounded-2xl font-bold "+(dark?"bg-white text-slate-950":"bg-slate-950 text-white")}>M</span><span><strong className="block text-sm">My Project</strong><span className="text-xs text-slate-500">Application Workspace</span></span></Link>
    <nav className="space-y-6 overflow-y-auto">{groups.map(g=><div key={g.title}><p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[.2em] text-slate-500">{g.title}</p><div className="space-y-1">{g.items.map(([href,label])=><Link key={href} href={href} className={"block rounded-xl px-3 py-2.5 text-sm font-semibold "+(isActive(pathname,href)?(dark?"bg-white text-slate-950":"bg-slate-950 text-white"):(dark?"text-slate-300 hover:bg-white/10":"text-slate-600 hover:bg-slate-100"))}>{label}</Link>)}</div></div>)}</nav>
   </aside>
   <div className="min-w-0 flex-1"><header className={"sticky top-0 z-40 border-b backdrop-blur-xl "+(dark?"border-white/10 bg-slate-900/80":"border-slate-200 bg-white/90")}><div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6"><strong className="text-sm lg:hidden">My Project</strong><div className="hidden max-w-md flex-1 rounded-xl border px-3 py-2 text-sm text-slate-500 md:block">⌕ Search workspace</div><Link href="/admin/profile" className="rounded-xl border px-3 py-2 text-sm font-semibold">Profile</Link></div></header><div className="pb-24 lg:pb-8">{children}</div></div>
  </div>
  <nav className={"fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-xl lg:hidden "+(dark?"border-white/10 bg-slate-950/95":"border-slate-200 bg-white/95")}><div className="mx-auto flex h-16 max-w-xl items-center justify-around px-2">{[["/","Home"],["/dashboard","Dashboard"],["/aisystem/chat-interface","AI Chat"],["/aisystem/agent-dashboard","AI Agents"],["/aisystem/knowledge-base","Knowledge"]].map(([href,label])=><Link key={href} href={href} className={"flex flex-1 justify-center py-4 text-xs font-semibold "+(isActive(pathname,href)?"text-slate-950":"text-slate-500")}>{label}</Link>)}</div></nav>
 </div>;
}