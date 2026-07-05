import React from "react";

/**
 * A section title bar featuring the HIVE hexagon logo cluster as a large
 * faded decorative element, with a gold gradient sweep and 3D depth.
 * Usage: <HoneycombTitle>Heading Text</HoneycombTitle>
 */
export default function HoneycombTitle({ children, className = "", icon: Icon, iconClassName = "" }) {
  return (
    <div className={`relative overflow-hidden rounded-lg border border-hive-gold/15 bg-card shadow-[inset_0_1px_0_rgba(249,211,66,0.08),0_2px_8px_rgba(0,0,0,0.25)] ${className}`}>
      {/* Gold gradient sweep — left bright to right fade */}
      <div className="absolute inset-0 bg-gradient-to-r from-hive-gold/12 via-hive-gold/4 to-transparent pointer-events-none" />
      {/* Vertical depth gradient — darker bottom for 3D lift */}
      <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-card/50 to-card/90 pointer-events-none" />

      {/* Large faded logo hexagon cluster — decorative, anchored right */}
      <div className="absolute -right-3 -top-2 w-20 h-20 opacity-[0.12] pointer-events-none rotate-6">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <polygon points="22,8 44,20 44,46 22,58 0,46 0,20" fill="#FBC02D" />
          <polygon points="56,8 78,20 78,46 56,58 34,46 34,20" fill="#FBC02D" fillOpacity="0.5" />
          <polygon points="40,42 62,54 62,80 40,92 18,80 18,54" fill="#FBC02D" fillOpacity="0.35" />
          <polygon points="72,42 94,54 94,80 72,92 50,80 50,54" fill="#FBC02D" fillOpacity="0.6" />
          <polygon points="22,20 34,26 34,38 22,44 10,38 10,26" fill="#0D2275" fillOpacity="0.4" />
        </svg>
      </div>

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