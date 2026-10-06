import { sectionApi, type CMSSection, type SectionKey } from "../lib/api";
import SectionRenderer from "../components/sections/SectionRenderer";

const CANONICAL_ORDER: SectionKey[] = [
  "HEADER", "HERO", "ABOUT", "SERVICES", "PORTFOLIO",
  "PRICING", "TESTIMONIALS", "BLOG", "CONTACT", "FOOTER"
];

function sortSections(sections: CMSSection[]): CMSSection[] {
  const rank = new Map(CANONICAL_ORDER.map((key, index) => [key, index]));
  return sections
    .filter(section => section.isVisible && rank.has(section.key))
    .sort((a, b) => (rank.get(a.key)! - rank.get(b.key)!) || a.order - b.order);
}

export default async function HomePage() {
  let sections: CMSSection[] = [];
  let errorMessage: string | null = null;

  try {
    sections = sortSections(await sectionApi.getPublicSections());
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "The public content service is unavailable.";
  }

  if (errorMessage) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <div role="alert" className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Temporarily unavailable</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">We couldn’t load the page content.</h1>
        <p className="mt-4 text-slate-600">Please try again shortly. The CMS is currently unavailable.</p>
        <a href="/" className="mt-7 inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Retry</a>
      </div>
    </main>;
  }

  if (sections.length === 0) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">No published content</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">This site is being prepared.</h1>
        <p className="mt-4 text-slate-600">No visible CMS sections are currently published.</p>
      </div>
    </main>;
  }

  return <main className="min-h-screen overflow-x-clip bg-white">{sections.map(section => <SectionRenderer key={section.id} section={section} />)}</main>;
}
