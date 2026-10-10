import { projectDocuments } from "../../lib/project-documents";

export const metadata = {
  title: "প্রজেক্ট ডকুমেন্টস | My-Project",
  description: "প্রজেক্টের রিপোর্ট Word, PDF ও অন্যান্য ফরম্যাটে ডাউনলোড করুন।",
};

const formatLabels = {
  md: { label: "Markdown (.md)", description: "মূল editable source" },
  txt: { label: "Plain Text (.txt)", description: "সাধারণ টেক্সট ডকুমেন্ট" },
  html: { label: "HTML (.html)", description: "ওয়েব ব্রাউজারে খোলা যায়" },
  docx: { label: "Word (.docx)", description: "Microsoft Word / compatible editor" },
  pdf: { label: "PDF (.pdf)", description: "শেয়ার ও প্রিন্ট করার উপযোগী" },
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
            প্রতিটি ডকুমেন্টের পাশে পছন্দের ফরম্যাটে ক্লিক করুন। Word ও PDF ফাইল মূল Markdown রিপোর্ট থেকে তৈরি হয়ে সরাসরি ডাউনলোড হবে।
          </p>
          <p className="mt-3 rounded-xl bg-blue-50 p-3 text-sm leading-6 text-blue-900">
            নতুন ডকুমেন্ট যোগ করতে GitHub-এর <code>apps/frontend/public/docs/</code> ফোল্ডারে
            Markdown source রাখুন এবং <code>apps/frontend/lib/project-documents.ts</code> তালিকায় entry যোগ করুন।
            DOCX/PDF-এর জন্য আলাদা বাইনারি ফাইল তৈরি করে রাখতে হবে না।
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
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {document.formats.map((format) => {
                      const option = formatLabels[format];
                      return (
                        <a
                          key={format}
                          href={`/api/documents/${document.id}/download?format=${format}`}
                          className="group rounded-xl border border-slate-200 p-4 transition hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <span className="flex items-center justify-between gap-2 font-semibold text-slate-900">
                            {option.label}
                            <span aria-hidden="true" className="text-blue-700">↓</span>
                          </span>
                          <span className="mt-1 block text-xs text-slate-500">{option.description}</span>
                          <span className="mt-3 inline-block text-sm font-semibold text-blue-700">ডাউনলোড করুন</span>
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
          <strong className="text-slate-800">উপলভ্য ফরম্যাট:</strong> Markdown (.md), Plain Text (.txt), HTML (.html), Word (.docx), PDF (.pdf)।
          প্রতিটি অপশন নির্দিষ্ট format parameter দিয়ে export endpoint-এ যায় এবং attachment হিসেবে ফেরত আসে।
        </footer>
      </div>
    </main>
  );
}
