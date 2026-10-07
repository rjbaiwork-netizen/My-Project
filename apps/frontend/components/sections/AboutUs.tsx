import type { CMSSection } from "../../lib/api";
import SectionShell from "./SectionShell";
import { getText } from "./content";
export default function AboutUs({ section }: { section: CMSSection }) {
  return <SectionShell id="about" title={section.title} eyebrow="About">
    <p className="max-w-3xl text-lg leading-8 text-slate-600">{getText(section.content, "description", "Tell your story clearly and give visitors the context they need to understand your work.")}</p>
  </SectionShell>;
}