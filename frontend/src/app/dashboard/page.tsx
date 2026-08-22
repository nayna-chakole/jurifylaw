"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/lib/auth-context";
import { documentsAPI, chatAPI } from "@/lib/api";

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

interface ChatItem {
  id: number;
  title: string;
  created_at: string;
}

const defaultRecentDocs: DocItem[] = [
  {
    id: 1,
    name: "Rental Agreement.pdf",
    date: "12 May 2024",
    risk: "72% (High)",
    badge: "badge-risky",
  },
  {
    id: 2,
    name: "Employment Contract.pdf",
    date: "10 May 2024",
    risk: "45% (Medium)",
    badge: "badge-caution",
  },
  {
    id: 3,
    name: "NDA.pdf",
    date: "08 May 2024",
    risk: "20% (Low)",
    badge: "badge-safe",
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const userName = user?.full_name || "Adam";

  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [docsRes, chatsRes] = await Promise.allSettled([
          documentsAPI.list(1, 4),
          chatAPI.listSessions(),
        ]);

        if (docsRes.status === "fulfilled" && docsRes.value.data?.items?.length > 0) {
          setDocuments(docsRes.value.data.items);
        } else {
          setDocuments([]);
        }

        if (chatsRes.status === "fulfilled" && chatsRes.value.data?.length > 0) {
          setChats(chatsRes.value.data.slice(0, 4));
        } else {
          setChats([]);
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

      {/* Main Content Area with proper padding */}
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

        {/* Two Side-by-Side Cards: Recent Documents & Chat History */}
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

          {/* Chat History Card */}
          <div className="bg-white rounded-3xl p-6 border border-purple-100/80 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-[#1E1B4B]">Chat History</h3>
                <Link
                  href="/chat"
                  className="text-xs font-semibold text-[#7C3AED] hover:text-[#6D28D9] transition-colors"
                >
                  Open Chat
                </Link>
              </div>

              {loading ? (
                <div className="py-8 text-center flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin text-[#7C3AED]" /> Loading...
                </div>
              ) : chats.length === 0 ? (
                <div className="py-8 text-center space-y-2 bg-purple-50/20 rounded-2xl p-4 border border-dashed border-purple-100">
                  <MessageSquare className="h-8 w-8 text-slate-300 mx-auto" />
                  <div className="text-xs font-semibold text-slate-600">No chat sessions yet</div>
                  <p className="text-[11px] text-slate-400">Start asking legal questions to your contracts.</p>
                  <div className="pt-2">
                    <Link href="/chat" className="btn-primary !text-xs !py-1.5 !px-3">
                      Start New Chat
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {chats.map((chat) => (
                    <Link
                      key={chat.id}
                      href="/chat"
                      className="flex items-center justify-between p-3 rounded-2xl bg-purple-50/40 hover:bg-purple-50 border border-purple-100/60 transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                          <MessageSquare className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm font-semibold text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors truncate">
                            {chat.title}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(chat.created_at).toLocaleDateString("en-US", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 mt-2 text-right border-t border-slate-50">
              <Link
                href="/chat"
                className="text-xs font-bold text-[#7C3AED] hover:underline"
              >
                Open AI Chat →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
