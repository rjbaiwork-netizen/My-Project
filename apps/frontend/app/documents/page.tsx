import { projectDocuments } from "../../lib/project-documents";

export const metadata = {
  title: "প্রজেক্ট ডকুমেন্টস | My-Project",
  description: "প্রজেক্টের রিপোর্ট ও ডকুমেন্ট পছন্দের ফরম্যাটে ডাউনলোড করুন।",
};

const formatLabels = {
  md: { label: "Markdown (.md)", description: "মূল editable source", filename: "my-project-full-blueprint-bn.md" },
  txt: { label: "Plain Text (.txt)", description: "সাধারণ টেক্সট ডকুমেন্ট", filename: "my-project-full-blueprint-bn.txt" },
  html: { label: "HTML Document (.html)", description: "ফরম্যাট করা স্বতন্ত্র HTML ডকুমেন্ট", filename: "my-project-full-blueprint-bn.html" },
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
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">ডকুমেন্ট লাইব্রেরি</h1>
          <p className="mt-4 max-w-2xl leading-7 text-slate-600">
            প্রতিটি ডকুমেন্টের জন্য যে ফরম্যাট দরকার, সেই আলাদা ডাউনলোড অপশনে ক্লিক করুন।
            প্রতিটি অপশন তার নিজস্ব .md, .txt বা .html ফাইল ডাউনলোড করবে।
          </p>
          <p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm leading-6 text-blue-900">
            নতুন ডকুমেন্ট যুক্ত করতে GitHub-এর <code>apps/frontend/public/docs/</code> ফোল্ডারে
            সেই ডকুমেন্টের প্রতিটি সমর্থিত ফরম্যাটের ফাইল রাখুন এবং
            <code> apps/frontend/lib/project-documents.ts </code> তালিকায় সেটি যুক্ত করুন।
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
                    {document.formats.map((format) => {
                      const option = formatLabels[format];
                      return (
                        <a
                          key={format}
                          href={`/docs/${option.filename}`}
                          download={option.filename}
                          className="group rounded-xl border border-slate-200 p-4 transition hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <span className="flex items-center justify-between gap-2 font-semibold text-slate-900">
                            {option.label}
                            <span aria-hidden="true" className="text-blue-700">↓</span>
                          </span>
                          <span className="mt-1 block text-xs text-slate-500">{option.description}</span>
                          <span className="mt-3 inline-block text-sm font-semibold text-blue-700">এই ফাইল ডাউনলোড করুন</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        <footer className="mt-6 rounded-2xl border border-dashed border-slate-300 p-5 text-sm leading-6 text-slate-600">
          <strong className="text-slate-800">ফাইল ফরম্যাট:</strong> প্রতিটি অপশন এখন আলাদা ফাইলের দিকে নির্দেশ করে।
          Word (.docx) ও PDF এই তালিকায় এখনো নেই; সেগুলো যোগ করতে প্রকৃত DOCX/PDF ফাইল জেনারেশন বা প্রস্তুত ফাইল যুক্ত করতে হবে।
        </footer>
      </div>
    </main>
  );
}
