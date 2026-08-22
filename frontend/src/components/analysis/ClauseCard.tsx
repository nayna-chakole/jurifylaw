"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Shield, AlertTriangle, ShieldAlert } from "lucide-react";

interface RiskResult {
  id: number;
  risk_level: string;
  confidence: number;
}

interface Entity {
  id: number;
  entity_type: string;
  entity_text: string;
}

interface Obligation {
  id: number;
  description: string;
  obligated_party: string;
  due_date: string | null;
}

interface Clause {
  id: number;
  clause_number: string;
  text: string;
  risk_results: RiskResult[];
  entities: Entity[];
  obligations: Obligation[];
}

interface ClauseCardProps {
  clause: Clause;
  index: number;
}

const riskConfig = {
  low: { icon: Shield, color: "text-emerald-400", badge: "badge-safe", label: "SAFE" },
  safe: { icon: Shield, color: "text-emerald-400", badge: "badge-safe", label: "SAFE" },
  medium: { icon: AlertTriangle, color: "text-amber-400", badge: "badge-caution", label: "CAUTION" },
  caution: { icon: AlertTriangle, color: "text-amber-400", badge: "badge-caution", label: "CAUTION" },
  high: { icon: ShieldAlert, color: "text-rose-400", badge: "badge-risky", label: "RISKY" },
  risky: { icon: ShieldAlert, color: "text-rose-400", badge: "badge-risky", label: "RISKY" },
};

export default function ClauseCard({ clause, index }: ClauseCardProps) {
  const [expanded, setExpanded] = useState(false);
  const primaryRisk = clause.risk_results[0];
  const riskLevel = primaryRisk?.risk_level?.toLowerCase() || "low";
  const config = riskConfig[riskLevel as keyof typeof riskConfig] || riskConfig.low;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card-static overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon className={`h-5 w-5 ${config.color} shrink-0`} />
          <div className="min-w-0">
            <p className="text-sm font-medium">
              Clause {clause.clause_number}
            </p>
            <p className="text-xs text-slate-500 truncate max-w-md">
              {clause.text.substring(0, 100)}...
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <span className={`badge ${config.badge}`}>{config.label}</span>
          {primaryRisk && (
            <span className="text-xs text-slate-500">
              {Math.round(primaryRisk.confidence * 100)}%
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 border-t border-white/[0.06]">
              {/* Full text */}
              <div className="mt-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Full Text
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {clause.text}
                </p>
              </div>

              {/* Entities */}
              {clause.entities.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Entities
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {clause.entities.map((entity) => (
                      <span
                        key={entity.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300"
                      >
                        <span className="text-[10px] text-slate-500 uppercase">
                          {entity.entity_type}
                        </span>
                        {entity.entity_text}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Obligations */}
              {clause.obligations.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Obligations
                  </h4>
                  <div className="space-y-2">
                    {clause.obligations.map((ob) => (
                      <div
                        key={ob.id}
                        className="text-sm text-slate-400 flex items-start gap-2"
                      >
                        <span className="text-amber-400 mt-0.5">•</span>
                        <span>
                          <strong className="text-slate-300">{ob.obligated_party}:</strong>{" "}
                          {ob.description}
                          {ob.due_date && (
                            <span className="text-slate-500 ml-1">
                              (Due: {ob.due_date})
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
