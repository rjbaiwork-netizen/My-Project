import type { CMSSection } from "../../lib/api";
import SectionShell from "./SectionShell";
import { getText } from "./content";

export default function HeroSection({ section }: { section: CMSSection }) {
  return <SectionShell id="hero" title={section.title} eyebrow="Welcome" className="bg-gradient-to-b from-white to-slate-50">
    <div className="max-w-3xl">
      <p className="text-lg leading-8 text-slate-600 sm:text-xl">{getText(section.content, "description", "A production-ready dynamic experience powered by your CMS.")}</p>
      <a href="#about" className="mt-8 inline-flex rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">{getText(section.content, "cta", "Explore")}</a>
    </div>
  </SectionShell>;
}
