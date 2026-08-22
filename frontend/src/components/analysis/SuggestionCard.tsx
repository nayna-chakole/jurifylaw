"use client";

import { motion } from "framer-motion";
import { Lightbulb } from "lucide-react";

interface SuggestionCardProps {
  riskSummary: Record<string, unknown> | null;
  clauseCount: number;
  riskyCount: number;
}

export default function SuggestionCard({
  riskSummary,
  clauseCount,
  riskyCount,
}: SuggestionCardProps) {
  const suggestions: string[] = [];

  if (riskyCount > 0) {
    suggestions.push(
      `Review the ${riskyCount} risky clause${riskyCount > 1 ? "s" : ""} carefully before signing.`
    );
    suggestions.push(
      "Consider consulting a legal professional for the high-risk clauses."
    );
  }

  if (clauseCount > 5) {
    suggestions.push(
      "This document contains multiple clauses — ensure each obligation is clearly understood."
    );
  }

  if (riskSummary?.recommendations) {
    const recs = riskSummary.recommendations;
    if (Array.isArray(recs)) {
      suggestions.push(...recs.map(String));
    } else if (typeof recs === "string") {
      suggestions.push(recs);
    }
  }

  if (suggestions.length === 0) {
    suggestions.push(
      "This document appears to have a low risk profile. Standard review is recommended."
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card-static p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Lightbulb className="h-5 w-5 text-amber-400" />
        </div>
        <h2 className="text-lg font-semibold">Suggestions</h2>
      </div>

      <ul className="space-y-3">
        {suggestions.map((suggestion, i) => (
          <li
            key={i}
            className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed"
          >
            <span className="text-amber-400 mt-0.5 shrink-0">💡</span>
            {suggestion}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
