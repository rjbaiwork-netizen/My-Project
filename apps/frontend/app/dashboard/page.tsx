import Link from "next/link";

const modules = [
  ["AI Chat","Conversations and assistance","/aisystem/chat-interface"],
  ["Knowledge Base","Documents and knowledge","/aisystem/knowledge-base"],
  ["AI Agents","Specialized AI workers","/aisystem/agent-dashboard"],
  ["Automation","Rules and workflows","/aisystem/automation"],
  ["Tasks","AI tasks and activity","/aisystem/jobs"],
  ["Monitoring","System activity","/aisystem/monitoring"],
];

export default function Dashboard() {
  return <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
    <div className="mb-8"><p className="text-sm font-semibold text-blue-600">Application Workspace</p><h1 className="mt-2 text-3xl font-bold tracking-tight">Dashboard</h1><p className="mt-2 text-slate-500">Manage your website, AI system and daily work from one place.</p></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{modules.map(([title,desc,href]) =>
      <Link href={href} key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <h2 className="text-lg font-bold">{title}</h2><p className="mt-2 text-sm text-slate-500">{desc}</p><span className="mt-6 inline-block text-sm font-semibold text-blue-600">Open workspace →</span>
      </Link>)}</div>
  </main>;
}
