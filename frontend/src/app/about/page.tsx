"use client";

import Link from "next/link";
import {
  Scale,
  ShieldCheck,
  Zap,
  Lock,
  HeartHandshake,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  FileText,
  Building2,
  Briefcase,
  UserCheck,
} from "lucide-react";

const values = [
  {
    icon: ShieldCheck,
    title: "Deterministic Precision",
    description:
      "Our AI models are trained on thousands of standard commercial contract precedents to reliably flag risky indemnities, liabilities, and penalty clauses.",
  },
  {
    icon: Lock,
    title: "Uncompromising Privacy",
    description:
      "Your documents are protected with 256-bit AES encryption. We uphold zero-retention AI processing and never train public models on your confidential files.",
  },
  {
    icon: Sparkles,
    title: "Plain-Language Clarity",
    description:
      "We believe legal intelligence shouldn't be hidden behind dense legalese. We translate complex contractual commitments into crystal-clear actionable summaries.",
  },
  {
    icon: Zap,
    title: "Instant Velocity",
    description:
      "Turn hours of manual redlining into seconds. Get comprehensive risk assessments, entity extractions, and counter-suggestions in real time.",
  },
];

const audiences = [
  {
    icon: Briefcase,
    title: "Founders & Startups",
    description:
      "Quickly review NDAs, Master Service Agreements (MSAs), vendor contracts, and employment agreements before signing.",
  },
  {
    icon: Building2,
    title: "Legal Counsel & Teams",
    description:
      "Accelerate contract discovery, pinpoint non-standard deviations, and generate audit-ready compliance summaries for clients.",
  },
  {
    icon: UserCheck,
    title: "Individuals & Tenants",
    description:
      "Understand lease agreements, rental deposits, and freelance service terms with total transparency and zero hidden traps.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-[#FAF8FF] min-h-[calc(100vh-140px)]">
      {/* ── 1. Hero Section ────────────────────────── */}
      <section className="relative px-4 pt-16 pb-20 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100/70 border border-purple-200 text-xs font-semibold text-[#7C3AED] mb-6 shadow-xs">
          <Scale className="h-3.5 w-3.5" />
          <span>About JurifyLaw</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1E1B4B] tracking-tight leading-[1.15] mb-6">
          Making Legal Contracts <br />
          <span className="text-[#7C3AED]">Transparent & Risk-Free</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
          JurifyLaw is an AI-powered legal document analyzer designed to demystify complex agreements, protect against lopsided liabilities, and accelerate contract reviews for everyone.
        </p>
      </section>

      {/* ── 2. Mission & Vision ────────────────────── */}
      <section className="px-4 py-10 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mission Card */}
          <div className="bg-white rounded-3xl p-8 border border-purple-100 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center font-bold">
                <HeartHandshake className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-[#1E1B4B]">Our Mission</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                To democratize legal intelligence by giving every individual and organization instant, automated tools to understand, redline, and safely negotiate their contracts.
              </p>
            </div>
            <div className="pt-2 text-xs text-[#7C3AED] font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Zero-Blindspot Contract Review</span>
            </div>
          </div>

          {/* Vision Card */}
          <div className="bg-white rounded-3xl p-8 border border-purple-100 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Award className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-[#1E1B4B]">Our Vision</h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                A world where no one enters a binding legal contract with unseen risks or unfair penalties, powered by fast, precise, and ethical artificial intelligence.
              </p>
            </div>
            <div className="pt-2 text-xs text-indigo-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Standard for Modern Legal Tech</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Core Values / Pillars ───────────────── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B]">
            Our Core Principles
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            The foundation behind our neural analysis algorithms and security standards.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((val) => {
            const Icon = val.icon;
            return (
              <div
                key={val.title}
                className="bg-white rounded-3xl p-6 border border-purple-100/80 shadow-xs hover:shadow-md transition-all text-center flex flex-col items-center group"
              >
                <div className="h-12 w-12 rounded-2xl bg-purple-50 text-[#7C3AED] border border-purple-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-[#1E1B4B] mb-2">{val.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{val.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 4. Who We Serve ────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-purple-100/60">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B]">
            Who JurifyLaw Serves
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tailored legal intelligence for every contract stakeholder.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {audiences.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white rounded-3xl p-7 border border-purple-100 shadow-xs space-y-3"
              >
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-[#7C3AED] flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[#1E1B4B]">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 5. Stats Matrix ────────────────────────── */}
      <section className="px-4 py-12 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-3xl bg-white border border-purple-100/80 shadow-xs text-center">
          <div>
            <div className="text-3xl font-extrabold text-[#7C3AED]">10,000+</div>
            <div className="text-xs text-slate-500 mt-1">Contracts Analyzed</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#7C3AED]">99.4%</div>
            <div className="text-xs text-slate-500 mt-1">Risk Detection Accuracy</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-600">256-Bit</div>
            <div className="text-xs text-slate-500 mt-1">Vault Cryptography</div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-[#7C3AED]">&lt; 3.0s</div>
            <div className="text-xs text-slate-500 mt-1">Average Analysis Time</div>
          </div>
        </div>
      </section>

      {/* ── 6. Bottom Call to Action ───────────────── */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-purple-50 via-white to-purple-50 rounded-3xl p-10 sm:p-12 border border-purple-200 text-center shadow-xs">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] mb-3">
            Experience the Future of Contract Review
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mb-6">
            Upload your first legal document now and get a full clause-by-clause risk diagnostic.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/upload" className="btn-primary !px-7 !py-3 !rounded-xl !text-sm">
              Upload Document
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/signup" className="btn-secondary !px-7 !py-3 !rounded-xl !text-sm">
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
