import Link from "next/link";
import type { CMSSection } from "../../lib/api";
import { getText } from "../sections/content";
import WorkspaceNav from "./WorkspaceNav";

export default function Header({ section }: { section: CMSSection }) {
  const tagline = getText(section.content, "tagline", "A clear, consistent digital experience.");
  return (
    <header id="header" className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-6 px-6 py-5 sm:px-8 lg:px-10">
        <Link href="#hero" className="shrink-0 font-bold tracking-tight text-slate-950">{section.title || "My Project"}</Link>
        <p className="hidden text-sm text-slate-500 lg:block">{tagline}</p>
        <Link href="#contact" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">Contact</Link>
      </div>
      <WorkspaceNav />
    </header>
  );
}
