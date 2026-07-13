import React from "react";
import { ShieldCheck, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function VerificationBadge({ verification, loading }) {
  if (loading) {
    return <div className="w-8 h-8 rounded-full bg-muted/30 animate-pulse" />;
  }

  if (!verification) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-muted-foreground text-[10px] font-bold border border-border flex-shrink-0">
        <ShieldCheck className="w-3 h-3" /> UNVERIFIED
      </span>
    );
  }

  const CONFIG = {
    pending: { label: "Pending", icon: Clock, color: "text-warning bg-warning/10 border-warning/20" },
    ai_approved: { label: "In Review", icon: Clock, color: "text-hive-gold bg-hive-gold/10 border-hive-gold/20" },
    ai_rejected: { label: "Retry", icon: XCircle, color: "text-destructive bg-destructive/10 border-destructive/20" },
    admin_approved: { label: "Verified", icon: CheckCircle2, color: "text-success bg-success/10 border-success/20" },
    admin_rejected: { label: "Rejected", icon: XCircle, color: "text-destructive bg-destructive/10 border-destructive/20" },
  };

  const config = CONFIG[verification.status] || CONFIG.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border flex-shrink-0 ${config.color}`}>
      <Icon className="w-3 h-3" /> {config.label.toUpperCase()}
    </span>
  );
}