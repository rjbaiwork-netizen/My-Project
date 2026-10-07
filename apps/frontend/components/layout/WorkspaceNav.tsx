import Link from "next/link";

const publicLinks = [
  ["About", "#about"],
  ["Services", "#services"],
  ["Portfolio", "#portfolio"],
  ["Pricing", "#pricing"],
  ["Blog", "#blog"],
  ["Contact", "#contact"],
] as const;

export default function WorkspaceNav({ theme = "light" }: { theme?: "light" | "dark" }) {
  const dark = theme === "dark";
  const linkClass = dark
    ? "text-slate-300 hover:text-white"
    : "text-slate-600 hover:text-slate-950";
  return (
    <nav aria-label="Workspace navigation" className="border-b border-slate-200/80 bg-inherit">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-6 py-3 sm:px-8 lg:px-10">
        <Link href="/" className={`rounded-full px-3 py-2 text-sm font-medium ${linkClass}`}>Home</Link>
        {publicLinks.map(([label, href]) => (
          <Link key={href} href={`/${href}`} className={`hidden rounded-full px-3 py-2 text-sm font-medium sm:inline-flex ${linkClass}`}>{label}</Link>
        ))}
        <span className="mx-1 hidden h-5 w-px bg-slate-300 sm:block" aria-hidden="true" />
        <Link href="/admin/system-config" className="rounded-full border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-slate-500 hover:text-slate-950">Admin Control Room</Link>
        <Link href="/project/dashboard" className="rounded-full bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">Project Workspace</Link>
        <Link href="/ai/chat-interface" className="rounded-full border border-slate-900 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100">AI Workspace</Link>
        <details className="relative ml-auto sm:hidden">
          <summary className={`cursor-pointer list-none rounded-full border px-4 py-2 text-sm font-semibold ${dark ? "border-white/20 text-white" : "border-slate-300 text-slate-800"}`}>Menu</summary>
          <div className={`absolute right-0 z-50 mt-2 w-64 rounded-2xl border p-2 shadow-xl ${dark ? "border-white/10 bg-slate-900" : "border-slate-200 bg-white"}`}>
            {publicLinks.map(([label, href]) => (
              <Link key={href} href={`/${href}`} className={`block rounded-xl px-3 py-2 text-sm ${linkClass}`}>{label}</Link>
            ))}
            <Link href="/admin/system-config" className={`block rounded-xl px-3 py-2 text-sm ${linkClass}`}>Admin Control Room</Link>
            <Link href="/project/dashboard" className={`block rounded-xl px-3 py-2 text-sm ${linkClass}`}>Project Workspace</Link>
            <Link href="/ai/chat-interface" className={`block rounded-xl px-3 py-2 text-sm ${linkClass}`}>AI Workspace</Link>
          </div>
        </details>
      </div>
    </nav>
  );
}
