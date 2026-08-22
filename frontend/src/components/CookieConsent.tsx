"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, ShieldCheck, X, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a cookie consent choice
    const consent = localStorage.getItem("jurify_cookie_consent");
    if (!consent) {
      // Show with a brief delay for a polished entry experience
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("jurify_cookie_consent", "accepted");
    setIsVisible(false);
    toast.success("Cookie preferences saved", {
      icon: "🍪",
      duration: 3000,
    });
  };

  const handleDeny = () => {
    localStorage.setItem("jurify_cookie_consent", "denied");
    setIsVisible(false);
    toast("Non-essential cookies disabled", {
      icon: "🛡️",
      duration: 3000,
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.96 }}
          transition={{ type: "spring", duration: 0.45, bounce: 0.15 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50"
        >
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-purple-200/80 shadow-2xl shadow-purple-900/15 relative space-y-4">
            {/* Top Close Button */}
            <button
              onClick={handleDeny}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Dismiss cookie notice"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header with Icon */}
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#7C3AED] shrink-0 shadow-xs">
                <Cookie className="h-5 w-5" />
              </div>
              <div className="pr-4">
                <h3 className="text-sm font-bold text-[#1E1B4B]">
                  Cookie & Privacy Preferences
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  We use essential cookies to maintain secure sessions and optimize AI document analysis. Read our{" "}
                  <Link
                    href="/about"
                    className="text-[#7C3AED] hover:underline font-semibold"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleAccept}
                className="btn-primary flex-1 !py-2.5 !rounded-xl !text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Check className="h-3.5 w-3.5" />
                Accept Cookies
              </button>
              <button
                type="button"
                onClick={handleDeny}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Deny
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
