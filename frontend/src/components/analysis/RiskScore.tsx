"use client";

import { motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";

interface RiskScoreProps {
  riskSummary: Record<string, unknown> | null;
}

export default function RiskScore({ riskSummary }: RiskScoreProps) {
  // Extract risk percentage from risk_summary
  const overallScore =
    typeof riskSummary?.overall_risk === "number"
      ? riskSummary.overall_risk
      : typeof riskSummary?.risk_score === "number"
      ? riskSummary.risk_score
      : null;

  const score = overallScore !== null ? Math.round(overallScore * 100) / 100 : 0;
  const normalizedScore = score > 1 ? score : Math.round(score * 100);

  const getColor = (s: number) => {
    if (s <= 30) return { stroke: "#10b981", bg: "rgba(16,185,129,0.1)", label: "Low Risk", text: "text-emerald-400" };
    if (s <= 60) return { stroke: "#f59e0b", bg: "rgba(245,158,11,0.1)", label: "Medium Risk", text: "text-amber-400" };
    return { stroke: "#f43f5e", bg: "rgba(244,63,94,0.1)", label: "High Risk", text: "text-rose-400" };
  };

  const color = getColor(normalizedScore);
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card-static p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <ShieldAlert className="h-5 w-5 text-rose-400" />
        </div>
        <h2 className="text-lg font-semibold">Risk Score</h2>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative h-36 w-36 mb-4">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="rgba(148,163,184,0.08)"
              strokeWidth="8"
            />
            <motion.circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={color.stroke}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              style={{ filter: `drop-shadow(0 0 6px ${color.stroke}40)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${color.text}`}>
              {normalizedScore}%
            </span>
          </div>
        </div>
        <span className={`text-sm font-medium ${color.text}`}>{color.label}</span>

        {/* Risk breakdown if available */}
        {riskSummary && (
          <div className="w-full mt-6 pt-4 border-t border-white/[0.06] space-y-2">
            {Object.entries(riskSummary)
              .filter(([key]) => !["overall_risk", "risk_score"].includes(key))
              .slice(0, 5)
              .map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-slate-500 capitalize">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="text-slate-300">{String(value)}</span>
                </div>
              ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
