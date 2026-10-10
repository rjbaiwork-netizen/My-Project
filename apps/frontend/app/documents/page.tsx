import { projectDocuments } from "../../lib/project-documents";

export const metadata = {
  title: "প্রজেক্ট ডকুমেন্টস | My-Project",
  description: "প্রজেক্টের রিপোর্ট ও ডকুমেন্ট দেখুন এবং পছন্দের ফরম্যাটে ডাউনলোড করুন।",
};

const formatLabels = {
  md: { label: "Markdown (.md)", description: "মূল editable source" },
  txt: { label: "Text (.txt)", description: "সাধারণ টেক্সট ফাইল" },
  html: { label: "HTML (.html)", description: "ব্রাউজারে খোলা যায় এমন ফাইল" },
} as const;

export default function DocumentsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <a href="/" className="text-sm font-medium text-blue-700 underline underline-offset-4">
          ← মূল ওয়েবসাইটে ফিরে যান
        </a>

        <header className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            My-Project · Document Library
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            ডকুমেন্ট লাইব্রেরি
          </h1>
          <p className="mt-4 max-w-2xl leading-7 text-slate-600">
            এখানে প্রকল্পের রিপোর্ট, ব্লুপ্রিন্ট ও অন্যান্য ডকুমেন্ট তালিকাভুক্ত থাকবে।
            প্রতিটি ডকুমেন্টের পাশে নিজের প্রয়োজনমতো ফাইল ফরম্যাট বেছে ডাউনলোড করুন।
          </p>
          <p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm leading-6 text-blue-900">
            নতুন ডকুমেন্ট যুক্ত করার নিয়ম: GitHub-এর <code>apps/frontend/public/docs/</code>
            ফোল্ডারে ফাইল যোগ করুন, এরপর <code>apps/frontend/lib/project-documents.ts</code>
            তালিকায় তার নাম, বিবরণ ও উপলভ্য ফরম্যাট যুক্ত করুন। Deploy হলে সেটি এই পেজে দেখা যাবে।
          </p>
        </header>

        <section className="mt-6 space-y-5">
          {projectDocuments.map((document) => (
            <article key={document.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-blue-50 p-3 text-2xl" aria-hidden="true">📄</div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{document.category}</p>
                  <h2 className="mt-1 text-xl font-semibold">{document.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{document.description}</p>

                  <h3 className="mt-5 text-sm font-semibold text-slate-800">ডাউনলোড ফরম্যাট বেছে নিন</h3>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {document.formats.map((format) => (
                      <a
                        key={format}
                        href={`/api/documents/${document.id}/download?format=${format}`}
                        className="group rounded-xl border border-slate-200 p-4 transition hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <span className="flex items-center justify-between gap-2 font-semibold text-slate-900">
                          {formatLabels[format].label}
                          <span aria-hidden="true" className="text-blue-700">↓</span>
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">{formatLabels[format].description}</span>
                        <span className="mt-3 inline-block text-sm font-semibold text-blue-700">ডাউনলোড করুন</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        <footer className="mt-6 rounded-2xl border border-dashed border-slate-300 p-5 text-sm leading-6 text-slate-600">
          <strong className="text-slate-800">নোট:</strong> বর্তমানে Markdown, TXT এবং HTML ডাউনলোড সমর্থিত।
          Word (.docx) ও PDF-এর জন্য সঠিক ফাইল জেনারেশন যোগ করা হলে সেগুলোও আলাদা অপশন হিসেবে দেখানো যাবে;
          ভুল এক্সটেনশন দিয়ে কোনো ফাইলকে Word বা PDF বলা হচ্ছে না।
        </footer>
      </div>
    </main>
  );
}
