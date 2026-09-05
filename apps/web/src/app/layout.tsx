import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/common/Navbar";

export const metadata: Metadata = {
  title: "InterviewAI — Personal AI Mock Interview Coach",
  description:
    "Production-ready personal mock interview practice platform with real-time transcription, live AI answer evaluation, and comprehensive diagnostic reports.",
  other: {
    "darkreader-lock": "true"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200" suppressHydrationWarning>
        <div className="relative min-h-screen flex flex-col">
          {/* Subtle ambient lighting */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-3xl opacity-70" />
            <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-emerald-500/5 blur-3xl rounded-full" />
            <div className="absolute bottom-10 -right-40 w-[600px] h-[600px] bg-indigo-500/5 blur-3xl rounded-full" />
          </div>

          <Navbar />
          <main className="flex-1 relative z-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
