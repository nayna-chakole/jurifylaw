"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Scale, BookOpen } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || "Login failed. Check your credentials.");
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
              Welcome Back
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Login to your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
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
              <div className="flex justify-end mt-1.5">
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toast("Password reset link sent if account exists.");
                  }}
                  className="text-xs font-medium text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
                >
                  Forgot Password?
                </Link>
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
                "Login"
              )}
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center text-xs text-slate-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-[#7C3AED] hover:text-[#6D28D9] font-bold transition-colors"
            >
              Signup
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
    </div>
  );
}
