import React from "react";
import { FileText, FlaskConical, ClipboardCheck, Activity, User, Pill } from "lucide-react";

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
  examination: Stethoscope,
  investigations: FlaskConical,
  bloods: FlaskConical,
  imaging: FlaskConical,
  plan: ClipboardCheck,
  management: ClipboardCheck,
  medications: Pill,
  medication: Pill,
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
};

function Stethoscope(props) {
  // Re-export to avoid extra import if not used
  return <Activity {...props} />;
}

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
        items: [],
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

export default function FormattedAdmissionNote({ note }) {
  if (!note) return null;

  const sections = parseNote(note);

  return (
    <div className="space-y-4">
      {sections.map((section, si) => {
        const Icon = SECTION_ICONS[section.key] || FileText;
        const label = SECTION_LABELS[section.key] || section.title;

        // Filter out break-only trailing items
        const items = section.items.filter((item, idx) => {
          if (item.type === "break") {
            const next = section.items[idx + 1];
            if (!next || next.type === "break") return false;
          }
          return true;
        });

        return (
          <div key={si} className="border-l-2 border-hive-gold/30 pl-3">
            {/* Section header */}
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-3.5 h-3.5 text-hive-gold flex-shrink-0" />
              <h5 className="text-xs font-bold text-hive-gold uppercase tracking-wider">{label}</h5>
            </div>

            {/* Section content */}
            <div className="space-y-1.5 pl-5">
              {items.map((item, ii) => {
                switch (item.type) {
                  case "numbered":
                    return (
                      <div key={ii} className="flex gap-2 text-sm text-foreground">
                        <span className="text-hive-gold font-bold flex-shrink-0 min-w-[1.2em]">{item.num}.</span>
                        <span className="flex-1 leading-relaxed">{item.text}</span>
                      </div>
                    );
                  case "bullet":
                    return (
                      <div key={ii} className="flex gap-2 text-sm text-foreground">
                        <span className="text-accent flex-shrink-0 mt-0.5">•</span>
                        <span className="flex-1 leading-relaxed">{item.text}</span>
                      </div>
                    );
                  case "sub":
                    return (
                      <div key={ii} className="flex gap-2 text-sm text-muted-foreground pl-4">
                        <span className="text-muted-foreground flex-shrink-0">›</span>
                        <span className="flex-1">{item.text}</span>
                      </div>
                    );
                  case "kv":
                    return (
                      <div key={ii} className="text-sm text-foreground">
                        <span className="font-semibold text-foreground">{item.label}:</span>{" "}
                        <span className="text-muted-foreground">{item.value}</span>
                      </div>
                    );
                  case "paragraph":
                    return (
                      <p key={ii} className="text-sm text-foreground leading-relaxed">{item.text}</p>
                    );
                  case "break":
                    return <div key={ii} className="h-1" />;
                  default:
                    return null;
                }
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}