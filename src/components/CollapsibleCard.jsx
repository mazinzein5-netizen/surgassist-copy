import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function CollapsibleCard({ title, icon: Icon, children, defaultOpen = false, badge, action }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        {Icon && <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
        <h3 className="font-semibold text-gray-900 text-sm flex-1">{title}</h3>
        {badge}
        {action}
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-5 pb-5 border-t border-gray-100 pt-4">{children}</div>}
    </div>
  );
}