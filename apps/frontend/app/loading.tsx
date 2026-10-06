export default function Loading() {
  return <main aria-busy="true" aria-label="Loading page" className="min-h-screen bg-white">
    <div className="mx-auto max-w-7xl animate-pulse px-6 py-6 sm:px-8 lg:px-10"><div className="h-10 w-40 rounded-lg bg-slate-200" /></div>
    <div className="min-h-[420px] bg-slate-50"><div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10"><div className="h-5 w-24 rounded bg-slate-200" /><div className="mt-5 h-14 max-w-2xl rounded bg-slate-200" /><div className="mt-5 h-6 max-w-xl rounded bg-slate-200" /></div></div>
    {[1,2,3].map(i => <div key={i} className="min-h-[360px] border-b border-slate-200 bg-white"><div className="mx-auto max-w-7xl animate-pulse px-6 py-20 sm:px-8 lg:px-10"><div className="h-5 w-24 rounded bg-slate-200" /><div className="mt-5 h-10 w-72 rounded bg-slate-200" /><div className="mt-8 h-24 max-w-3xl rounded bg-slate-100" /></div></div>)}
  </main>;
}
