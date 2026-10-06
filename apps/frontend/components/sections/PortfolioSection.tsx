import type { CMSSection } from "../../lib/api";
import SectionShell from "./SectionShell";
import { getItems } from "./content";

export default function PortfolioSection({ section }: { section: CMSSection }) {
  const items = getItems(section.content, "items", ["Featured project", "Product experience", "Digital platform"]);
  return <SectionShell id="portfolio" title={section.title} eyebrow="Portfolio"><div className="grid gap-5 md:grid-cols-3">
    {items.slice(0, 6).map((item, i) => <article key={item} className="min-h-52 rounded-2xl border border-slate-200 bg-slate-50 p-6"><span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">0{i + 1}</span><h3 className="mt-10 text-xl font-semibold">{item}</h3></article>)}
  </div></SectionShell>;
}
