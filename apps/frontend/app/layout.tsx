import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Project",
  description: "Production-ready dynamic CMS"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn">
      <body>
        {children}
        <a
          href="/documents"
          aria-label="প্রজেক্ট ডকুমেন্টস ও রিপোর্ট ডাউনলোড"
          className="fixed bottom-4 right-4 z-50 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-blue-800 bg-blue-700 px-5 py-3 text-sm font-bold text-white shadow-xl transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <span aria-hidden="true">↓</span>
          ডকুমেন্টস / রিপোর্ট ডাউনলোড
        </a>
      </body>
    </html>
  );
}
