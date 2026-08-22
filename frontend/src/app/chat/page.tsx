"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  Send,
  Plus,
  Trash2,
  Bot,
  FileText,
  Sparkles,
  Loader2,
  MessageSquare,
  Scale,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import { chatAPI, documentsAPI } from "@/lib/api";

interface Message {
  id: string | number;
  sender: "user" | "ai";
  text: string;
  time: string;
  sources?: Array<{
    title?: string;
    snippet?: string;
    clause_number?: string;
  }>;
}

interface ChatSessionItem {
  id: number;
  title: string;
  document_id?: number | null;
  created_at: string;
}

interface DocumentItem {
  id: number;
  original_filename: string;
}

function ChatContent() {
  const searchParams = useSearchParams();
  const initialDocId = searchParams.get("document_id")
    ? Number(searchParams.get("document_id"))
    : null;

  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(initialDocId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Load user's uploaded documents for the context dropdown
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await documentsAPI.list(1, 50);
        if (res.data?.items) {
          setDocuments(res.data.items);
        }
      } catch {
        // Fallback for demo mode
      }
    };
    fetchDocs();
  }, []);

  // Load chat sessions
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoadingSessions(true);
        const res = await chatAPI.listSessions();
        if (res.data && res.data.length > 0) {
          setSessions(res.data);
          const matched = initialDocId
            ? res.data.find((s: ChatSessionItem) => s.document_id === initialDocId)
            : res.data[0];

          if (matched) {
            setActiveSessionId(matched.id);
            if (matched.document_id) setSelectedDocId(matched.document_id);
            loadSessionMessages(matched.id);
          } else {
            handleNewChat();
          }
        } else {
          handleNewChat();
        }
      } catch {
        setMessages([
          {
            id: "welcome",
            sender: "ai",
            text: "Hello! I am your JurifyLaw AI legal assistant. Select an uploaded document or ask any question about your contracts.",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchSessions();
  }, [initialDocId]);

  const loadSessionMessages = async (sessionId: number) => {
    try {
      const res = await chatAPI.getSession(sessionId);
      if (res.data?.messages) {
        const formatted: Message[] = res.data.messages.map((m: { id: number; role: string; content: string; created_at: string; sources?: Array<{ title?: string; snippet?: string; clause_number?: string }> }) => ({
          id: m.id,
          sender: m.role === "assistant" ? "ai" : "user",
          text: m.content,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          sources: m.sources,
        }));
        setMessages(formatted);
      }
    } catch (err) {
      console.error("Failed to load session messages:", err);
    }
  };

  const handleSelectSession = (session: ChatSessionItem) => {
    setActiveSessionId(session.id);
    setSelectedDocId(session.document_id || null);
    loadSessionMessages(session.id);
    setMobileDrawerOpen(false);
  };

  const handleNewChat = () => {
    setActiveSessionId(null);
    const activeDocName = documents.find((d) => d.id === selectedDocId)?.original_filename;
    setMessages([
      {
        id: "new-session",
        sender: "ai",
        text: activeDocName
          ? `I'm ready to assist with "${activeDocName}". What specific clauses or obligations would you like to review?`
          : "Hello! Select an uploaded contract from the dropdown or ask any general legal questions.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setMobileDrawerOpen(false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim()) return;

    const question = inputQuestion.trim();
    setInputQuestion("");

    const tempUserMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: question,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsTyping(true);

    try {
      let currentSessionId = activeSessionId;

      if (!currentSessionId) {
        const title = question.slice(0, 35) + (question.length > 35 ? "..." : "");
        const sessionRes = await chatAPI.createSession({
          title,
          document_id: selectedDocId,
        });
        currentSessionId = sessionRes.data.id;
        setActiveSessionId(currentSessionId);
        setSessions((prev) => [sessionRes.data, ...prev]);
      }

      if (!currentSessionId) {
        throw new Error("Unable to create chat session");
      }

      const replyRes = await chatAPI.sendMessage(currentSessionId, question);
      const assistantData = replyRes.data.assistant_message;

      const aiReply: Message = {
        id: assistantData.id || Date.now() + 1,
        sender: "ai",
        text: assistantData.content,
        time: new Date(assistantData.created_at || Date.now()).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        sources: assistantData.sources,
      };

      setMessages((prev) => [...prev, aiReply]);
    } catch (error: unknown) {
      console.error("Chat error:", error);
      let errorMsg = "Could not reach AI assistant. Please check your backend connection.";
      if (typeof error === "object" && error !== null && "response" in error) {
        const axiosErr = error as { response?: { data?: { detail?: string } } };
        if (axiosErr.response?.data?.detail) {
          errorMsg = axiosErr.response.data.detail;
        }
      }
      toast.error(errorMsg);
    } finally {
      setIsTyping(false);
    }
  };

  const selectedDocumentName = documents.find((d) => d.id === selectedDocId)?.original_filename;

  return (
    <div className="bg-[#FAF8FF] h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 h-full min-h-0 relative">
        {/* ── Left Panel (Desktop Persistent / Mobile Drawer) ── */}
        <div
          className={`md:col-span-4 bg-white rounded-3xl p-4 sm:p-5 border border-purple-100/80 shadow-xs flex flex-col justify-between h-full min-h-0 overflow-hidden ${
            mobileDrawerOpen
              ? "fixed inset-3 z-40 md:relative md:inset-auto"
              : "hidden md:flex"
          }`}
        >
          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            {/* Header with Mobile Close */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 md:hidden">
              <span className="font-bold text-sm text-[#1E1B4B]">Chat Workspace</span>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="btn-primary w-full !py-2.5 !rounded-xl !text-xs font-semibold flex items-center justify-center gap-2 shadow-xs"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </button>

            {/* Document Context Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Target Document Context:
              </label>
              <select
                value={selectedDocId || ""}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setSelectedDocId(val);
                  toast.success(val ? "Document context linked" : "Switched to general mode");
                }}
                className="w-full bg-purple-50/60 border border-purple-200 rounded-xl p-2.5 text-xs text-[#1E1B4B] font-medium focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              >
                <option value="">All Documents / General</option>
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    📄 {doc.original_filename}
                  </option>
                ))}
              </select>
            </div>

            {/* Sessions History List */}
            <div className="pt-2">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-1">
                Chat Sessions
              </div>
              {loadingSessions ? (
                <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#7C3AED]" /> Loading...
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-purple-50/30 rounded-2xl border border-purple-100/50">
                  No previous sessions
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map((item) => {
                    const isActive = activeSessionId === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleSelectSession(item)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                          isActive
                            ? "bg-purple-100/70 border-purple-300 shadow-xs"
                            : "bg-purple-50/40 hover:bg-purple-50 border-purple-100/60"
                        }`}
                      >
                        <div className="text-xs font-semibold text-[#1E1B4B] line-clamp-1 flex items-center gap-1.5">
                          <MessageSquare className="h-3.5 w-3.5 text-[#7C3AED] shrink-0" />
                          <span>{item.title}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 pl-5">
                          {new Date(item.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Panel (Chat Thread & Input) ── */}
        <div className="md:col-span-8 bg-white rounded-3xl border border-purple-100/80 shadow-xs flex flex-col justify-between h-full min-h-0 overflow-hidden">
          {/* Header */}
          <div className="px-4 sm:px-6 py-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(true)}
                  className="md:hidden p-1.5 rounded-lg bg-purple-50 text-[#7C3AED] hover:bg-purple-100"
                  aria-label="Open sessions"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <h2 className="text-xs sm:text-base font-bold text-[#1E1B4B] truncate">
                  Legal AI Assistant
                </h2>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 truncate">
                {selectedDocumentName ? `Context: ${selectedDocumentName}` : "General Legal Mode"}
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-emerald-600 bg-emerald-50 px-2 sm:px-2.5 py-1 rounded-full font-medium border border-emerald-100 shrink-0">
              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>RAG Active</span>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-4 min-h-0">
            {messages.map((msg) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-[#7C3AED] text-white flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 shadow-xs">
                      AI
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-xl ${isUser ? "text-right" : "text-left"}`}>
                    <div
                      className={`p-3 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line ${
                        isUser
                          ? "bg-[#7C3AED] text-white rounded-br-none shadow-sm"
                          : "bg-slate-50 text-slate-800 border border-slate-100 rounded-bl-none"
                      }`}
                    >
                      {msg.text}

                      {/* Source clauses citations */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2.5 pt-2.5 border-t border-slate-200 text-[11px] text-slate-600 space-y-1.5 text-left">
                          <div className="font-semibold text-slate-700">Referenced Clauses:</div>
                          {msg.sources.map((src, idx: number) => (
                            <div
                              key={idx}
                              className="bg-white p-2 rounded-xl border border-slate-200 text-slate-700 shadow-xs"
                            >
                              <div className="font-semibold text-[#7C3AED] text-[11px] mb-0.5">
                                {src.title || (src.clause_number ? `Clause ${src.clause_number}` : `Source ${idx + 1}`)}
                              </div>
                              <div className="text-[10px] sm:text-[11px] text-slate-600 font-serif italic">
                                &quot;{src.snippet}&quot;
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-400 mt-1 px-1">
                      {msg.time}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                <Bot className="h-4 w-4 animate-spin text-[#7C3AED]" />
                <span>AI is consulting your contract clauses...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Pinned Input Bar */}
          <div className="p-2.5 sm:p-4 border-t border-slate-100 bg-white shrink-0">
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                placeholder={
                  selectedDocumentName
                    ? `Ask about ${selectedDocumentName}...`
                    : "Type a legal question..."
                }
                className="input-field !py-2 sm:!py-2.5 text-xs sm:text-sm flex-1"
              />
              <button
                type="submit"
                disabled={isTyping || !inputQuestion.trim()}
                className="btn-primary !py-2 sm:!py-2.5 !px-3.5 sm:!px-5 !rounded-xl !text-xs font-semibold flex items-center gap-1 shadow-sm disabled:opacity-50"
                aria-label="Send Message"
              >
                <span className="hidden sm:inline">Send</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#FAF8FF] h-[calc(100vh-64px)] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#7C3AED]" />
        </div>
      }
    >
      <ChatContent />
    </Suspense>
  );
}
