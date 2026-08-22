"use client";

import Link from "next/link";
import { Home, LayoutDashboard, UploadCloud } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-4 py-12 text-center bg-[#FAF8FF]">
      <div className="max-w-md w-full space-y-6">
        {/* Large 404 */}
        <div className="text-7xl sm:text-8xl font-extrabold text-[#7C3AED] tracking-tight">
          404
        </div>

        {/* Heading & Subtext */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B]">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Oops! The page you are looking for doesn&apos;t exist. Let&apos;s get you back on track.
          </p>
        </div>

        {/* Go to Dashboard Button */}
        <div>
          <Link
            href="/dashboard"
            className="btn-primary !py-3 !px-8 !rounded-xl !text-sm font-semibold shadow-md"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Directional Signpost Illustration Graphic */}
        <div className="pt-6 flex justify-center opacity-90">
          <div className="flex flex-col items-center">
            {/* Signpost arrows */}
            <div className="space-y-2 w-48">
              <Link
                href="/"
                className="flex items-center justify-between px-4 py-2 rounded-r-2xl bg-[#7C3AED] text-white text-xs font-bold shadow-xs hover:bg-[#6D28D9] transition-colors"
              >
                <span>Home</span>
                <Home className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center justify-between px-4 py-2 rounded-l-2xl bg-purple-600 text-white text-xs font-bold shadow-xs hover:bg-purple-700 transition-colors ml-4"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/upload"
                className="flex items-center justify-between px-4 py-2 rounded-r-2xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 transition-colors"
              >
                <span>Upload</span>
                <UploadCloud className="h-3.5 w-3.5" />
              </Link>
            </div>
            {/* Pole */}
            <div className="w-3 h-12 bg-purple-200 rounded-b" />
            {/* Base */}
            <div className="w-16 h-2 bg-purple-300 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
