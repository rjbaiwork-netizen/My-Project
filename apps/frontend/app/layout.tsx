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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
