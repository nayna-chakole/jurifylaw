"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Loader2,
  Scale,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/lib/auth-context";
import { documentsAPI } from "@/lib/api";

interface DocItem {
  id: number;
  original_filename?: string;
  name?: string;
  created_at?: string;
  date?: string;
  status?: string;
  risk?: string;
  badge?: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const userName = user?.full_name || "Legal Pro";

  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const docsRes = await documentsAPI.list(1, 6);

        if (docsRes.data?.items?.length > 0) {
          setDocuments(docsRes.data.items);
        } else {
          setDocuments([]);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="flex bg-[#FAF8FF] min-h-[calc(100vh-64px)]">
      {/* Fixed Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 p-6 sm:p-8 lg:p-10 max-w-6xl space-y-8 min-w-0">
        {/* Welcome Header */}
        <div className="pt-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B]">
            Welcome, {userName} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Here&apos;s what&apos;s happening with your legal documents today.
          </p>
        </div>

        {/* Upload Document Promo Card */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50/70 border border-purple-200/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="space-y-3 text-center sm:text-left">
            <h2 className="text-xl font-bold text-[#1E1B4B]">Upload Document</h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md">
              Upload any legal document for AI-powered clause risk detection and summary.
            </p>
            <div>
              <Link href="/upload" className="btn-primary !py-2.5 !px-6 !rounded-xl !text-sm mt-1 inline-flex items-center gap-2">
                <UploadCloud className="h-4 w-4" />
                Upload Now
              </Link>
            </div>
          </div>

          {/* Floating Upload Graphic */}
          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl bg-[#7C3AED] text-white flex items-center justify-center shadow-lg shadow-purple-500/25 shrink-0">
            <UploadCloud className="h-12 w-12 text-white" />
          </div>
        </div>

        {/* Two Side-by-Side Cards: Recent Documents & Analysis Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Documents Card */}
          <div className="bg-white rounded-3xl p-6 border border-purple-100/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-[#1E1B4B]">Recent Documents</h3>
                <Link
                  href="/history"
                  className="text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
                >
                  View All
                </Link>
              </div>

              {loading ? (
                <div className="py-8 text-center flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-[#7C3AED]" /> Loading...
                </div>
              ) : documents.length === 0 ? (
                <div className="py-8 text-center space-y-2 bg-purple-50/20 rounded-2xl p-4 border border-dashed border-purple-100">
                  <FileText className="h-8 w-8 text-slate-300 mx-auto" />
                  <div className="text-xs font-semibold text-slate-600">No documents uploaded yet</div>
                  <p className="text-[11px] text-slate-400">Upload a PDF to see clause risks and summaries.</p>
                  <div className="pt-2">
                    <Link href="/upload" className="btn-primary !text-xs !py-1.5 !px-3">
                      Upload Document
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.slice(0, 4).map((doc) => {
                    const docName = doc.original_filename || doc.name || `Document #${doc.id}`;
                    const docDate = doc.created_at
                      ? new Date(doc.created_at).toLocaleDateString("en-US", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : doc.date || "Recent";
                    const docStatus = doc.status || "COMPLETED";

                    return (
                      <Link
                        key={doc.id}
                        href={`/analysis/${doc.id}`}
                        className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/40 hover:bg-purple-50 border border-purple-100/60 transition-all group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-semibold text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors truncate">
                              {docName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Uploaded {docDate}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`badge shrink-0 ml-2 ${
                            docStatus === "COMPLETED"
                              ? "badge-safe"
                              : docStatus === "FAILED"
                              ? "badge-risky"
                              : "badge-caution"
                          }`}
                        >
                          {docStatus}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 mt-2 text-right border-t border-slate-50">
              <Link
                href="/history"
                className="text-xs font-bold text-[#7C3AED] hover:underline"
              >
                View All Documents →
              </Link>
            </div>
          </div>

          {/* Analysis Features & Diagnostics Card */}
          <div className="bg-white rounded-3xl p-6 border border-purple-100/80 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-[#1E1B4B]">Contract Intelligence</h3>
                <span className="text-xs font-semibold text-[#7C3AED] flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> Automated
                </span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-purple-50/50 border border-purple-100/60 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1E1B4B]">Clause Risk Scoring</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Evaluates high, medium, and low liability clauses with confidence metrics.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100/60 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Scale className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1E1B4B]">Entity & Obligation Extraction</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Identifies parties, payment milestones, due dates, and jurisdictions automatically.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-100/60 flex items-start gap-3">
                  <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1E1B4B]">Plain-Language Summaries</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Synthesizes lengthy legal agreements into concise, executive summaries.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-2 text-right border-t border-slate-50">
              <Link
                href="/upload"
                className="text-xs font-bold text-[#7C3AED] hover:underline inline-flex items-center gap-1"
              >
                <span>Analyze New Contract →</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
