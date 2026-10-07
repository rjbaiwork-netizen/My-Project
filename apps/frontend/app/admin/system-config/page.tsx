"use client";
import MobileAppShell from "../../../components/layout/MobileAppShell";

import { useCallback, useEffect, useMemo, useState } from "react";
import SectionEditModal from "../../../components/admin/SectionEditModal";
import SectionStatusBadge from "../../../components/admin/SectionStatusBadge";
import VisibilityToggle from "../../../components/admin/VisibilityToggle";
import { sectionApi, type CMSSection, type SectionKey } from "../../../lib/api";
import type { JsonValue } from "@my-project/shared";

const CANONICAL_ORDER: SectionKey[] = [
  "HEADER", "HERO", "ABOUT", "SERVICES", "PORTFOLIO",
  "PRICING", "TESTIMONIALS", "BLOG", "CONTACT", "FOOTER"
];

function sortSections(sections: CMSSection[]): CMSSection[] {
  const order = new Map(CANONICAL_ORDER.map((key, index) => [key, index]));
  return [...sections].sort(
    (a, b) =>
      (order.get(a.key) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(b.key) ?? Number.MAX_SAFE_INTEGER) ||
      a.order - b.order
  );
}

export default function AdminSystemConfigPage() {
  const [sections, setSections] = useState<CMSSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<CMSSection | null>(null);

  const loadSections = useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      setSections(sortSections(await sectionApi.getAdminSections()));
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "Unable to load sections.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadSections(); }, [loadSections]);

  const activeCount = useMemo(
    () => sections.filter((section) => section.isVisible).length,
    [sections]
  );

  const handleVisibilityChange = async (section: CMSSection, nextValue: boolean) => {
    const previous = sections;
    setSavingId(section.id);
    setPageError(null);
    setSections((current) =>
      current.map((item) => item.id === section.id ? { ...item, isVisible: nextValue } : item)
    );
    try {
      const updated = await sectionApi.setSectionVisibility(section.id, nextValue);
      setSections((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (error) {
      setSections(previous);
      setPageError(error instanceof Error ? error.message : "Unable to update visibility.");
    } finally {
      setSavingId(null);
    }
  };

  const handleSave = async (payload: {
    title: string;
    content: JsonValue;
  }) => {
    if (!editingSection) return;
    const previous = sections;
    setSavingId(editingSection.id);
    setSections((current) =>
      current.map((item) => item.id === editingSection.id
        ? { ...item, title: payload.title, content: payload.content }
        : item)
    );
    setEditingSection(null);
    try {
      const updated = await sectionApi.updateSection(editingSection.id, payload);
      setSections((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (error) {
      setSections(previous);
      setPageError(error instanceof Error ? error.message : "Unable to save section.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <MobileAppShell theme="light">
      <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">My Project / Admin</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">System Configuration</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Manage the visibility and JSON content of every canonical CMS section.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Published sections</p>
            <p className="mt-1 text-2xl font-bold">{activeCount}<span className="ml-1 text-sm font-medium text-slate-400">/ 10</span></p>
          </div>
        </header>

        {pageError && (
          <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{pageError}</span>
            <button type="button" onClick={() => void loadSections()} className="shrink-0 rounded-lg bg-white px-3 py-1.5 font-semibold text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-100">Retry</button>
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[minmax(0,1fr)_120px_110px_100px] gap-4 border-b border-slate-200 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Section</span><span>Status</span><span>Visibility</span><span className="text-right">Action</span>
          </div>

          {loading ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="grid animate-pulse gap-4 px-6 py-5 md:grid-cols-[minmax(0,1fr)_120px_110px_100px]">
                  <div className="space-y-2"><div className="h-3 w-20 rounded bg-slate-200" /><div className="h-5 w-48 rounded bg-slate-200" /></div>
                  <div className="h-6 w-16 rounded-full bg-slate-200" /><div className="h-7 w-12 rounded-full bg-slate-200" /><div className="ml-auto h-9 w-16 rounded-lg bg-slate-200" />
                </div>
              ))}
            </div>
          ) : sections.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="font-semibold text-slate-900">No CMS sections found.</p>
              <p className="mt-1 text-sm text-slate-500">Run the Prisma migration and seed before using the admin dashboard.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {sections.map((section, index) => (
                <article key={section.id} className="grid gap-4 px-6 py-5 md:grid-cols-[minmax(0,1fr)_120px_110px_100px] md:items-center">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="w-7 text-xs font-semibold text-slate-400">{String(index + 1).padStart(2, "0")}</span>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{section.key}</p>
                        <h2 className="mt-1 truncate text-sm font-semibold text-slate-950">{section.title}</h2>
                      </div>
                    </div>
                  </div>
                  <div><span className="mr-2 text-xs text-slate-400 md:hidden">Status</span><SectionStatusBadge isVisible={section.isVisible} /></div>
                  <div className="flex items-center gap-3"><span className="text-xs text-slate-400 md:hidden">Visibility</span><VisibilityToggle checked={section.isVisible} disabled={savingId === section.id} onChange={(value) => void handleVisibilityChange(section, value)} /></div>
                  <div className="text-left md:text-right"><button type="button" disabled={savingId === section.id} onClick={() => setEditingSection(section)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Edit JSON</button></div>
                </article>
              ))}
            </div>
          )}
        </section>

        <p className="mt-4 text-xs leading-5 text-slate-500">Changes are applied optimistically and automatically rolled back if the backend request fails.</p>
      </div>
      <SectionEditModal section={editingSection} saving={savingId === editingSection?.id} onClose={() => { if (!savingId) setEditingSection(null); }} onSave={handleSave} />
    </main>
    </MobileAppShell>
  );
}
