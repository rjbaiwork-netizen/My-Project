export const metadata = {
  title: "Project Documents | My-Project",
  description: "Download the Bengali My-Project full blueprint and audit report.",
};

export default function DocumentsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="text-sm font-medium text-blue-700 underline underline-offset-4">
          ← মূল ওয়েবসাইটে ফিরে যান
        </a>

        <header className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            My-Project · Documents
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            প্রজেক্ট ডকুমেন্টস
          </h1>
          <p className="mt-4 leading-7 text-slate-600">
            এখানে My-Project-এর বাংলা Full Blueprint ও Live Audit Report পড়তে এবং ডাউনলোড করতে পারবেন।
          </p>
        </header>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-blue-50 p-3 text-2xl" aria-hidden="true">📄</div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold">My-Project — Full Blueprint ও Live Audit Report</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                বাংলা Markdown ডকুমেন্ট · Architecture, CMS, Admin/Security, AI, Automation,
                পূর্বের audit metrics, roadmap এবং সম্ভাব্য monetization।
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a
                  href="/docs/my-project-full-blueprint-bn.md"
                  download="My-Project-Full-Blueprint-Live-Audit-BN.md"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-center font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  ডাউনলোড করুন
                </a>
                <a
                  href="/docs/my-project-full-blueprint-bn.md"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-center font-semibold text-slate-800 hover:bg-slate-50"
                >
                  ব্রাউজারে পড়ুন
                </a>
              </div>
              <p className="mt-4 text-xs leading-5 text-slate-500">
                নোট: ফাইলটি Markdown (.md) ফরম্যাটে। Microsoft Word বা Google Docs-এ নিতে ফাইলটি খুলে
                লেখা কপি/ইমপোর্ট করতে পারবেন। রিপোর্টে থাকা metrics পূর্বের audit snapshot; তা বর্তমান live metrics নয়।
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
