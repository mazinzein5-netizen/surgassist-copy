import React from "react";

/**
 * Parses clinical reasoning / impression text into readable bullet points.
 * Handles: numbered lists, bullet markers (-, •, *), section headers (lines ending with :),
 * and plain paragraph text (splits into sentence-based bullets).
 */
function parseToBullets(text) {
  if (!text || typeof text !== "string") return [];

  const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean);

  // If single paragraph with no list markers, split by sentences
  if (lines.length <= 1) {
    const single = lines[0] || text;
    // Check if it already has bullet/number markers
    if (/^[\-\*•]\s|^d+\.\s/m.test(single)) {
      return parseListItems(single.split(/\n/));
    }
    // Split into sentences — but keep short (avoid splitting on decimals like 1.5)
    const sentences = single
      .replace(/([.!?])\s+(?=[A-Z(])/g, "$1\n")
      .split(/\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    if (sentences.length > 1) {
      return sentences.map(s => ({ type: "bullet", text: s }));
    }
    return [{ type: "paragraph", text: single }];
  }

  return parseListItems(lines);
}

function parseListItems(lines) {
  const items = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    // Strip leading bullet markers: -, *, •, or numbered (1. 2. etc)
    const stripped = line.replace(/^[\-\*•]\s+/, "").replace(/^\d+[\.\)]\s+/, "");

    // Section header — line ends with : and is short
    if (/:$/.test(stripped) && stripped.length < 80) {
      items.push({ type: "header", text: stripped.replace(/:$/, "") });
    } else if (stripped !== line) {
      // Was a list item
      items.push({ type: "bullet", text: cleanInline(stripped) });
    } else {
      items.push({ type: "bullet", text: cleanInline(line) });
    }
  }
  return items;
}

function cleanInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1");
}

export default function ReasoningBullets({ text, className = "" }) {
  const items = parseToBullets(text);

  if (items.length === 0) {
    return <p className={`text-sm text-muted-foreground ${className}`}>—</p>;
  }

  // If only a single paragraph item, render as text
  if (items.length === 1 && items[0].type === "paragraph") {
    return <p className={`text-sm text-foreground whitespace-pre-wrap ${className}`}>{items[0].text}</p>;
  }

  return (
    <div className={className}>
      {items.map((item, i) => {
        if (item.type === "header") {
          return (
            <p key={i} className="text-xs font-bold text-accent uppercase tracking-wider mt-2 mb-1 first:mt-0">
              {item.text}
            </p>
          );
        }
        if (item.type === "paragraph") {
          return <p key={i} className="text-sm text-foreground mb-1">{item.text}</p>;
        }
        return (
          <div key={i} className="flex items-start gap-2 mb-1">
            <span className="text-hive-gold mt-1.5 flex-shrink-0 w-1 h-1 rounded-full bg-hive-gold" />
            <p className="text-sm text-foreground">{item.text}</p>
          </div>
        );
      })}
    </div>
  );
}