"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ChevronLeft, ChevronRight, Eye, Loader2, UploadCloud } from "lucide-react";
import { documentsAPI } from "@/lib/api";

interface HistoryDoc {
  id: number;
  original_filename?: string;
  name?: string;
  created_at?: string;
  date?: string;
  status?: string;
  riskScore?: string;
  badge?: string;
}

const mockHistory: HistoryDoc[] = [
  {
    id: 1,
    name: "Rental Agreement.pdf",
    date: "12 May 2024",
    status: "COMPLETED",
    riskScore: "72% (High)",
    badge: "badge-risky",
  },
  {
    id: 2,
    name: "Employment Contract.pdf",
    date: "10 May 2024",
    status: "COMPLETED",
    riskScore: "45% (Medium)",
    badge: "badge-caution",
  },
  {
    id: 3,
    name: "NDA.pdf",
    date: "08 May 2024",
    status: "COMPLETED",
    riskScore: "20% (Low)",
    badge: "badge-safe",
  },
];

export default function HistoryPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [documents, setDocuments] = useState<HistoryDoc[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        setLoading(true);
        const res = await documentsAPI.list(currentPage, pageSize);
        if (res.data?.items && res.data.items.length > 0) {
          setDocuments(res.data.items);
          setTotalCount(res.data.total || res.data.items.length);
        } else {
          setDocuments([]);
          setTotalCount(0);
        }
      } catch {
        // Fallback to sample history if not logged in
        setDocuments(mockHistory);
        setTotalCount(mockHistory.length);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [currentPage]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="bg-[#FAF8FF] min-h-[calc(100vh-140px)] p-6 sm:p-8 lg:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B]">
              Documents History
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              View and access your analyzed contracts and legal files.
            </p>
          </div>
          <Link href="/upload" className="btn-primary !py-2.5 !px-5 !rounded-xl !text-xs self-start sm:self-auto inline-flex items-center gap-2">
            <UploadCloud className="h-4 w-4" /> Upload Document
          </Link>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/80 shadow-xs space-y-6 overflow-hidden">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="h-8 w-8 text-[#7C3AED] animate-spin mb-2" />
              <p className="text-xs text-slate-500">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <FileText className="h-10 w-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-700">No documents found</div>
              <p className="text-xs text-slate-400">You haven&apos;t uploaded any legal documents yet.</p>
              <div className="pt-2">
                <Link href="/upload" className="btn-primary !text-xs !py-2 !px-4">
                  Upload Your First File
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="pb-4 font-bold">Document Name</th>
                      <th className="pb-4 font-bold">Uploaded On</th>
                      <th className="pb-4 font-bold">Status</th>
                      <th className="pb-4 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {documents.map((doc) => {
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
                        <tr key={doc.id} className="hover:bg-purple-50/30 transition-colors">
                          <td className="py-4 font-semibold text-[#1E1B4B]">
                            <div className="flex items-center gap-2.5">
                              <FileText className="h-4 w-4 text-[#7C3AED]" />
                              <span>{docName}</span>
                            </div>
                          </td>
                          <td className="py-4 text-slate-500">{docDate}</td>
                          <td className="py-4">
                            <span
                              className={`badge ${
                                docStatus === "COMPLETED"
                                  ? "badge-safe"
                                  : docStatus === "FAILED"
                                  ? "badge-risky"
                                  : "badge-caution"
                              }`}
                            >
                              {docStatus}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <Link
                              href={`/analysis/${doc.id}`}
                              className="font-bold text-[#7C3AED] hover:text-[#6D28D9] transition-colors inline-flex items-center gap-1"
                            >
                              <span>View Analysis →</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-100 text-xs font-semibold">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl text-slate-400 hover:text-[#7C3AED] disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="h-8 px-3 rounded-xl bg-[#7C3AED] text-white flex items-center justify-center shadow-xs">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl text-slate-400 hover:text-[#7C3AED] disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
