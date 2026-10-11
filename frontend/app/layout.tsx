import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SlopTotal — Is it AI slop or human trash?",
  description:
    "An open-source AI text detector: 23 engines (neural classifiers, GPT-2 statistics, linguistic heuristics) and a calibrated ensemble turn your text into one sarcastic verdict.",
  keywords: [
    "AI detector",
    "GPT detector",
    "AI text detection",
    "ChatGPT detector",
    "slop detector",
  ],
  openGraph: {
    title: "SlopTotal — Is it AI slop or human trash?",
    description:
      "23 detection engines, one calibrated verdict, zero mercy. Paste text, a URL, or a file.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#05060a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-void-950 font-sans text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
