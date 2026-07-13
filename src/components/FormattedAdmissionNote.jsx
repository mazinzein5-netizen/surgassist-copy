import React, { useState } from "react";
import { FileText, FlaskConical, ClipboardCheck, Activity, User, Pill, ChevronDown, ChevronRight, AlertTriangle, Zap, ShieldAlert } from "lucide-react";

/**
 * Parses a raw AI-generated admission note into structured sections
 * and renders them with proper clinical document formatting.
 *
 * Detects:
 *  - Section headers (lines ending with ":" or ALL CAPS headers)
 *  - Numbered lists (1. 2. 3.)
 *  - Bullet lists (- or •)
 *  - Key-value pairs (Label: value)
 *  - Plain paragraphs
 */

const SECTION_ICONS = {
  presenting: Activity,
  complaint: Activity,
  history: User,
  examination: Activity,
  investigations: FlaskConical,
  bloods: FlaskConical,
  imaging: FlaskConical,
  plan: ClipboardCheck,
  management: ClipboardCheck,
  medications: Pill,
  medication: Pill,
  immediate: Zap,
  urgent: AlertTriangle,
  red: ShieldAlert,
  flags: ShieldAlert,
  actions: ClipboardCheck
};

const SECTION_LABELS = {
  presenting: "Presenting Complaint",
  complaint: "Presenting Complaint",
  history: "Relevant History",
  examination: "Examination",
  investigations: "Investigations Ordered",
  bloods: "Blood Investigations",
  imaging: "Imaging",
  plan: "Management Plan",
  management: "Management Plan",
  medications: "Medications",
  medication: "Medications",
  immediate: "Immediate Actions",
  urgent: "Urgent Considerations",
  red: "Red Flags",
  flags: "Red Flags",
  actions: "Actions Required"
};

const PRIORITY_SECTIONS = ["immediate", "urgent", "red", "flags", "actions"];

function detectSectionKey(header) {
  const lower = header.toLowerCase();
  for (const key of Object.keys(SECTION_LABELS)) {
    if (lower.includes(key)) return key;
  }
  return null;
}

function parseNote(text) {
  const lines = text.split("\n");
  const sections = [];
  let current = null;

  for (let raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      if (current && current.items.length > 0) {
        // paragraph break — flush current paragraph
        current.items.push({ type: "break" });
      }
      continue;
    }

    // Detect header: line ending with ":" or known header pattern
    const isHeader = /^[A-Z][A-Z\s/&()\-]+$/.test(trimmed) || /:\s*$/.test(trimmed);

    if (isHeader && trimmed.length < 80) {
      const headerText = trimmed.replace(/:\s*$/, "");
      const key = detectSectionKey(headerText);
      // Start new section
      current = {
        key: key || headerText.toLowerCase().replace(/\s+/g, "_"),
        title: headerText,
        items: []
      };
      sections.push(current);
      continue;
    }

    // If no section started, create a default "Overview" section
    if (!current) {
      current = { key: "overview", title: "Admission Note", items: [] };
      sections.push(current);
    }

    // Detect numbered list item
    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      current.items.push({ type: "numbered", num: numberedMatch[1], text: numberedMatch[2] });
      continue;
    }

    // Detect bullet list item
    const bulletMatch = trimmed.match(/^[-•·]\s+(.+)/);
    if (bulletMatch) {
      current.items.push({ type: "bullet", text: bulletMatch[1] });
      continue;
    }

    // Detect sub-item (indented under a list item)
    const subMatch = trimmed.match(/^\s{2,}[a-z]\)\s+(.+)/i);
    if (subMatch) {
      current.items.push({ type: "sub", text: subMatch[1] });
      continue;
    }

    // Detect key-value pair (Label: value) but not a header
    const kvMatch = trimmed.match(/^([A-Za-z][\w\s/\-()]{1,40}):\s+(.+)/);
    if (kvMatch && !trimmed.endsWith(":")) {
      current.items.push({ type: "kv", label: kvMatch[1], value: kvMatch[2] });
      continue;
    }

    // Otherwise it's a paragraph
    current.items.push({ type: "paragraph", text: trimmed });
  }

  return sections;
}

