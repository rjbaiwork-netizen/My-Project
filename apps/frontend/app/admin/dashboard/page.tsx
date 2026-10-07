import MobileAppShell from "../../../components/layout/MobileAppShell";

const stats = [
  ["10", "CMS Sections", "Website content"],
  ["8", "Visible", "Currently published"],
  ["4", "AI Agents", "Ready to work"],
];

export default function AdminDashboardPage() {
  return (
    <MobileAppShell theme="light">
      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-600">Management Dashboard</p>
          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Welcome back</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Manage your website content and connected AI tools from one professional workspace.</p></div>
            <a href="/admin/system-config" className="inline-flex w-fit rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">Manage content</a>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {stats.map(([value,title,desc]) => <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-3xl font-bold">{value}</p><p className="mt-2 text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-slate-500">{desc}</p></div>)}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_.8fr]">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">Quick actions</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><a href="/admin/system-config" className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50"><b className="text-sm">Website content</b><p className="mt-1 text-xs text-slate-500">Edit, publish or hide sections.</p></a><a href="/aisystem/chat-interface" className="rounded-xl border border-slate-200 p-4 hover:bg-slate-50"><b className="text-sm">Open AI Chat</b><p className="mt-1 text-xs text-slate-500">Start a conversation with your assistant.</p></a></div></section>
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">System status</h2><div className="mt-4 space-y-3">{["Website","AI System","Content Management"].map(x=><div key={x} className="flex items-center justify-between text-sm"><span className="text-slate-600">{x}</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Ready</span></div>)}</div></section>
          </div>
        </div>
      </main>
    </MobileAppShell>
  );
}
