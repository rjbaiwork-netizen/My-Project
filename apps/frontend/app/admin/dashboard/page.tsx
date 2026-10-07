import MobileAppShell from "../../../components/layout/MobileAppShell";

export default function AdminDashboardPage() {
import MobileAppShell from "../../../components/layout/MobileAppShell";
  return (
    <MobileAppShell theme="light">
      <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">My Project / Admin</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="mt-3 max-w-2xl text-slate-600">Central administration workspace for the CMS and system controls.</p>
      </div>
    </main>
    </MobileAppShell>
  );
}
