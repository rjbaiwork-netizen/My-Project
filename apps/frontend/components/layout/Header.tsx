"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CMSSection } from "../../lib/api";
import { getText } from "../sections/content";

const publicLinks = [
  ["Home", "#hero"],
  ["About", "#about"],
  ["Services", "#services"],
  ["Portfolio", "#portfolio"],
  ["Pricing", "#pricing"],
  ["Blog", "#blog"],
  ["Contact", "#contact"],
] as const;

const workspaceGroups = [
  {
    title: "Admin Workspace",
    description: "CMS and system controls",
    links: [
      ["Admin Dashboard", "/admin/dashboard"],
      ["Admin Profile", "/admin/profile"],
      ["Admin Settings", "/admin/settings"],
      ["System Configuration", "/admin/system-config"],
    ],
  },
  {
    title: "Project Workspace",
    description: "Project operations",
    links: [
      ["Project Dashboard", "/project/dashboard"],
      ["Project Profile", "/project/profile"],
      ["Project Settings", "/project/settings"],
    ],
  },
  {
    title: "AI Workspace",
    description: "AI tools and bots",
    links: [
      ["AI Chat Interface", "/ai/chat-interface"],
      ["AI Bot", "/ai/ai-bot"],
    ],
  },
] as const;

function Icon({ name }: { name: "search" | "globe" | "menu" | "chevron" | "workspace" }) {
  if (name === "search") return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
  if (name === "globe") return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16" /></svg>;
  if (name === "chevron") return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 9 6 6 6-6" /></svg>;
  if (name === "workspace") return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></svg>;
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M4 12h16M4 17h16" /></svg>;
}

export default function Header({ section }: { section: CMSSection }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [language, setLanguage] = useState("EN");
  const [query, setQuery] = useState("");

  const tagline = getText(section.content, "tagline", "A clear, consistent digital experience.");
  const results = useMemo(
    () => publicLinks.filter(([label]) => label.toLowerCase().includes(query.trim().toLowerCase())),
    [query],
  );

  return (
    <header id="header" className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-[0_1px_12px_rgba(15,23,42,0.05)] backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[72px] items-center gap-4 lg:gap-6">
          <Link href="#hero" onClick={() => setMenuOpen(false)} className="flex min-w-0 shrink-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-950 text-sm font-bold text-white">
              {(section.title || "M").trim().slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-44 truncate text-sm font-bold tracking-tight text-slate-950">{section.title || "My Project"}</span>
              <span className="block max-w-52 truncate text-xs text-slate-500">{tagline}</span>
            </span>
          </Link>

          <nav aria-label="Primary navigation" className="hidden xl:flex items-center gap-0.5">
            {publicLinks.map(([label, href]) => (
              <Link key={href} href={href} className="rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950">{label}</Link>
            ))}
          </nav>

          <div className="relative ml-auto hidden max-w-md flex-1 md:block">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="search" /></span>
            <input aria-label="Search sections" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sections..." className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100" />
            {query.trim() && (
              <div className="absolute left-0 right-0 top-12 z-50 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                {results.length ? results.map(([label, href]) => (
                  <Link key={href} href={href} onClick={() => setQuery("")} className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">{label}</Link>
                )) : <p className="px-3 py-2 text-sm text-slate-500">No matching section.</p>}
              </div>
            )}
          </div>

          <div className="relative hidden sm:block">
            <button type="button" onClick={() => setLanguageOpen((value) => !value)} aria-expanded={languageOpen} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
              <Icon name="globe" />{language}<Icon name="chevron" />
            </button>
            {languageOpen && (
              <div className="absolute right-0 top-12 z-50 w-32 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                {["EN", "BN"].map((option) => (
                  <button key={option} type="button" onClick={() => { setLanguage(option); setLanguageOpen(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100">
                    {option === "EN" ? "English" : "বাংলা"}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-controls="workspace-menu" className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200">
              <Icon name="menu" /><span>Menu</span><Icon name="chevron" />
            </button>
            {menuOpen && (
              <div id="workspace-menu" className="absolute right-0 top-12 z-[60] w-[min(92vw,430px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
                <div className="border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace menu</p>
                  <p className="mt-1 text-sm text-slate-600">All management workspaces in one place.</p>
                </div>
                <div className="max-h-[min(70vh,560px)] overflow-y-auto p-3">
                  <div className="mb-3 grid grid-cols-2 gap-2 xl:hidden">
                    {publicLinks.map(([label, href]) => (
                      <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">{label}</Link>
                    ))}
                  </div>
                  {workspaceGroups.map((group) => (
                    <section key={group.title} className="mb-3 last:mb-0">
                      <div className="flex items-center gap-2 px-2 pb-1.5">
                        <span className="text-slate-400"><Icon name="workspace" /></span>
                        <div>
                          <h2 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{group.title}</h2>
                          <p className="text-xs text-slate-400">{group.description}</p>
                        </div>
                      </div>
                      <div className="grid gap-1 sm:grid-cols-2">
                        {group.links.map(([label, href]) => (
                          <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950">
                            {label}
                          </Link>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-slate-100 py-2.5 md:hidden">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Icon name="search" /></span>
            <input aria-label="Search sections" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search sections..." className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-slate-400 focus:bg-white" />
          </div>
          <button type="button" onClick={() => setLanguageOpen((value) => !value)} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-700"><Icon name="globe" />{language}</button>
        </div>
      </div>
    </header>
  );
}
