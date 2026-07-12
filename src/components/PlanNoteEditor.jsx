import React, { useState, useEffect } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";

/**
 * Structured plan editor — each entry has a short-form title and body text.
 * Compiles into a note-style string:
 *   TITLE:
 *   - line 1
 *   - line 2
 *
 * Props:
 *  - value: string (the compiled plan)
 *  - onChange: (string) => void
 */

const DEFAULT_TITLES = ["Immediate", "Ongoing", "Analgesia", "Escalation"];

function parsePlanEntries(text) {
  if (!text || !text.trim()) {
    return DEFAULT_TITLES.map(t => ({ title: t, body: "" }));
  }

  // Try parsing structured format: "TITLE:\nbody"
  const lines = text.split("\n");
  const entries = [];
  let current = null;

  for (const raw of lines) {
    const trimmed = raw.trim();
    // Detect title line: ALL CAPS or Title Case ending with colon, short (< 40 chars)
    const titleMatch = trimmed.match(/^([A-Za-z][\w\s/\-()]{0,38}):\s*$/);
    if (titleMatch && trimmed.length < 45) {
      if (current) entries.push(current);
      current = { title: titleMatch[1].trim(), body: "" };
      continue;
    }
    if (current) {
      current.body += (current.body ? "\n" : "") + raw;
    }
  }
  if (current) entries.push(current);

  // If no structured titles found, wrap whole text in a single "Plan" entry
  if (entries.length === 0) {
    return [{ title: "Plan", body: text }];
  }

  return entries;
}

function compilePlan(entries) {
  return entries
    .filter(e => e.title.trim() || e.body.trim())
    .map(e => {
      const title = e.title.trim() || "Note";
      const body = e.body.trim();
      return `${title.toUpperCase()}:\n${body}`;
    })
    .join("\n\n");
}

export default function PlanNoteEditor({ value, onChange }) {
  const [entries, setEntries] = useState(() => parsePlanEntries(value));

  // Re-parse if external value changes and differs from compiled form
  useEffect(() => {
    const compiled = compilePlan(entries);
    if (value !== compiled) {
      setEntries(parsePlanEntries(value));
    }
  }, [value]);

  const emit = (next) => {
    setEntries(next);
    onChange(compilePlan(next));
  };

  const updateEntry = (idx, field, val) => {
    emit(entries.map((e, i) => i === idx ? { ...e, [field]: val } : e));
  };

  const addEntry = () => {
    emit([...entries, { title: "", body: "" }]);
  };

  const removeEntry = (idx) => {
    emit(entries.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      {entries.map((entry, idx) => (
        <div key={idx} className="rounded-lg border border-border bg-background overflow-hidden">
          {/* Title bar */}
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-secondary/50 border-b border-border">
            <span className="w-1.5 h-1.5 rounded-full bg-hive-gold flex-shrink-0" />
            <input
              type="text"
              value={entry.title}
              onChange={e => updateEntry(idx, "title", e.target.value)}
              placeholder="Short title..."
              maxLength={40}
              className="flex-1 bg-transparent text-xs font-bold text-hive-gold uppercase tracking-wider placeholder:text-muted-foreground/50 focus:outline-none"
            />
            <button
              onClick={() => removeEntry(idx)}
              className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              title="Remove section"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          {/* Body */}
          <textarea
            value={entry.body}
            onChange={e => updateEntry(idx, "body", e.target.value)}
            rows={3}
            placeholder="Enter note content — one item per line..."
            className="w-full bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-y"
          />
        </div>
      ))}

      <button
        onClick={addEntry}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-border text-xs font-medium text-muted-foreground hover:text-hive-gold hover:border-hive-gold/40 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add Note Section
      </button>
    </div>
  );
}