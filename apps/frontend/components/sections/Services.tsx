import type { CMSSection } from "../../lib/api";
import SectionShell from "./SectionShell";
import { getItems } from "./content";
export default function Services({ section }: { section: CMSSection }) {
 const items=getItems(section.content,"items",["Strategy","Design","Development"]);
 return <SectionShell id="services" title={section.title} eyebrow="Services" tone="muted"><div className="grid gap-5 md:grid-cols-3">{items.slice(0,6).map(item=><article key={item} className="min-h-36 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-lg font-semibold">{item}</h3><p className="mt-3 text-sm leading-6 text-slate-600">A focused capability delivered through a clear, reliable workflow.</p></article>)}</div></SectionShell>;
}