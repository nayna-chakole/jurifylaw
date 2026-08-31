"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  X,
  Minimize2,
  Maximize2,
  Scale,
  ShieldCheck,
  BookOpen,
  HelpCircle,
  Copy,
  Check,
  FileText,
  AlertCircle,
  Clock,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { chatAPI } from "@/lib/api";
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

interface LegalChatWidgetProps {
  documentId?: number;
  documentName?: string;
  initialOpen?: boolean;
  floating?: boolean;
}

const suggestedPrompts = [
  "Can my employer terminate me without a notice period?",
  "What is the maximum security deposit a landlord can demand in India?",
  "Are unilateral penalty clauses legally enforceable?",
  "What are the mandatory dispute resolution clauses under Indian law?",
];

export default function LegalChatWidget({
  documentId,
  documentName,
  initialOpen = false,
  floating = true,
}: LegalChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: documentName
        ? `Hello! I'm your JurifyLaw AI Legal Assistant. I'm currently linked to **${documentName}**. Ask me any question about this agreement, key risks, or general Indian legal rights.`
        : "Hello! I am your JurifyLaw AI Assistant powered by Indian Legal Corpus RAG. How can I assist you with legal provisions, contracts, or statutory rights today?",
      timestamp: "Just now",
      mode: documentId ? "document_context" : "rag",
      sources: documentId ? ["Attached Document", "Indian Contract Act 1872"] : ["Constitution of India", "Indian Legal Corpus"],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || query).trim();
    if (!text || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      document_id: documentId,
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery("");
    setLoading(true);

    try {
      const res = await chatAPI.ask(text, documentId);
      const data = res.data;

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "assistant",
        text: data.answer || "I have analyzed your query according to applicable statutory provisions.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: data.sources || [],
        mode: data.mode || "rag",
        elapsed_seconds: data.elapsed_seconds || 0,
        document_id: data.document_id,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: unknown) {
      console.error("Chat error:", err);
      let errMsg = "Unable to connect to the legal assistant. Please verify your connection or try again.";
      if (typeof err === "object" && err !== null && "response" in err) {
        const axiosErr = err as { response?: { data?: { detail?: string } } };
        if (axiosErr.response?.data?.detail) {
          errMsg = axiosErr.response.data.detail;
        }
      }

      const botErrorMsg: Message = {
        id: `bot-err-${Date.now()}`,
        sender: "assistant",
        text: `⚠️ **Error:** ${errMsg}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        mode: "error",
      };
      setMessages((prev) => [...prev, botErrorMsg]);
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

  // Render floating button if not open and floating mode is enabled
  if (floating && !isOpen) {
    return (
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-full shadow-xl shadow-purple-500/30 font-semibold text-sm transition-all border border-purple-300/30 cursor-pointer"
        title="Open JurifyLaw AI Assistant"
      >
        <div className="relative">
          <Sparkles className="h-5 w-5 animate-pulse text-amber-300" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        </div>
        <span>Ask AI Legal Assistant</span>
      </motion.button>
    );
  }

  const containerClasses = floating
    ? `fixed bottom-5 right-5 z-50 bg-white rounded-3xl shadow-2xl border border-purple-100 flex flex-col transition-all overflow-hidden ${
        isExpanded
          ? "w-[92vw] sm:w-[600px] h-[85vh] max-h-[780px]"
          : "w-[92vw] sm:w-[420px] h-[560px]"
      }`
    : "w-full bg-white rounded-3xl shadow-sm border border-purple-100 flex flex-col h-[640px] overflow-hidden";

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1E1B4B] via-[#2E1065] to-[#7C3AED] text-white p-4 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
            <Scale className="h-5 w-5 text-purple-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm leading-tight text-white">JurifyLaw Assistant</h3>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                RAG Online
              </span>
            </div>
            <p className="text-[11px] text-purple-200/80 truncate max-w-[220px]">
              {documentName ? `Context: ${documentName}` : "Grounded Indian Legal Intelligence"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-purple-200">
          {floating && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          )}
          {floating && (
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition"
              title="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Document Banner if linked */}
      {documentId && (
        <div className="bg-purple-50/90 border-b border-purple-100 px-3.5 py-2 flex items-center justify-between text-xs text-[#7C3AED]">
          <div className="flex items-center gap-1.5 font-medium truncate">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Document #{documentId}: {documentName || "Active Contract"}</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 bg-purple-200/60 rounded text-purple-900 font-bold shrink-0">
            Grounding Enabled
          </span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAF8FF]/60">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          const isRAG = msg.mode === "rag" || msg.mode === "document_context";
          const isGeneralFallback = msg.mode === "general_fallback" || msg.mode === "general";

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? "bg-[#7C3AED] text-white"
                    : "bg-gradient-to-br from-[#1E1B4B] to-[#7C3AED] text-white shadow-xs"
                }`}
              >
                {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                  isUser
                    ? "bg-[#7C3AED] text-white rounded-tr-xs shadow-xs"
                    : "bg-white text-slate-800 rounded-tl-xs border border-purple-100 shadow-xs"
                }`}
              >
                <MarkdownRenderer content={msg.text} isUser={isUser} />

                {/* Assistant Metadata (Sources & Mode) */}
                {!isUser && (
                  <div className="mt-3 pt-2.5 border-t border-purple-50 space-y-2 text-xs">
                    {/* Mode Badge */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {isRAG ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200">
                            <ShieldCheck className="h-3 w-3 text-emerald-600" />
                            Verified Legal Corpus
                          </span>
                        ) : isGeneralFallback ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-200">
                            <HelpCircle className="h-3 w-3 text-amber-600" />
                            General Legal Knowledge
                          </span>
                        ) : null}

                        {msg.elapsed_seconds ? (
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" />
                            {msg.elapsed_seconds}s
                          </span>
                        ) : null}
                      </div>

                      {/* Copy Action */}
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="text-slate-400 hover:text-[#7C3AED] transition-colors p-1"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Sources / Acts list */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Legal Citations / Sources:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {msg.sources.map((src, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-[#7C3AED] border border-purple-200/70 text-[11px] font-medium"
                            >
                              <BookOpen className="h-2.5 w-2.5" />
                              {src}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div
                  suppressHydrationWarning
                  className={`text-[10px] mt-1.5 text-right ${
                    isUser ? "text-purple-200" : "text-slate-400"
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Typing indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2.5 items-center text-xs text-slate-500 bg-white p-3 rounded-2xl rounded-tl-xs border border-purple-100 max-w-[70%] shadow-xs"
          >
            <Bot className="h-4 w-4 text-[#7C3AED] animate-bounce" />
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[#1E1B4B]">Retrieving verified law</span>
              <span className="animate-pulse">...</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested quick queries (if 1 or 2 messages) */}
      {messages.length <= 2 && (
        <div className="px-3 py-2 bg-white border-t border-purple-50 shrink-0">
          <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            Suggested Legal Questions:
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {suggestedPrompts.slice(0, 3).map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                className="shrink-0 text-left text-[11px] bg-purple-50/70 hover:bg-purple-100 text-[#7C3AED] px-2.5 py-1 rounded-lg border border-purple-200/50 transition cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-purple-100 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            documentName
              ? "Ask anything about this document or legal rights..."
              : "Ask about Indian contract laws, tenancy, notice periods..."
          }
          className="flex-1 text-xs sm:text-sm bg-purple-50/40 border border-purple-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] text-slate-800 placeholder-slate-400"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="p-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-40 text-white font-medium shadow-sm transition cursor-pointer"
          title="Send query"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
