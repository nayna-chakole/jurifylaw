"use client";

import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";
import { documentsAPI, analysisAPI } from "@/lib/api";

const baseSteps = [
  { label: "Uploading File...", percentage: 25, icon: UploadCloud },
  { label: "Extracting Text & Clauses...", percentage: 50, icon: FileText },
  { label: "AI Neural Risk Scoring...", percentage: 75, icon: Zap },
  { label: "Finalizing Analysis Report...", percentage: 100, icon: Sparkles },
];

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const dynamicTips = [
    "Our AI segments multi-page legal documents into individual enforceable clauses.",
    "Evaluating indemnity, termination, and liability against commercial legal standards.",
    "Extracting named entities, governing jurisdictions, and monetary obligations.",
    "Compiling your risk score and executive summary...",
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      interval = setInterval(() => {
        setCurrentTipIndex((prev) => (prev + 1) % dynamicTips.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing, dynamicTips.length]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 20 * 1024 * 1024) {
        toast.error("File exceeds 20 MB limit");
        return;
      }
      setSelectedFile(file);
      toast.success(`Selected ${file.name}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 20 * 1024 * 1024) {
        toast.error("File exceeds 20 MB limit");
        return;
      }
      setSelectedFile(file);
      toast.success(`Selected ${file.name}`);
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile) {
      toast.error("Please choose a document to analyze");
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("jurify_token") : null;
    if (!token) {
      toast.error("Please log in to analyze documents");
      router.push("/login");
      return;
    }

    setIsAnalyzing(true);
    setCurrentStepIndex(0);

    try {
      // Step 1: Upload the file
      const uploadRes = await documentsAPI.upload(selectedFile);
      const documentId = uploadRes.data.document_id;
      setCurrentStepIndex(1);

      // Step 2: Start analysis task
      await analysisAPI.start(documentId);
      setCurrentStepIndex(2);

      // Step 3: Poll status until complete or failed
      let attempts = 0;
      const maxAttempts = 60; // 90 seconds timeout
      const pollInterval = 1500;

      const pollStatus = async () => {
        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          attempts++;

          try {
            const statusRes = await analysisAPI.status(documentId);
            const status = statusRes.data.status;

            if (status === "COMPLETED") {
              setCurrentStepIndex(3);
              await new Promise((resolve) => setTimeout(resolve, 500));
              toast.success("Analysis complete!");
              router.push(`/analysis/${documentId}`);
              return;
            } else if (status === "FAILED") {
              throw new Error("Document analysis failed on the server.");
            }
          } catch (err: unknown) {
            if (err instanceof Error && err.message.includes("failed")) {
              throw err;
            }
          }
        }
        throw new Error("Analysis is taking longer than expected. Check your documents history.");
      };

      await pollStatus();
    } catch (error: unknown) {
      console.error("Upload/Analysis error:", error);
      let message = "Failed to analyze document";
      if (typeof error === "object" && error !== null && "response" in error) {
        const axiosErr = error as { response?: { data?: { detail?: string } } };
        if (axiosErr.response?.data?.detail) {
          message = axiosErr.response.data.detail;
        }
      } else if (error instanceof Error) {
        message = error.message;
      }
      toast.error(message);
      setIsAnalyzing(false);
      setCurrentStepIndex(0);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-140px)] px-4 py-12 bg-[#FAF8FF]">
      {!isAnalyzing ? (
        /* ── Screen 5: Upload Document Screen ── */
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl"
        >
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-purple-100/80 shadow-lg shadow-purple-500/5 text-center">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] mb-1.5">
                Upload Document
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Upload your legal document to get AI-powered analysis.
              </p>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-purple-200 bg-purple-50/40 hover:bg-purple-50/80 hover:border-purple-400 rounded-3xl p-8 sm:p-10 cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 group mb-6"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="h-16 w-16 rounded-2xl bg-white border border-purple-100 text-[#7C3AED] flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                <UploadCloud className="h-8 w-8" />
              </div>

              <div className="text-base font-bold text-[#1E1B4B]">
                {selectedFile ? selectedFile.name : "Drop PDF or DOCX Here"}
              </div>

              {!selectedFile ? (
                <>
                  <span className="text-xs font-semibold text-slate-400">OR</span>
                  <button
                    type="button"
                    className="btn-primary !py-2 !px-5 !rounded-xl !text-xs"
                  >
                    Choose File
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  <Check className="h-3.5 w-3.5" />
                  <span>Ready for analysis ({Math.round(selectedFile.size / 1024)} KB)</span>
                </div>
              )}
            </div>

            {/* Supported Info Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 pb-6 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Supported Formats:</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> PDF
                </span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> DOCX
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-slate-700">Maximum Size:</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 20 MB
                </span>
              </div>
            </div>

            {/* Analyze Button */}
            <div className="pt-6">
              <button
                type="button"
                onClick={handleStartAnalysis}
                className="btn-primary w-full !py-3.5 !rounded-xl text-sm font-bold shadow-md"
              >
                Analyze Document
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        /* ── Screen 6: Analyzing Your Document (Loading/Progress) ── */
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg"
        >
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-purple-100 shadow-xl shadow-purple-500/5 space-y-8 text-center">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/70 border border-purple-200 text-xs font-semibold text-[#7C3AED] mb-3">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>AI Processing Active</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E1B4B] mb-1.5">
                Analyzing Your Document
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Please wait while our models extract clauses and calculate risk...
              </p>
            </div>

            {/* 4 Stacked Progress Steps */}
            <div className="space-y-4 text-left">
              {baseSteps.map((step, idx) => {
                const Icon = step.icon;
                const isCurrent = idx === currentStepIndex;
                const isPassed = idx <= currentStepIndex;

                return (
                  <div key={step.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2 text-slate-700">
                        <div
                          className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
                            isPassed
                              ? "bg-[#7C3AED] text-white shadow-xs"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {isCurrent ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </div>
                        <span className={isPassed ? "text-[#1E1B4B] font-bold" : "text-slate-500"}>
                          {step.label}
                        </span>
                      </div>
                      <span className="font-mono text-slate-500">
                        {step.percentage}%
                      </span>
                    </div>

                    {/* Purple Progress Bar */}
                    <div className="h-2.5 w-full bg-purple-50 rounded-full overflow-hidden border border-purple-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: isPassed ? `${step.percentage}%` : "0%" }}
                        transition={{ duration: 0.5 }}
                        className="h-full bg-gradient-to-r from-purple-500 to-[#7C3AED] rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dynamic Tip Box */}
            <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs text-slate-600 flex items-center justify-center gap-2 min-h-[50px]">
              <span className="font-semibold text-[#7C3AED]">Insight:</span>
              <span className="animate-fade-in">{dynamicTips[currentTipIndex]}</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
