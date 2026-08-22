"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, ChevronDown, Check } from "lucide-react";

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export default function TermsModal({ isOpen, onClose, onAccept }: TermsModalProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  // Check scroll position
  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 30) {
        setHasScrolledToBottom(true);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const scrollToBottom = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: contentRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const handleAccept = () => {
    onAccept();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.35, bounce: 0.1 }}
            className="relative w-full max-w-lg bg-white border border-purple-100 rounded-3xl shadow-2xl overflow-hidden z-10"
          >
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 text-center">
              <button
                onClick={onClose}
                type="button"
                className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-xl bg-purple-50 text-[#7C3AED] mb-2">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-[#1E1B4B] tracking-tight">
                Terms and Conditions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Please review our terms of service before continuing
              </p>
            </div>

            {/* Scrollable Terms Content */}
            <div className="relative">
              <div
                ref={contentRef}
                onScroll={handleScroll}
                className="max-h-72 overflow-y-auto px-6 py-4 space-y-4 text-xs text-slate-600 leading-relaxed"
              >
                <p>
                  The following is a legal agreement between you (&quot;you&quot; or &quot;User&quot;) and the operators of JurifyLaw regarding the use of our AI document analysis platform.
                </p>

                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">1. Acceptance of Terms</h3>
                  <p>
                    By using JurifyLaw, you agree to be bound by these Terms and Conditions. If you disagree, you may not use the Service.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">2. AI Analysis & Legal Disclaimer</h3>
                  <p>
                    JurifyLaw provides automated AI document summaries, clause analysis, and risk metrics. JurifyLaw is not a law firm and does not provide formal legal advice.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">3. Privacy & Confidentiality</h3>
                  <p>
                    Your uploaded documents are processed securely. We do not sell your personal data or document contents to third parties.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">4. Account Responsibilities</h3>
                  <p>
                    You are responsible for safeguarding your credentials and for all actions taken through your account.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">5. Limitation of Liability</h3>
                  <p>
                    JurifyLaw is not liable for damages resulting from contract interpretations or reliance on automated analysis.
                  </p>
                </div>
              </div>

              {/* Scroll Down Prompt */}
              {!hasScrolledToBottom && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none">
                  <button
                    type="button"
                    onClick={scrollToBottom}
                    className="pointer-events-auto flex items-center gap-1.5 text-[11px] font-semibold text-[#7C3AED] bg-white/95 backdrop-blur-md px-3 py-1 rounded-full border border-purple-200 shadow-md hover:bg-purple-50 transition-all cursor-pointer"
                  >
                    <span>Scroll to read all</span>
                    <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
                  </button>
                </div>
              )}
            </div>

            {/* Footer with ACCEPT Button */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleAccept}
                className="w-full sm:w-auto min-w-[160px] btn-primary !py-2.5 !text-xs !uppercase !tracking-wider flex items-center justify-center gap-1.5"
              >
                <Check className="h-4 w-4" />
                ACCEPT
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
