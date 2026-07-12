import React, { useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Check, ChevronDown } from "lucide-react";

export default function SelectSheet({ value, options, onChange, placeholder = "Select…", label }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full min-h-[44px] flex items-center justify-between bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
      >
        <span className={selected ? "text-foreground" : "text-muted-foreground"}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader className="text-center">
            <DrawerTitle>{label || "Select an option"}</DrawerTitle>
          </DrawerHeader>
          <div className="px-2 pb-6 overflow-y-auto max-h-[60vh]">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full min-h-[44px] flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-colors ${
                  opt.value === value
                    ? "bg-hive-gold/15 text-hive-gold font-medium"
                    : "text-foreground hover:bg-accent"
                }`}
              >
                {opt.label}
                {opt.value === value && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}