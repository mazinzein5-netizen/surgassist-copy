import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ChevronUp, ChevronDown, ChevronsDownUp, ChevronsUpDown, Lock } from "lucide-react";

const CollapsibleContext = createContext(null);

export function CollapsibleSections({ children }) {
  const [collapsed, setCollapsed] = useState(new Set());
  const [titles, setTitles] = useState([]);

  const register = useCallback((title) => {
    setTitles((prev) => (prev.includes(title) ? prev : [...prev, title]));
  }, []);

  const unregister = useCallback((title) => {
    setTitles((prev) => prev.filter((t) => t !== title));
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.delete(title);
      return next;
    });
  }, []);

  const toggle = useCallback((title) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }, []);

  const allCollapsed = titles.length > 0 && titles.every((t) => collapsed.has(t));

  const toggleAll = () => {
    setCollapsed(allCollapsed ? new Set() : new Set(titles));
  };

  return (
    <CollapsibleContext.Provider value={{ collapsed, toggle, register, unregister }}>
      {titles.length > 0 && (
        <div className="flex justify-end mb-3">
          <button
            onClick={toggleAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
          >
            {allCollapsed ? <ChevronsUpDown className="w-3.5 h-3.5" /> : <ChevronsDownUp className="w-3.5 h-3.5" />}
            {allCollapsed ? "Expand All" : "Collapse All"}
          </button>
        </div>
      )}
      {children}
    </CollapsibleContext.Provider>
  );
}

export function Section({ title, icon: Icon, children, noteAuthor, noteLockedAt }) {
  const ctx = useContext(CollapsibleContext);
  const [localOpen, setLocalOpen] = useState(true);

  useEffect(() => {
    if (ctx) {
      ctx.register(title);
      return () => ctx.unregister(title);
    }
  }, [title]);

  const isOpen = ctx ? !ctx.collapsed.has(title) : localOpen;

  const handleToggle = () => {
    if (ctx) ctx.toggle(title);
    else setLocalOpen((v) => !v);
  };

  return (
    <div className="bg-card border border-border rounded-xl">
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-secondary/30 transition-colors rounded-t-xl"
      >
        {Icon && <Icon className="w-4 h-4 text-hive-gold flex-shrink-0" />}
        <h3 className="font-semibold text-foreground text-sm flex-1">{title}</h3>
        {(noteAuthor || noteLockedAt) && (
          <span className="text-[10px] text-muted-foreground hidden sm:inline-flex items-center gap-1">
            {noteAuthor && (<><Lock className="w-2.5 h-2.5" />{noteAuthor}</>)}
            {noteLockedAt && <span className="ml-1">· {new Date(noteLockedAt).toLocaleString("en-IE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>}
          </span>
        )}
        {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}