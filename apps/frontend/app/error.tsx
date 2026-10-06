"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16"><div role="alert" className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Unexpected error</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Something went wrong.</h1><p className="mt-4 text-slate-600">The page could not be rendered. Please try again.</p><button onClick={() => reset()} className="mt-7 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">Try again</button></div></main>;
}
