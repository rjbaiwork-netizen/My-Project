import type { CMSSection } from "../../lib/api";
import SectionShell from "./SectionShell";
import { getItems } from "./content";
export default function Blog({ section }: { section: CMSSection }) {
 const posts=getItems(section.content,"posts",["Latest update","Product insights","Behind the scenes"]);
 return <SectionShell id="blog" title={section.title} eyebrow="Blog" tone="muted"><div className="grid gap-5 md:grid-cols-3">{posts.slice(0,6).map(post=><article key={post} className="min-h-48 rounded-2xl border border-slate-200 bg-white p-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Article</p><h3 className="mt-5 text-lg font-semibold">{post}</h3><p className="mt-3 text-sm leading-6 text-slate-600">A concise content preview managed from the CMS.</p></article>)}</div></SectionShell>;
}