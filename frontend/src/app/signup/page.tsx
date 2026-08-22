"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Scale, BookOpen, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";
import TermsModal from "@/components/TermsModal";

export default function SignupPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAcceptTerms = () => {
    setAcceptedTerms(true);
    toast.success("Terms & Conditions accepted");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!acceptedTerms) {
      toast.error("Please accept the Terms & Conditions");
      setIsTermsOpen(true);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password, fullName);
      toast.success("Account created successfully!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || "Registration failed. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-140px)] px-4 py-12 bg-[#FAF8FF]">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        {/* Main Card */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-purple-100/80 shadow-lg shadow-purple-500/5">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] mb-1.5">
              Create Account
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Sign up to get started
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your name"
                required
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password"
                  required
                  minLength={8}
                  className="input-field !pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#7C3AED] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  required
                  minLength={8}
                  className="input-field !pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#7C3AED] transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {confirmPassword.length >= password.length && password !== confirmPassword && (
                <p className="text-xs text-rose-500 mt-1">Passwords do not match</p>
              )}
            </div>

            {/* Terms and conditions link / checkbox */}
            <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-3">
              <div className="flex items-start gap-2.5">
                <input
                  id="acceptTerms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="h-4 w-4 mt-0.5 rounded border-purple-300 text-[#7C3AED] focus:ring-[#7C3AED] cursor-pointer accent-[#7C3AED]"
                />
                <label htmlFor="acceptTerms" className="text-xs text-slate-600 leading-snug cursor-pointer select-none">
                  I agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setIsTermsOpen(true)}
                    className="text-[#7C3AED] hover:text-[#6D28D9] font-bold underline transition-colors inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Terms and Conditions</span>
                    <ExternalLink className="h-3 w-3 inline opacity-70" />
                  </button>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full !py-3 !rounded-xl text-sm font-semibold mt-2"
            >
              {isLoading ? (
                <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center text-xs text-slate-500 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#7C3AED] hover:text-[#6D28D9] font-bold transition-colors"
            >
              Login
            </Link>
          </p>
        </div>

        {/* Bottom Lavender Scales Illustration */}
        <div className="mt-8 flex justify-center opacity-80">
          <div className="flex items-center gap-4 text-purple-300">
            <BookOpen className="h-8 w-8 text-purple-300/80" />
            <div className="h-10 w-10 rounded-2xl bg-purple-100 flex items-center justify-center text-[#7C3AED]">
              <Scale className="h-6 w-6" />
            </div>
            <BookOpen className="h-8 w-8 text-purple-300/80 -scale-x-100" />
          </div>
        </div>
      </motion.div>

      {/* Terms Modal */}
      <TermsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        onAccept={handleAcceptTerms}
      />
    </div>
  );
}
