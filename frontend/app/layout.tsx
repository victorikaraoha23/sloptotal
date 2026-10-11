import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Lexend, DM_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Display face — editorial serif with a true italic, used for headlines,
// the logo, scores, and "stamp" verdicts. Mirrors web/static's Instrument Serif.
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

// Body face.
const lexend = Lexend({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

// Monospace face for codes, labels, meta.
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SlopTotal — Was it written by a human, or by a very confident autocomplete?",
  description:
    "An open-source AI text detector: 23 engines (neural classifiers, GPT-2 statistics, linguistic heuristics) and a calibrated ensemble turn your text into one forensic verdict.",
  keywords: [
    "AI detector",
    "GPT detector",
    "AI text detection",
    "ChatGPT detector",
    "slop detector",
  ],
  openGraph: {
    title: "SlopTotal — Was it written by a human, or by a very confident autocomplete?",
    description:
      "23 detection engines, one calibrated verdict, zero mercy. Paste text, a URL, or a file.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a18",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${instrument.variable} ${lexend.variable} ${dmMono.variable}`}
    >
      <body className="min-h-screen bg-paper font-body text-slate antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}

