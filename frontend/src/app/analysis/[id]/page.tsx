"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  ArrowLeft,
  Loader2,
  Calendar,
  UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { analysisAPI, documentsAPI } from "@/lib/api";

interface RiskResult {
  id?: number;
  risk_level: string;
  confidence: number;
  model_version?: string | null;
}

interface Entity {
  id?: number;
  entity_type: string;
  entity_text: string;
  start_position?: number;
  end_position?: number;
}

interface Obligation {
  id?: number;
  description: string;
  obligated_party: string;
  due_date?: string | null;
}

interface Clause {
  id?: number;
  clause_number: string;
  text: string;
  risk_results?: RiskResult[];
  entities?: Entity[];
  obligations?: Obligation[];
}

interface AnalysisData {
  document?: {
    original_filename?: string;
    file_size?: number;
    created_at?: string;
  };
  model_version?: string;
  summary?: string;
  risk_summary?: {
    high?: number;
    medium?: number;
    low?: number;
  };
  clauses?: Clause[];
}

const mockClauses: Clause[] = [
  {
    id: 1,
    clause_number: "1",
    text: "The supplier must deliver all materials by 2026-09-15. Standard monthly payments are due on the 5th of every month.",
    risk_results: [{ risk_level: "SAFE", confidence: 0.95, model_version: "standard" }],
    entities: [{ id: 1, entity_type: "DATE", entity_text: "2026-09-15", start_position: 43, end_position: 53 }],
    obligations: [{ id: 1, description: "Deliver all materials", obligated_party: "supplier", due_date: "2026-09-15" }],
  },
  {
    id: 2,
    clause_number: "2",
    text: "Landlord reserves unilateral discretion to deduct non-itemized renovation and painting costs without third-party quotes.",
    risk_results: [{ risk_level: "HIGH", confidence: 0.91, model_version: "standard" }],
    entities: [{ id: 2, entity_type: "PARTY", entity_text: "Landlord", start_position: 0, end_position: 8 }],
    obligations: [],
  },
  {
    id: 3,
    clause_number: "3",
    text: "Requires tenant to provide 60 days notice while granting landlord immediate termination upon 7 days notice without cure provisions.",
    risk_results: [{ risk_level: "MEDIUM", confidence: 0.78, model_version: "standard" }],
    entities: [{ id: 3, entity_type: "PARTY", entity_text: "Tenant", start_position: 9, end_position: 15 }],
    obligations: [{ id: 2, description: "Provide 60 days notice", obligated_party: "tenant", due_date: null }],
  },
];

