import React from "react";
import { Sparkles } from "lucide-react";

export default function AIBadge({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-hive-gold/10 text-hive-gold border border-hive-gold/20 ${className}`}>
      <Sparkles className="w-2.5 h-2.5" />
      AI Suggestion — verify clinically
    </span>
  );
}