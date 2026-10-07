import type { CMSSection } from "../../lib/api";
import SectionShell from "./SectionShell";
import { getItems } from "./content";
export default function Pricing({ section }: { section: CMSSection }) {
 const items=getItems(section.content,"plans",["Starter","Professional","Enterprise"]);
 return <SectionShell id="pricing" title={section.title} eyebrow="Pricing" tone="muted"><div className="grid gap-5 md:grid-cols-3">{items.slice(0,3).map(item=><article key={item} className="min-h-64 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"><h3 className="text-xl font-semibold">{item}</h3><p className="mt-3 text-sm leading-6 text-slate-600">A flexible plan structure ready for CMS-managed pricing content.</p><a href="#contact" className="mt-8 inline-flex rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">Choose plan</a></article>)}</div></SectionShell>;
}