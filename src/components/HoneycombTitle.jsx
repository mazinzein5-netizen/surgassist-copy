import React from "react";

/**
 * A section title bar with a subtle honeycomb hex pattern background.
 * Usage: <HoneycombTitle>Heading Text</HoneycombTitle>
 */
export default function HoneycombTitle({ children, className = "", icon: Icon, iconClassName = "" }) {
  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      {/* Honeycomb pattern background */}
      <div className="absolute inset-0 hex-pattern opacity-60 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-card/80 via-card/40 to-transparent pointer-events-none" />
      {/* Content */}
      <div className="relative flex items-center gap-2 px-4 py-2.5">
        {Icon && <Icon className={`w-4 h-4 ${iconClassName}`} />}
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">{children}</h2>
      </div>
    </div>
  );
}