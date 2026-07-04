import React from "react";
import HiveLogo from "./HiveLogo";

export default function AuthLayout({ title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center hex-pattern bg-background px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <HiveLogo size={64} showText />
          </div>
          <div className="inline-block px-4 py-1 rounded-full bg-hive-gold/10 border border-hive-gold/20 mb-4">
            <span className="text-xs font-semibold tracking-wider text-hive-gold uppercase">Surgical Assistant</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>}
        </div>
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-xl border border-border p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
        <p className="text-center text-[10px] text-muted-foreground/60 mt-8">
          AI Decision Support — Verify All Output Clinically
        </p>
      </div>
    </div>
  );
}