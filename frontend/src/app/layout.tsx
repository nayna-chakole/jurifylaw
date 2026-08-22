import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "JurifyLaw — AI Powered Legal Document Analyzer",
  description:
    "Upload your legal documents and get AI-powered analysis, risk detection, summaries, and smart suggestions in seconds.",
  keywords: ["JurifyLaw", "AI legal analyzer", "contract review", "risk detection", "document summary"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={sans.variable}>
      <body className="font-sans antialiased bg-[#FAF8FF] text-[#1E1B4B] min-h-screen flex flex-col justify-between">
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
