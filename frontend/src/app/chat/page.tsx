"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Scale,
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  Copy,
  Check,
  FileSpreadsheet,
  ChevronRight,
  Briefcase,
  Home,
  AlertTriangle,
  Clock,
  Loader2,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { chatAPI, documentsAPI } from "@/lib/api";
import Sidebar from "@/components/Sidebar";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  sources?: string[];
  mode?: string;
  elapsed_seconds?: number;
  document_id?: number;
}

interface DocumentItem {
  id: number;
  original_filename: string;
  status: string;
}

const quickChips = [
  { label: "Severance rights", query: "Can an employer terminate employment without paying severance under Indian law?" },
  { label: "Notice period rules", query: "What are the notice period rules under the Industrial Relations Code 2020?" },
  { label: "Security deposit limits", query: "Can a landlord deduct painting charges from security deposit without bills?" },
  { label: "Penalty clauses", query: "Are unilateral penalty and liquidated damages clauses valid under Section 74?" },
  { label: "Non-compete validity", query: "Is a non-compete clause enforceable after resigning from an Indian company?" },
];

const legalCategories = [
  {
    title: "Employment & Labour Law",
    icon: Briefcase,
    color: "bg-blue-50 text-blue-600 border-blue-100",
    questions: [
      "Can an employer terminate employment without paying severance under Indian law?",
      "What are the notice period rules under the Industrial Relations Code 2020?",
      "Is a non-compete clause enforceable after resigning from an Indian company?",
    ],
  },
  {
    title: "Rental & Tenancy Agreements",
    icon: Home,
    color: "bg-emerald-50 text-emerald-600 border-emerald-100",
    questions: [
      "Can a landlord deduct painting charges from security deposit without bills?",
      "What is the statutory lock-in period limitation in Indian lease agreements?",
      "Can a landlord evict a tenant without giving formal notice or court orders?",
    ],
  },
  {
    title: "Contract Risk & Penalties",
    icon: AlertTriangle,
    color: "bg-amber-50 text-amber-600 border-amber-100",
    questions: [
      "Are unilateral penalty and liquidated damages clauses valid under Section 74?",
      "What constitutes an unconscionable contract term under Indian Contract Act?",
      "How to balance an asymmetrical indemnity clause in service agreements?",
    ],
  },
];

