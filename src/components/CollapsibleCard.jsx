import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Enhanced CollapsibleCard with minimized "wedged" view.
 * When collapsed, shows collapsedSummary (if provided) — a compact status line
 * with important info or "waiting" status.
 * Supports controlled mode via open/onOpenChange for programmatic collapse.
 */
export default function CollapsibleCard({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  badge,
  action,
  collapsedSummary,
  open: controlledOpen,
  onOpenChange,
  variant = "default",
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (v) => {
    if (controlledOpen !== undefined) {
      onOpenChange?.(v);
    } else {
      setInternalOpen(v);
    }
  };

  const borderClass = variant === "alert"
    ? "border-red-200 bg-white"
    : variant === "success"
    ? "border-green-200 bg-white"
    : "border-gray-200 bg-white";

  return (
    <div className={`${borderClass} border rounded-xl overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        {Icon && <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
        <h3 className="font-semibold text-gray-900 text-sm flex-1">{title}</h3>
        {badge}
        {action}
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Minimized / wedged summary view — shown only when collapsed */}
      {!open && collapsedSummary && (
        <div className="px-4 pb-3">
          {collapsedSummary}
        </div>
      )}

      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-3">
          {children}
        </div>
      )}
    </div>
  );
}