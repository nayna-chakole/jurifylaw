"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";

interface SummaryCardProps {
  summary: string | null;
}

export default function SummaryCard({ summary }: SummaryCardProps) {
  if (!summary) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-static p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <FileText className="h-5 w-5 text-indigo-400" />
        </div>
        <h2 className="text-lg font-semibold">Summary</h2>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
        {summary}
      </p>
    </motion.div>
  );
}
