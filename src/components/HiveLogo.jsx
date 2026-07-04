import React from "react";

export default function HiveLogo({ size = 40, showText = false, className = "" }) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <svg viewBox="0 0 100 100" style={{ width: size, height: size }} fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,4 84,23 84,62 50,81 16,62 16,23" fill="#F9D342" fillOpacity="0.95" />
        <polygon points="50,4 84,23 84,62 50,81 16,62 16,23" stroke="#D99C25" strokeWidth="2" />
        <polygon points="50,20 70,31 70,54 50,65 30,54 30,31" fill="#132482" />
        <polygon points="50,28 64,35 64,50 50,57 36,50 36,35" fill="#F9D342" fillOpacity="0.9" />
        <polygon points="50,81 84,62 84,77 50,96 16,77 16,62" fill="#D99C25" fillOpacity="0.4" />
      </svg>
      {showText && (
        <div className="leading-none">
          <div className="text-[10px] font-semibold tracking-[0.2em] text-hive-gold/80 uppercase">Health HIVE</div>
          <div className="text-xl font-extrabold text-white tracking-tight">HIVE</div>
          <div className="text-[9px] text-muted-foreground">IbnCeena Ltd.</div>
        </div>
      )}
    </div>
  );
}