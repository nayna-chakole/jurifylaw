"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";

interface Entity {
  id: number;
  entity_type: string;
  entity_text: string;
  start_position: number;
  end_position: number;
}

interface EntityTableProps {
  entities: Entity[];
}

export default function EntityTable({ entities }: EntityTableProps) {
  if (entities.length === 0) return null;

  // Group by entity type
  const grouped: Record<string, Entity[]> = {};
  entities.forEach((e) => {
    const key = e.entity_type;
    if (!grouped[key]) grouped[key] = [];
    // Deduplicate by text
    if (!grouped[key].some((x) => x.entity_text === e.entity_text)) {
      grouped[key].push(e);
    }
  });

  const typeColors: Record<string, string> = {
    person: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20",
    organization: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    date: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    money: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    location: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    default: "bg-slate-500/10 text-slate-300 border-slate-500/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card-static p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <Users className="h-5 w-5 text-violet-400" />
        </div>
        <h2 className="text-lg font-semibold">Named Entities</h2>
        <span className="text-xs text-slate-500 ml-auto">
          {entities.length} found
        </span>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([type, items]) => (
          <div key={type}>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {type}
            </h4>
            <div className="flex flex-wrap gap-2">
              {items.map((entity) => (
                <span
                  key={entity.id}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    typeColors[type.toLowerCase()] || typeColors.default
                  }`}
                >
                  {entity.entity_text}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
