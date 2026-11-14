import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "CampusAI — Autonomous Multilingual College Reception Robot",
  description:
    "Zero-cost, voice-enabled college reception robot and interactive kiosk powered by Groq Whisper, Llama 3.3 70B, FAISS vector RAG, and SQLite. Spoken guidance in English, Hindi, and Marathi.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.variable}`} data-type="software">
      <head>
        <meta name="site-kind" content="software" />
        <meta name="page-type" content="software" />
      </head>
      <body className="font-sans bg-ground text-ink min-h-screen antialiased selection:bg-accent selection:text-white">
        {children}
      </body>
    </html>
  );
}
