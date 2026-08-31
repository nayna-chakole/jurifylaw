"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale,
  LayoutDashboard,
  Clock,
  User,
  LogIn,
  LogOut,
  Menu,
  X,
  MessageSquare,
  UploadCloud,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // In authenticated app pages (Dashboard, Analysis, History, Profile, Chat), show app links
  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/analysis") ||
    pathname.startsWith("/history") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/upload") ||
    pathname.startsWith("/chat");

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-purple-100/80 shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED] shadow-md shadow-purple-500/20 text-white transition-transform group-hover:scale-105">
            <Scale className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#1E1B4B]">
            JurifyLaw
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          {!isAppRoute ? (
            <>
              <Link
                href="/"
                className={`transition-colors hover:text-[#7C3AED] ${
                  pathname === "/" ? "text-[#7C3AED] font-semibold" : ""
                }`}
              >
                Home
              </Link>
              <Link
                href="/#features"
                className="transition-colors hover:text-[#7C3AED]"
              >
                Features
              </Link>
              <Link
                href="/#how-it-works"
                className="transition-colors hover:text-[#7C3AED]"
              >
                How It Works
              </Link>
              <Link
                href="/about"
                className={`transition-colors hover:text-[#7C3AED] ${
                  pathname === "/about" ? "text-[#7C3AED] font-semibold" : ""
                }`}
              >
                About
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className={`transition-colors hover:text-[#7C3AED] ${
                  pathname === "/dashboard" ? "text-[#7C3AED] font-semibold" : ""
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/chat"
                className={`transition-colors hover:text-[#7C3AED] flex items-center gap-1.5 ${
                  pathname === "/chat" ? "text-[#7C3AED] font-semibold" : ""
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>AI Assistant</span>
              </Link>
              <Link
                href="/history"
                className={`transition-colors hover:text-[#7C3AED] ${
                  pathname === "/history" ? "text-[#7C3AED] font-semibold" : ""
                }`}
              >
                History
              </Link>
              <Link
                href="/profile"
                className={`transition-colors hover:text-[#7C3AED] ${
                  pathname === "/profile" ? "text-[#7C3AED] font-semibold" : ""
                }`}
              >
                Profile
              </Link>
            </>
          )}
        </div>

        {/* Right Auth CTA / User Avatar */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-purple-50 transition-colors border border-transparent hover:border-purple-100"
              >
                <div className="h-8 w-8 rounded-full bg-[#7C3AED] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user?.full_name ? user.full_name[0].toUpperCase() : "N"}
                </div>
                <span className="text-sm font-semibold text-[#1E1B4B]">
                  {user?.full_name || "Nayna"}
                </span>
              </Link>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-primary !py-2 !px-6 !rounded-xl !text-sm"
            >
              Login
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 text-slate-600 hover:text-[#7C3AED]"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden border-t border-purple-100 bg-white"
          >
            <div className="px-4 py-4 space-y-2 text-sm font-medium">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-slate-700 hover:text-[#7C3AED]"
              >
                Home
              </Link>
              <Link
                href="/about"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-slate-700 hover:text-[#7C3AED]"
              >
                About Us
              </Link>
              <Link
                href="/#features"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-slate-700 hover:text-[#7C3AED]"
              >
                Features
              </Link>
              <Link
                href="/#how-it-works"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-slate-700 hover:text-[#7C3AED]"
              >
                How It Works
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-slate-700 hover:text-[#7C3AED]"
              >
                Dashboard
              </Link>
              <Link
                href="/chat"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-slate-700 hover:text-[#7C3AED]"
              >
                Legal AI Assistant
              </Link>
              <Link
                href="/history"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-slate-700 hover:text-[#7C3AED]"
              >
                History
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileOpen(false)}
                className="block py-2 text-slate-700 hover:text-[#7C3AED]"
              >
                Profile
              </Link>

              <div className="pt-3 border-t border-purple-100">
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="flex items-center gap-2 text-rose-600 font-semibold py-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="btn-primary w-full text-center"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
