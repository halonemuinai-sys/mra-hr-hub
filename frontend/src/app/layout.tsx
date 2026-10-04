import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HR HUB — ATS Resume Automation & Talent Profiling",
  description: "Platform otomatisasi rekrutmen terpadu: Pembacaan CV ATS, Template Import/Export, dan Profiling Kandidat Modern.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
