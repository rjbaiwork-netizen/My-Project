"use client";

import { useEffect, useState } from "react";
import type { CMSSection } from "../../lib/api";

interface SectionEditModalProps {
  section: CMSSection | null;
  saving?: boolean;
  onClose: () => void;
  onSave: (payload: {
    title: string;
    content: Record<string, unknown> | unknown[];
  }) => Promise<void>;
}

export default function SectionEditModal({
  section,
  saving = false,
  onClose,
  onSave
}: SectionEditModalProps) {
  const [title, setTitle] = useState("");
  const [json, setJson] = useState("{}");
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (!section) return;
    setTitle(section.title);
    setJson(JSON.stringify(section.content, null, 2));
    setJsonError(null);
  }, [section]);

  useEffect(() => {
    if (!section) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [section, saving, onClose]);

  if (!section) return null;

  const handleSave = async () => {
    if (!title.trim()) {
      setJsonError("Title is required.");
      return;
    }

    try {
      const parsed: unknown = JSON.parse(json);

      if (
        parsed === null ||
        (typeof parsed !== "object" && !Array.isArray(parsed))
      ) {
        setJsonError("Content must be a JSON object or array.");
        return;
      }

      setJsonError(null);
      await onSave({
        title: title.trim(),
        content: parsed as Record<string, unknown> | unknown[]
      });
    } catch {
      setJsonError("Invalid JSON. Check commas, quotes, brackets, and values.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="section-editor-title"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {section.key}
            </p>
            <h2 id="section-editor-title" className="mt-1 text-lg font-semibold text-slate-950">
              Edit section
            </h2>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
          >
            Close
          </button>
        </header>

        <div className="overflow-y-auto p-6">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Section title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              disabled={saving}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-950 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 disabled:bg-slate-50"
            />
          </label>

          <label className="mt-5 block">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium text-slate-700">JSON content</span>
              <span className="text-xs text-slate-400">JSON object or array</span>
            </div>
            <textarea
              value={json}
              onChange={(event) => {
                setJson(event.target.value);
                setJsonError(null);
              }}
              disabled={saving}
              spellCheck={false}
              className="mt-2 min-h-[360px] w-full resize-y rounded-xl border border-slate-300 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-100 outline-none focus:border-slate-700 focus:ring-2 focus:ring-slate-900/10 disabled:opacity-60"
            />
          </label>

          {jsonError && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {jsonError}
            </p>
          )}
        </div>

        <footer className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </footer>
      </section>
    </div>
  );
}
