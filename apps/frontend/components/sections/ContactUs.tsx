import type { CMSSection } from "../../lib/api";
import SectionShell from "./SectionShell";
import { getText } from "./content";
export default function ContactUs({ section }: { section: CMSSection }) {
 const email=getText(section.content,"email","hello@example.com");
 return <SectionShell id="contact" title={section.title} eyebrow="Contact"><div className="max-w-3xl rounded-3xl bg-slate-950 p-8 text-white sm:p-10"><p className="text-lg leading-8 text-slate-300">{getText(section.content,"description","Have a question or want to start a conversation? Reach out through your preferred channel.")}</p><a href={"mailto:"+email} className="mt-7 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-200">{email}</a></div></SectionShell>;
}