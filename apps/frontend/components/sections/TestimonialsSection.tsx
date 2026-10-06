import type { CMSSection } from "../../lib/api";
import SectionShell from "./SectionShell";
import { getText } from "./content";

export default function TestimonialsSection({ section }: { section: CMSSection }) {
  return <SectionShell id="testimonials" title={section.title} eyebrow="Testimonials"><figure className="max-w-4xl rounded-3xl border border-slate-200 bg-slate-50 p-8 sm:p-10"><blockquote className="text-2xl font-medium leading-10 tracking-tight text-slate-800">“{getText(section.content, "quote", "A dependable foundation for a polished, content-driven experience.")}”</blockquote><figcaption className="mt-6 text-sm font-semibold text-slate-500">— {getText(section.content, "author", "Your customer")}</figcaption></figure></SectionShell>;
}
