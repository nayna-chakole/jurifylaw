"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  MessageSquare,
  FileText,
  Lightbulb,
  Upload,
  ArrowRight,
  Scale,
  Sparkles,
  Search,
  CheckCircle2,
  Lock,
} from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Risk Detection",
    description: "Identify risky clauses and potential issues with confidence scores.",
  },
  {
    icon: MessageSquare,
    title: "AI Chat",
    description: "Ask questions and get instant, context-aware AI answers.",
  },
  {
    icon: FileText,
    title: "Summary",
    description: "Get quick summaries of long legal contracts in plain language.",
  },
  {
    icon: Lightbulb,
    title: "Suggestions",
    description: "Receive smart suggestions to improve your contract terms.",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Upload Document",
    desc: "Drop your PDF or DOCX contract securely into our analyzer.",
  },
  {
    step: "2",
    title: "AI Processing",
    desc: "Our neural legal models extract text and evaluate clause risk.",
  },
  {
    step: "3",
    title: "Get Insights",
    desc: "View risk scores, entity maps, and actionable recommendations.",
  },
];

export default function HomePage() {
  return (
    <div className="bg-[#FAF8FF] min-h-screen">
      {/* ── 1. Hero Section ────────────────────────── */}
      <section className="relative px-4 pt-12 pb-20 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Text & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/70 border border-purple-200 text-xs font-semibold text-[#7C3AED]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Next-Gen Legal Intelligence</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1E1B4B] tracking-tight leading-[1.15]">
              JurifyLaw <br />
              <span className="text-[#7C3AED]">AI Powered</span> Legal Document Analyzer
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              Upload your legal documents and get AI-powered analysis, risk detection, summaries, and smart suggestions in seconds.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/upload"
                className="btn-primary !px-7 !py-3.5 !text-sm !rounded-xl"
              >
                <Upload className="h-4 w-4" />
                Upload Document
              </Link>
              <Link
                href="#features"
                className="btn-secondary !px-7 !py-3.5 !text-sm !rounded-xl"
              >
                Learn More
              </Link>
            </div>

            {/* Micro Trust Points */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 pt-4 text-xs text-slate-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Instant Risk Scoring</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>PDF & DOCX Support</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-purple-600" />
                <span>Bank-Level Privacy</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Illustration Matching Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md">
              {/* Document Illustration SVG Canvas */}
              <div className="relative bg-white rounded-3xl p-8 border border-purple-100 shadow-xl shadow-purple-500/5">
                {/* Floating Purple Scale Badge */}
                <div className="absolute -top-4 -right-4 h-14 w-14 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Scale className="h-7 w-7" />
                </div>

                {/* Document Shape Graphic */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-rose-400" />
                      <div className="h-3 w-3 rounded-full bg-amber-400" />
                      <div className="h-3 w-3 rounded-full bg-emerald-400" />
                    </div>
                    <div className="h-4 w-20 bg-purple-50 rounded" />
                  </div>

                  {/* Document Mock lines */}
                  <div className="space-y-2.5 pt-2">
                    <div className="h-4 bg-purple-100/70 rounded-md w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-3 bg-slate-100 rounded w-5/6" />
                    <div className="h-3 bg-slate-100 rounded w-4/5" />
                  </div>

                  {/* Mock Risk Chip in Document */}
                  <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[#7C3AED]" />
                      <span className="text-xs font-semibold text-[#1E1B4B]">Clause Analysis</span>
                    </div>
                    <span className="badge badge-safe">SAFE</span>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="h-3 bg-slate-100 rounded w-full" />
                    <div className="h-3 bg-slate-100 rounded w-2/3" />
                  </div>
                </div>

                {/* Magnifying Glass Overlay */}
                <div className="absolute -bottom-5 -left-5 h-16 w-16 rounded-2xl bg-white border border-purple-100 shadow-lg flex items-center justify-center text-[#7C3AED]">
                  <Search className="h-8 w-8 text-[#7C3AED]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Features Section ────────────────────── */}
      <section id="features" className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B]">
            Features
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Everything you need to review contracts and mitigate legal exposure.
          </p>
        </div>

        {/* 4 Cards in a Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 border border-purple-100/80 shadow-sm hover:shadow-md hover:border-purple-200 transition-all text-center flex flex-col items-center justify-center group"
              >
                <div className="h-12 w-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center mb-4 text-[#7C3AED] group-hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-[#1E1B4B] mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. How It Works Section ────────────────── */}
      <section id="how-it-works" className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-purple-100/60">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B]">
            How It Works
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Three simple steps to transform complex contracts into clear answers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {howItWorks.map((item) => (
            <div
              key={item.step}
              className="bg-white rounded-2xl p-6 border border-purple-100/80 shadow-xs text-center flex flex-col items-center"
            >
              <div className="h-10 w-10 rounded-full bg-[#7C3AED] text-white flex items-center justify-center font-bold text-sm mb-4 shadow-sm">
                {item.step}
              </div>
              <h3 className="text-base font-bold text-[#1E1B4B] mb-2">{item.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Pre-Footer Call to Action ───────────── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-gradient-to-r from-purple-50 via-white to-purple-50 rounded-3xl p-10 sm:p-12 border border-purple-200 text-center shadow-xs">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] mb-3">
            Ready to Analyze Your Contracts?
          </h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            Join professionals who rely on JurifyLaw for fast, intelligent contract review.
          </p>
          <Link href="/upload" className="btn-primary !px-8 !py-3 !rounded-xl !text-sm">
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