function ChatContent() {
  const searchParams = useSearchParams();
  const docIdParam = searchParams.get("doc");

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"chat" | "topics">("chat");
  const [selectedDocId, setSelectedDocId] = useState<number | undefined>(
    docIdParam ? Number(docIdParam) : undefined
  );
  const [userDocs, setUserDocs] = useState<DocumentItem[]>([]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      sender: "assistant",
      text: "Welcome to JurifyLaw Legal Assistant! I am an AI specialized in Indian legal frameworks, statutory rights, and contract terms. Ask me any legal question or select an uploaded contract to ground your query.",
      timestamp: "Just now",
      mode: "rag",
      sources: ["Constitution of India", "Indian Contract Act 1872", "Industrial Relations Code 2020"],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await documentsAPI.list(1, 20);
        if (res.data?.items) {
          setUserDocs(res.data.items);
        }
      } catch {
        // Continue if unauthenticated or list failed
      }
    };
    fetchDocs();
  }, []);

  useEffect(() => {
    if (mobileTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, mobileTab]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || query).trim();
    if (!text || loading) return;

    // If on topics tab on mobile, automatically switch back to chat
    if (mobileTab !== "chat") {
      setMobileTab("chat");
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      document_id: selectedDocId,
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const res = await chatAPI.ask(text, selectedDocId);
      const data = res.data;

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "assistant",
        text: data.answer || "I have processed your query according to applicable statutory provisions.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: data.sources || [],
        mode: data.mode || "rag",
        elapsed_seconds: data.elapsed_seconds || 0,
        document_id: data.document_id,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      console.error("Chat error:", err);
      let errMsg = "Unable to connect to the legal AI pipeline.";
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        if (axiosErr.response?.data?.detail) {
          errMsg = axiosErr.response.data.detail;
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "assistant",
          text: `⚠️ **Error:** ${errMsg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          mode: "error",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Answer copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "init",
        sender: "assistant",
        text: "Conversation cleared. Feel free to ask any question on Indian legal frameworks, statutes, or contract terms.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        mode: "rag",
        sources: ["Indian Legal Corpus"],
      },
    ]);
  };

  return (
    <div className="flex bg-[#FAF8FF] h-[calc(100dvh-64px)] overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col p-3 sm:p-5 lg:p-6 max-w-7xl mx-auto w-full min-w-0 h-full overflow-hidden">
        {/* Header Bar */}
        <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl sm:rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
              <Scale className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl font-extrabold text-[#1E1B4B] truncate">
                Legal AI Assistant & Statutory Q&A
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Grounded statutory legal intelligence powered by hybrid retrieval and Indian legal corpus.
              </p>
            </div>
          </div>

          {/* Controls: Context Selector & Reset */}
          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap sm:flex-nowrap">
            {/* Document Context Picker */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-white px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl border border-purple-100 shadow-xs max-w-full sm:max-w-xs">
              <FileSpreadsheet className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#7C3AED] shrink-0" />
              <div className="text-[10px] sm:text-xs min-w-0">
                <label htmlFor="doc-select" className="text-slate-400 block text-[8px] sm:text-[9px] uppercase font-bold tracking-wider leading-none mb-0.5">
                  Context:
                </label>
                <select
                  id="doc-select"
                  value={selectedDocId || ""}
                  onChange={(e) =>
                    setSelectedDocId(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="text-[11px] sm:text-xs font-semibold text-[#1E1B4B] bg-transparent focus:outline-none cursor-pointer max-w-[130px] xs:max-w-[170px] sm:max-w-[180px] truncate block"
                >
                  <option value="">None (Indian Corpus)</option>
                  {userDocs.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      #{doc.id} - {doc.original_filename}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Chat Button */}
            {messages.length > 1 && (
              <button
                onClick={handleResetChat}
                className="text-[11px] sm:text-xs font-medium text-slate-500 hover:text-rose-600 bg-white hover:bg-rose-50 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl border border-purple-100 transition shadow-xs cursor-pointer flex items-center gap-1 shrink-0"
                title="Clear Chat"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile View Toggle Switcher (< lg) */}
        <div className="flex lg:hidden bg-purple-100/70 p-1 rounded-2xl mb-3 shrink-0">
          <button
            onClick={() => setMobileTab("chat")}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${mobileTab === "chat"
                ? "bg-[#7C3AED] text-white shadow-sm"
                : "text-slate-600 hover:text-[#7C3AED]"
              }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Chat</span>
          </button>
          <button
            onClick={() => setMobileTab("topics")}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${mobileTab === "topics"
                ? "bg-[#7C3AED] text-white shadow-sm"
                : "text-slate-600 hover:text-[#7C3AED]"
              }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Suggested Topics</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden">
          {/* Chat Container (Full width on mobile when tab is 'chat', 8 cols on desktop) */}
          <div
            className={`lg:col-span-8 bg-white rounded-2xl sm:rounded-3xl border border-purple-100/90 shadow-sm flex flex-col h-full min-h-0 overflow-hidden ${mobileTab === "topics" ? "hidden lg:flex" : "flex"
              }`}
          >
            {/* Chat Messages Scrollable Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-3.5 sm:space-y-4 bg-[#FAF8FF]/30">
              {messages.map((msg) => {
                const isUser = msg.sender === "user";
                const isRAG = msg.mode === "rag" || msg.mode === "document_context";
                const isGeneralFallback = msg.mode === "general_fallback" || msg.mode === "general";

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 sm:gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`h-7 w-7 sm:h-8 sm:w-8 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 text-xs sm:text-sm font-bold shadow-xs ${isUser
                          ? "bg-[#7C3AED] text-white"
                          : "bg-gradient-to-br from-[#1E1B4B] to-[#7C3AED] text-white"
                        }`}
                    >
                      {isUser ? <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                    </div>

                    {/* Content Bubble */}
                    <div
                      className={`max-w-[88%] sm:max-w-[85%] rounded-2xl sm:rounded-3xl p-3 sm:p-4 text-xs sm:text-sm leading-relaxed ${isUser
                          ? "bg-[#7C3AED] text-white rounded-tr-xs shadow-md shadow-purple-500/10"
                          : "bg-white text-slate-800 rounded-tl-xs border border-purple-100 shadow-xs"
                        }`}
                    >
                      <MarkdownRenderer content={msg.text} isUser={isUser} />

                      {/* Metadata Footer for Assistant messages */}
                      {!isUser && (
                        <div className="mt-2.5 pt-2.5 sm:mt-3 sm:pt-3 border-t border-purple-50 space-y-2">
                          <div className="flex items-center justify-between gap-1.5 flex-wrap text-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isRAG ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] sm:text-[11px] font-semibold border border-emerald-200">
                                  <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                  Verified Legal Corpus
                                </span>
                              ) : isGeneralFallback ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] sm:text-[11px] font-semibold border border-amber-200">
                                  <HelpCircle className="h-3 w-3 text-amber-600" />
                                  General Knowledge
                                </span>
                              ) : null}

                              {msg.elapsed_seconds ? (
                                <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {msg.elapsed_seconds}s
                                </span>
                              ) : null}
                            </div>

                            <button
                              onClick={() => handleCopy(msg.id, msg.text)}
                              className="text-slate-400 hover:text-[#7C3AED] p-1 transition cursor-pointer"
                              title="Copy answer"
                            >
                              {copiedId === msg.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Citations list */}
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Statutory Citations:
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {msg.sources.map((src, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 text-[#7C3AED] border border-purple-200 text-[10px] sm:text-[11px] font-medium"
                                  >
                                    <BookOpen className="h-2.5 w-2.5 sm:h-3 sm:w-3 shrink-0" />
                                    <span>{src}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div
                        suppressHydrationWarning
                        className={`text-[9px] sm:text-[10px] mt-1.5 text-right ${isUser ? "text-purple-200" : "text-slate-400"
                          }`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>
                  </motion.div>
                );
              })}

              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2.5 items-center text-xs sm:text-sm text-slate-600 bg-white p-3.5 rounded-2xl rounded-tl-xs border border-purple-100 max-w-[85%] sm:max-w-[65%] shadow-xs"
                >
                  <Bot className="h-4 w-4 sm:h-5 sm:w-5 text-[#7C3AED] animate-spin shrink-0" />
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-[#1E1B4B]">Retrieving verified statutory corpus</span>
                    <span className="animate-pulse">...</span>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips (Horizontal Scrollable Strip) */}
            <div className="px-3 pt-2.5 pb-1 bg-white border-t border-purple-50 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-0.5 hidden xs:inline">
                Suggested:
              </span>
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip.query)}
                  disabled={loading}
                  className="shrink-0 text-[11px] font-medium bg-purple-50/80 hover:bg-purple-100 text-purple-700 px-2.5 py-1 rounded-lg border border-purple-200/70 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-2.5 sm:p-4 bg-white border-t border-purple-100 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  selectedDocId
                    ? `Ask grounded in Doc #${selectedDocId}...`
                    : "Ask any legal question (severance, rent, penalty)..."
                }
                className="flex-1 text-xs sm:text-sm bg-purple-50/40 border border-purple-100 rounded-xl sm:rounded-2xl px-3.5 sm:px-4 py-2.5 sm:py-3 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] text-slate-800 placeholder-slate-400"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="btn-primary !py-2.5 sm:!py-3 !px-4 sm:!px-6 !rounded-xl sm:!rounded-2xl !text-xs sm:!text-sm shadow-md inline-flex items-center gap-1.5 sm:gap-2 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Ask</span>
              </button>
            </form>
          </div>

          <div
            className={`lg:col-span-4 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-purple-100/80 shadow-xs space-y-4 h-full overflow-y-auto ${mobileTab === "chat" ? "hidden lg:block" : "block"
              }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1E1B4B]">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Suggested Legal Inquiries</span>
              </div>
              {mobileTab === "topics" && (
                <button
                  onClick={() => setMobileTab("chat")}
                  className="lg:hidden text-xs font-semibold text-[#7C3AED] hover:underline"
                >
                  Back to Chat
                </button>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Click any topic below to automatically run the query through our hybrid retrieval pipeline.
            </p>

            <div className="space-y-4 pt-1">
              {legalCategories.map((cat, idx) => {
                const Icon = cat.icon;
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <div className={`p-1.5 rounded-lg border ${cat.color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span>{cat.title}</span>
                    </div>

                    <div className="space-y-1.5 pl-3 sm:pl-5">
                      {cat.questions.map((q, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => handleSend(q)}
                          className="w-full text-left text-xs text-slate-600 hover:text-[#7C3AED] hover:bg-purple-50/70 p-2 sm:p-2.5 rounded-xl transition border border-transparent hover:border-purple-100 flex items-start gap-1.5 cursor-pointer group"
                        >
                          <ChevronRight className="h-3.5 w-3.5 text-purple-400 group-hover:translate-x-0.5 transition shrink-0 mt-0.5" />
                          <span>{q}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8FF] flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-[#7C3AED] animate-spin" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}

