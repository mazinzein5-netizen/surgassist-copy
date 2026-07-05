import React from "react";

export default function HiveLogo({ size = 40, showText = false, className = "" }) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg viewBox="0 0 100 100" style={{ width: size, height: size }} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Top-left: solid hexagon */}
        <polygon points="22,8 44,20 44,46 22,58 0,46 0,20" fill="#FBC02D" />
        {/* Top-right: translucent overlapping hexagon */}
        <polygon points="56,8 78,20 78,46 56,58 34,46 34,20" fill="#FBC02D" fillOpacity="0.35" />
        {/* Bottom-center-left: translucent hexagon */}
        <polygon points="40,42 62,54 62,80 40,92 18,80 18,54" fill="#FBC02D" fillOpacity="0.25" />
        {/* Bottom-center-right: translucent hexagon */}
        <polygon points="72,42 94,54 94,80 72,92 50,80 50,54" fill="#FBC02D" fillOpacity="0.45" />
        {/* Small inner accent on solid hexagon */}
        <polygon points="22,20 34,26 34,38 22,44 10,38 10,26" fill="#0D2275" fillOpacity="0.3" />
      </svg>
      {showText && (
        <div className="leading-none">
          <div className="text-[9px] font-semibold tracking-[0.22em] text-white/90 uppercase">Health HIVE Ecosystem</div>
          <div className="text-xl font-extrabold text-white tracking-tight">HIVE Surgical Assistant</div>
          <div className="text-[9px] text-hive-gold/70">IbnCeena Ltd.</div>
        </div>
      )}
    </div>
  );
}