function NoteSection({ section, forceOpen }) {
  const [open, setOpen] = useState(true);
  const isOpen = forceOpen !== undefined ? forceOpen : open;
  const Icon = SECTION_ICONS[section.key] || FileText;
  const label = SECTION_LABELS[section.key] || section.title;
  const isPriority = PRIORITY_SECTIONS.includes(section.key);

  const items = section.items.filter((item, idx) => {
    if (item.type === "break") {
      const next = section.items[idx + 1];
      if (!next || next.type === "break") return false;
    }
    return true;
  });

  if (items.length === 0) return null;

  const containerCls = isPriority ?
  "rounded-lg border border-red-300 bg-red-50 overflow-hidden" :
  "rounded-lg border border-gray-200 bg-white overflow-hidden";
  const headerCls = isPriority ?
  "w-full flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-150 transition-colors" :
  "w-full flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-150 transition-colors";
  const iconCls = isPriority ? "w-3.5 h-3.5 text-red-600 flex-shrink-0" : "w-3.5 h-3.5 text-gray-700 flex-shrink-0";
  const titleCls = isPriority ?
  "text-xs font-bold text-red-700 uppercase tracking-wider flex-1 text-left" :
  "text-xs font-bold text-gray-800 uppercase tracking-wider flex-1 text-left";
  const itemColor = isPriority ? "text-red-800" : "text-gray-900";
  const markerColor = isPriority ? "text-red-600" : "text-gray-600";
  const numColor = isPriority ? "text-red-600" : "text-gray-800";

  return (
    <div className={containerCls}>
      <button onClick={() => setOpen((v) => !v)} className={headerCls}>
        <Icon className={iconCls} />
        <h5 className={titleCls}>{label}</h5>
        <ChevronDown className={isOpen ? "w-3.5 h-3.5 text-gray-500 transition-transform" : "w-3.5 h-3.5 text-gray-500 transition-transform -rotate-90"} />
      </button>
      {isOpen &&
      <div className="px-4 py-3 space-y-1.5">
          {items.map((item, ii) => {
          if (item.type === "numbered") {
            return (
              <div key={ii} className="flex gap-2 text-sm">
                  <span className={numColor + " font-bold flex-shrink-0 min-w-[1.2em]"}>{item.num}.</span>
                  <span className={"flex-1 leading-relaxed " + itemColor}>{item.text}</span>
                </div>);

          }
          if (item.type === "bullet") {
            return (
              <div key={ii} className="flex gap-2 text-sm">
                  <span className={markerColor + " flex-shrink-0 mt-0.5"}>•</span>
                  <span className={"flex-1 leading-relaxed " + itemColor}>{item.text}</span>
                </div>);

          }
          if (item.type === "paragraph") {
            return (
              <p key={ii} className={"text-sm leading-relaxed " + itemColor}>{item.text}</p>);

          }
          if (item.type === "sub") {
            return (
              <div key={ii} className="flex gap-2 text-sm pl-4">
                  <span className="text-gray-500 flex-shrink-0">›</span>
                  <span className="flex-1 text-gray-600">{item.text}</span>
                </div>);

          }
          if (item.type === "kv") {
            return (
              <div key={ii} className={"text-sm " + itemColor}>
                  <span className="font-semibold">{item.label}:</span>{" "}
                  <span className="text-gray-600">{item.value}</span>
                </div>);

          }
          if (item.type === "break") {
            return <div key={ii} className="h-1" />;
          }
          return null;
        })}
        </div>
      }
    </div>);

}

export default function FormattedAdmissionNote({ note }) {
  const [expanded, setExpanded] = useState(true);

  if (!note) return null;

  const sections = parseNote(note);
  if (sections.length === 0) return null;

  // Build a compact summary from the first section's text items
  const summaryParts = [];
  for (const section of sections) {
    for (const item of section.items) {
      if (item.type === "break") continue;
      const text = item.text || item.value || "";
      if (text) summaryParts.push(text);
      if (summaryParts.length >= 2) break;
    }
    if (summaryParts.length >= 2) break;
  }
  const summaryText = summaryParts.join(" · ");
  const hasMultipleSections = sections.length > 1;

  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      {/* Master toggle bar */}
      












      

      {/* Collapsed: compact summary */}
      {!expanded &&
      <div className="px-4 py-2.5">
          
        </div>
      }

      {/* Expanded: full readable document */}
      {expanded &&
      <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto scrollbar-thin bg-white">
          {sections.map((section, si) =>
        <NoteSection key={si} section={section} forceOpen={true} />
        )}
        </div>
      }
    </div>);

}