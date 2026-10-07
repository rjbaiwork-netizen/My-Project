import MobileAppShell from "../../../components/layout/MobileAppShell";

export default function ProjectDashboardPage() {
  return (
    <MobileAppShell theme="light">
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">My Project / Project</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Project Dashboard</h1>
        <p className="mt-3 text-slate-600">Dedicated project workspace dashboard.</p>
      </div>
    </main>
    </MobileAppShell>
  );
}
