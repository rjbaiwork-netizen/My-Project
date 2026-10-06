import type { ReactNode } from "react";

export default function SectionShell({ id, title, eyebrow, children, tone = "light", className = "" }: {
  id: string; title: string; eyebrow?: string; children: ReactNode;
  tone?: "light" | "muted" | "dark"; className?: string;
}) {
  const tones = { light: "bg-white text-slate-950", muted: "bg-slate-50 text-slate-950", dark: "bg-slate-950 text-white" };
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`flex min-h-[360px] scroll-mt-20 items-center border-b border-slate-200 py-16 sm:min-h-[420px] lg:min-h-[480px] lg:py-24 ${tones[tone]} ${className}`}>
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-8 lg:px-10">
        {eyebrow && <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</p>}
        <h2 id={`${id}-title`} className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">{title}</h2>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}
