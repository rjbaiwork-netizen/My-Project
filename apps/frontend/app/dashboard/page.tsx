"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menu = [
  { label: "Overview", href: "/dashboard" },
  { label: "Website", href: "/" },
  { label: "Content", href: "/admin/system-config" },
  { label: "AI Chat", href: "/aisystem/chat-interface" },
  { label: "Knowledge Base", href: "/aisystem/knowledge-base" },
  { label: "AI Agents", href: "/aisystem/agent-dashboard" },
  { label: "Automation", href: "/aisystem/automation" },
  { label: "Tasks", href: "/aisystem/jobs" },
  { label: "Approvals", href: "/aisystem/approvals" },
  { label: "Monitoring", href: "/aisystem/monitoring" },
];

const quickActions = [
  ["AI Chat", "Start a conversation", "/aisystem/chat-interface"],
  ["Add Knowledge", "Open your knowledge base", "/aisystem/knowledge-base"],
  ["Run AI Agent", "Choose an AI agent", "/aisystem/agent-dashboard"],
  ["Create Task", "Open task management", "/aisystem/jobs"],
  ["Create Automation", "Build a workflow", "/aisystem/automation"],
  ["Manage Content", "Update website content", "/admin/system-config"],
];

const activity = [
  ["AI System", "Your AI workspace is ready to use.", "/aisystem/chat-interface"],
  ["Knowledge Base", "Add documents and build your knowledge library.", "/aisystem/knowledge-base"],
  ["Website", "Manage the published website sections.", "/admin/system-config"],
];

export default function Dashboard() {
  const pathname = usePathname();

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-600">Application Workspace</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-500">
              Manage your website, AI system and daily work from one place.
            </p>
          </div>
          <Link href="/aisystem/chat-interface" className="rounded-xl bg-slate-950 px-4 py-2.5 text-center text-sm font-semibold text-white">
            Open AI Chat
          </Link>
        </div>
      </div>

      <section className="mb-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex min-w-max gap-1">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={"rounded-xl px-4 py-2.5 text-sm font-semibold " + (pathname === item.href ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100")}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Website", "Content and settings", "/admin/system-config"],
          ["AI System", "Chat, agents and automation", "/aisystem/chat-interface"],
          ["Knowledge", "Documents and memory", "/aisystem/knowledge-base"],
          ["Work", "Tasks and approvals", "/aisystem/jobs"],
        ].map(([title, desc, href]) => (
          <Link key={title} href={href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md">
            <p className="text-lg font-bold">{title}</p>
            <p className="mt-2 text-sm text-slate-500">{desc}</p>
          </Link>
        ))}
      </section>

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold">Quick Actions</h2>
          <p className="mt-1 text-sm text-slate-500">Common actions are available directly from your dashboard.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map(([title, desc, href]) => (
            <Link key={title} href={href} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-300 hover:shadow-md">
              <p className="font-bold">{title}</p>
              <p className="mt-1 text-sm text-slate-500">{desc}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-blue-600">Open →</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Recent Activity</h2>
          <div className="mt-4 space-y-3">
            {activity.map(([title, desc, href]) => (
              <Link key={title} href={href} className="block rounded-xl border border-slate-100 p-4 hover:bg-slate-50">
                <p className="font-semibold">{title}</p>
                <p className="mt-1 text-sm text-slate-500">{desc}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Workspace</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Link href="/admin/profile" className="block rounded-xl border border-slate-100 p-4 font-semibold hover:bg-slate-50">Profile →</Link>
            <Link href="/admin/settings" className="block rounded-xl border border-slate-100 p-4 font-semibold hover:bg-slate-50">Settings →</Link>
            <Link href="/" className="block rounded-xl border border-slate-100 p-4 font-semibold hover:bg-slate-50">View Website →</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
