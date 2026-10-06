import type { CMSSection } from "../../lib/api";
import { getText } from "./content";

export default function HeaderSection({ section }: { section: CMSSection }) {
  const tagline = getText(section.content, "tagline", "A clear, consistent digital experience.");
  return <header id="header" className="border-b border-slate-200 bg-white">
    <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-6 px-6 py-5 sm:px-8 lg:px-10">
      <a href="#hero" className="font-bold tracking-tight text-slate-950">{section.title || "My Project"}</a>
      <p className="hidden text-sm text-slate-500 md:block">{tagline}</p>
      <a href="#contact" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Contact</a>
    </div>
  </header>;
}
