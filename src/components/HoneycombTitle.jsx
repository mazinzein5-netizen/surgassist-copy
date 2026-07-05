import React from "react";

/**
 * A section title bar with a subtle honeycomb hex pattern background.
 * Usage: <HoneycombTitle>Heading Text</HoneycombTitle>
 */
export default function HoneycombTitle({ children, className = "", icon: Icon, iconClassName = "" }) {
  return (
    <div className={`relative overflow-hidden rounded-lg border border-hive-gold/15 shadow-[inset_0_1px_0_rgba(249,211,66,0.08),0_2px_8px_rgba(0,0,0,0.25)] ${className}`}>
      {/* Deep honeycomb layer — dense, gold-tinted */}
      <div className="absolute inset-0 hex-pattern-dense opacity-70 pointer-events-none" />
      {/* Offset honeycomb layer for parallax 3D depth */}
      <div className="absolute inset-0 hex-pattern opacity-40 pointer-events-none translate-x-1 translate-y-0.5" />
      {/* Gold gradient sweep — left bright to right fade */}
      <div className="absolute inset-0 bg-gradient-to-r from-hive-gold/10 via-hive-gold/5 to-transparent pointer-events-none" />
      {/* Vertical depth gradient — darker bottom for 3D lift */}
      <div className="absolute inset-0 bg-gradient-to-b from-card/40 via-card/60 to-card/90 pointer-events-none" />
      {/* Top highlight line for beveled edge */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-hive-gold/30 to-transparent pointer-events-none" />
      {/* Content */}
      <div className="relative flex items-center gap-2 px-4 py-2.5">
        {Icon && <Icon className={`w-4 h-4 ${iconClassName}`} />}
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">{children}</h2>
      </div>
    </div>
  );
}