export default function AnalysisResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [expandedClause, setExpandedClause] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    if (id === "sample" || isNaN(Number(id))) {
      // Mock / Sample Data Mode
      setAnalysisData({
        document: {
          original_filename: "Rental Agreement.pdf",
          file_size: 1024 * 350,
          created_at: new Date().toISOString(),
        },
        summary:
          "This agreement contains 2 risky clauses and requires attention in specific areas, particularly regarding security deposit retention and asymmetrical notice periods.",
        risk_summary: { high: 1, medium: 1, low: 1 },
        clauses: mockClauses,
      });
      setExpandedClause("2");
      setLoading(false);
      return;
    }

    const fetchResult = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await analysisAPI.result(Number(id));
        setAnalysisData(res.data);
        if (res.data?.clauses && res.data.clauses.length > 0) {
          setExpandedClause(res.data.clauses[0].clause_number);
        }
      } catch (err: unknown) {
        console.error("Failed to load analysis result:", err);
        let msg = "Could not load analysis result. The document may still be analyzing or not found.";
        if (typeof err === "object" && err !== null && "response" in err) {
          const axiosErr = err as { response?: { data?: { detail?: string } } };
          if (axiosErr.response?.data?.detail) {
            msg = axiosErr.response.data.detail;
          }
        }
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id]);

  const toggleClause = (num: string) => {
    setExpandedClause(expandedClause === num ? null : num);
  };

  const handleDownload = async () => {
    if (!id || id === "sample" || isNaN(Number(id))) {
      toast.success("Downloading PDF Report...");
      return;
    }

    try {
      toast.loading("Preparing download...", { id: "downloading" });
      const res = await documentsAPI.download(Number(id));
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", analysisData?.document?.original_filename || `document-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Download started!", { id: "downloading" });
    } catch {
      toast.error("Failed to download document", { id: "downloading" });
    }
  };

  // Compute aggregated entities
  const allEntities = useMemo(() => {
    if (!analysisData?.clauses) return [];
    const map = new Map<string, { entity: string; value: string }>();
    analysisData.clauses.forEach((c: Clause) => {
      c.entities?.forEach((e: Entity) => {
        const key = `${e.entity_type}:${e.entity_text}`;
        if (!map.has(key)) {
          map.set(key, {
            entity: e.entity_type,
            value: e.entity_text,
          });
        }
      });
    });
    return Array.from(map.values());
  }, [analysisData]);

  // Compute Risk Score
  const { score, levelLabel, levelBadgeClass, strokeColor } = useMemo(() => {
    const high = analysisData?.risk_summary?.high || 0;
    const medium = analysisData?.risk_summary?.medium || 0;
    const low = analysisData?.risk_summary?.low || 0;
    const total = high + medium + low;

    if (total === 0) {
      return { score: 10, levelLabel: "Low Risk", levelBadgeClass: "badge-safe", strokeColor: "text-emerald-500" };
    }

    const calculatedScore = Math.min(100, Math.max(10, Math.round(((high * 1.0 + medium * 0.5) / total) * 100)));

    if (high > 0 || calculatedScore >= 60) {
      return {
        score: calculatedScore,
        levelLabel: "High Risk",
        levelBadgeClass: "badge-risky",
        strokeColor: "text-rose-500",
      };
    } else if (medium > 0 || calculatedScore >= 30) {
      return {
        score: calculatedScore,
        levelLabel: "Medium Risk",
        levelBadgeClass: "badge-caution",
        strokeColor: "text-amber-500",
      };
    }
    return {
      score: calculatedScore,
      levelLabel: "Low Risk",
      levelBadgeClass: "badge-safe",
      strokeColor: "text-emerald-500",
    };
  }, [analysisData]);

  if (loading) {
    return (
      <div className="bg-[#FAF8FF] min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="h-10 w-10 text-[#7C3AED] animate-spin mb-4" />
        <h2 className="text-xl font-bold text-[#1E1B4B]">Loading Analysis...</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">Retrieving AI clause risk reports</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FAF8FF] min-h-[calc(100vh-140px)] flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-white rounded-3xl p-8 max-w-md border border-purple-100 shadow-sm space-y-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-[#1E1B4B]">Analysis Not Available</h2>
          <p className="text-xs sm:text-sm text-slate-500">{error}</p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button onClick={() => router.push("/upload")} className="btn-primary !text-xs !py-2.5 !px-5">
              Upload New Document
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const documentName = analysisData?.document?.original_filename || "Document Analysis";
  const summaryText = analysisData?.summary || "Analysis completed successfully. Review extracted clauses and risk items below.";

  return (
    <div className="bg-[#FAF8FF] min-h-[calc(100vh-140px)] px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header with Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/history"
                className="text-xs font-semibold text-[#7C3AED] hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Documents
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B]">
              Analysis Result
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Here is the AI analysis and risk breakdown for your document.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownload}
              className="btn-primary !px-5 !py-2.5 !rounded-xl !text-xs shadow-sm inline-flex items-center gap-2"
            >
              <Download className="h-3.5 w-3.5" />
              Download Document
            </button>
          </div>
        </div>

        {/* ── Top Row: Summary & Risk Score ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Summary Card */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1E1B4B]">
                <div className="h-8 w-8 rounded-lg bg-purple-50 text-[#7C3AED] flex items-center justify-center">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <span>Executive Summary</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed pt-1 whitespace-pre-line">
                {summaryText}
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-600">{documentName}</span>
              {analysisData?.model_version && (
                <>
                  <span>•</span>
                  <span>Model: {analysisData.model_version}</span>
                </>
              )}
            </div>
          </div>

          {/* Risk Score Card */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Risk Score
              </div>
              <div className="text-4xl font-extrabold text-[#1E1B4B] mt-1">
                {score}%
              </div>
              <div className="mt-2">
                <span className={`badge ${levelBadgeClass}`}>{levelLabel}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-3 space-x-2">
                <span>High: {analysisData?.risk_summary?.high || 0}</span>
                <span>•</span>
                <span>Med: {analysisData?.risk_summary?.medium || 0}</span>
                <span>•</span>
                <span>Low: {analysisData?.risk_summary?.low || 0}</span>
              </div>
            </div>

            {/* Circular Gauge */}
            <div className="relative h-24 w-24 flex items-center justify-center">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.8"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={strokeColor}
                  strokeDasharray={`${score}, 100`}
                  strokeWidth="3.8"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className={`absolute text-xs font-bold ${strokeColor}`}>
                {score}%
              </span>
            </div>
          </div>
        </div>

        {/* ── Middle Row: Clauses Analysis & Named Entities ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Clauses Analysis Card */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1E1B4B]">
                Clauses Analysis ({analysisData?.clauses?.length || 0})
              </h2>
            </div>

            <div className="space-y-4">
              {(!analysisData?.clauses || analysisData.clauses.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-purple-50/20 rounded-2xl border border-dashed border-purple-100">
                  No individual clauses detected in this document.
                </div>
              ) : (
                analysisData.clauses.map((clause: Clause) => {
                  const isExpanded = expandedClause === clause.clause_number;
                  const primaryRisk = clause.risk_results?.[0]?.risk_level || "SAFE";
                  const confidence = clause.risk_results?.[0]?.confidence;
                  
                  let badgeStyle = "badge-safe";
                  if (primaryRisk.toUpperCase() === "HIGH") badgeStyle = "badge-risky";
                  else if (primaryRisk.toUpperCase() === "MEDIUM" || primaryRisk.toUpperCase() === "CAUTION") badgeStyle = "badge-caution";

                  return (
                    <div
                      key={clause.id || clause.clause_number}
                      className="p-4 sm:p-5 rounded-2xl bg-purple-50/30 border border-purple-100/70 space-y-3 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-sm font-bold text-[#1E1B4B]">
                          Clause {clause.clause_number}
                        </div>
                        <div className="flex items-center gap-2">
                          {confidence !== undefined && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              {Math.round(confidence * 100)}% conf
                            </span>
                          )}
                          <span className={`badge ${badgeStyle}`}>{primaryRisk.toUpperCase()}</span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-serif bg-white/70 p-3 rounded-xl border border-purple-100/50">
                        &quot;{clause.text}&quot;
                      </p>

                      {/* Obligations if any */}
                      {clause.obligations && clause.obligations.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {clause.obligations.map((ob: Obligation, idx: number) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 bg-purple-100/40 px-3 py-1.5 rounded-lg">
                              <UserCheck className="h-3.5 w-3.5 text-[#7C3AED]" />
                              <span><strong>{ob.obligated_party}:</strong> {ob.description}</span>
                              {ob.due_date && (
                                <span className="ml-auto text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                                  <Calendar className="h-3 w-3" /> {ob.due_date}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <div>
                        <button
                          onClick={() => toggleClause(clause.clause_number)}
                          className="text-xs font-bold text-[#7C3AED] hover:text-[#6D28D9] inline-flex items-center gap-1 cursor-pointer transition-colors pt-1"
                        >
                          <span>{isExpanded ? "Hide Details" : "View Details & Entities"}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="mt-2 pt-3 border-t border-purple-100 text-xs text-slate-700 bg-white p-3.5 rounded-xl border space-y-2">
                          <div className="font-semibold text-slate-800">Entities in this clause:</div>
                          {(!clause.entities || clause.entities.length === 0) ? (
                            <span className="text-slate-400 italic">No named entities in this clause.</span>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {clause.entities.map((e: Entity, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 text-[#7C3AED] border border-purple-200 text-[11px] font-medium"
                                >
                                  <strong>{e.entity_type}:</strong> {e.entity_text}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Named Entities Card */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#1E1B4B]">
              Named Entities ({allEntities.length})
            </h2>

            <div className="overflow-hidden rounded-2xl border border-purple-100">
              {allEntities.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No entities extracted
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-purple-50/70 text-slate-600 font-semibold border-b border-purple-100">
                    <tr>
                      <th className="p-3">Entity Type</th>
                      <th className="p-3">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {allEntities.map((item, idx) => (
                      <tr key={idx} className="hover:bg-purple-50/30">
                        <td className="p-3 font-semibold text-[#7C3AED]">{item.entity}</td>
                        <td className="p-3 text-slate-700 font-mono text-[11px]">{item.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* ── Bottom Action Links ── */}
        <div className="text-center pt-2 flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/upload"
            className="btn-primary !px-8 !py-3.5 !rounded-xl !text-sm shadow-md"
          >
            Upload Another Document →
          </Link>
          <Link
            href="/history"
            className="btn-secondary !px-8 !py-3.5 !rounded-xl !text-sm shadow-sm"
          >
            View Document History
          </Link>
        </div>
      </div>
    </div>
  );
}
