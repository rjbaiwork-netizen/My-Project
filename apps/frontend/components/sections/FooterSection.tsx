import type { CMSSection } from "../../lib/api";
import SectionShell from "./SectionShell";
import { getText } from "./content";

export default function FooterSection({ section }: { section: CMSSection }) {
  return <SectionShell id="footer" title={section.title} eyebrow="Footer" tone="dark" className="min-h-64"><div className="flex flex-col justify-between gap-6 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row"><p>{getText(section.content, "copyright", "© My Project. All rights reserved.")}</p><a href="#header" className="font-semibold text-white hover:text-slate-300">Back to top ↑</a></div></SectionShell>;
}
