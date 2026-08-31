"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, Mail, Phone } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on app-level workspaces for clean full-height layouts
  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/analysis") ||
    pathname.startsWith("/upload") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/chat");

  if (isAppRoute) {
    return null;
  }

  return (
    <footer className="bg-[#0B0D17] text-white border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED] text-white shadow-sm">
                <Scale className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                JurifyLaw
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
              AI Powered Legal Document Analyzer. Upload your legal documents and get AI-powered analysis, risk detection, summaries, and smart suggestions in seconds.
            </p>
          </div>

          {/* About */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">About</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/about" className="hover:text-purple-300 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="hover:text-purple-300 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/#features" className="hover:text-purple-300 transition-colors">
                  Features
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link href="/signup" className="hover:text-purple-300 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-purple-300 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-purple-300 transition-colors">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Contact</h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <a
                  href="mailto:support@jurifylaw.com"
                  className="flex items-center gap-2 hover:text-purple-300 transition-colors"
                >
                  <Mail className="h-3.5 w-3.5 text-purple-400" />
                  support@jurifylaw.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+919876543210"
                  className="flex items-center gap-2 hover:text-purple-300 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-purple-400" />
                  +91 9876543210
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-500">
            © 2024–2026 JurifyLaw. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
