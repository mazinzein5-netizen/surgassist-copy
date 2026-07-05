import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { exportTextToPDF } from "@/lib/pdfExport";
import { Loader2, Send, Printer, Download, RefreshCw, MessageCircle, Send as TelegramIcon, Radio, Activity, Database } from "lucide-react";

const SERVICES = [
  { id: "email", label: "Email", icon: Send },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "telegram", label: "Telegram", icon: TelegramIcon },
  { id: "signal", label: "Signal", icon: Radio },
  { id: "pathpoint", label: "Pathpoint", icon: Activity },
  { id: "silo", label: "Silo", icon: Database },
];

export default function ShareNoteButtons({ note, patientName, onRegenerate, generating, title = "Admission Note" }) {
  const [sending, setSending] = useState(null);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  };

  const handleShare = async (service) => {
    setSending(service);
    const truncated = note.length > 4000 ? note.slice(0, 4000) + "\n[...truncated]" : note;
    const subject = `HIVE — ${title} — ${patientName}`;

    try {
      switch (service) {
        case "email": {
          const email = prompt("Enter email address:");
          if (!email) break;
          await base44.integrations.Core.SendEmail({ to: email, subject, body: note });
          alert("Email sent successfully.");
          break;
        }
        case "whatsapp": {
          const ok = await copyToClipboard(note);
          window.open(`https://wa.me/?text=${encodeURIComponent(truncated)}`, "_blank");
          if (ok) alert("Note copied to clipboard and WhatsApp opened. Paste if needed.");
          break;
        }
        case "telegram": {
          const ok = await copyToClipboard(note);
          window.open(`https://t.me/share/url?url=${encodeURIComponent("https://hive.app")}&text=${encodeURIComponent(truncated)}`, "_blank");
          if (ok) alert("Note copied to clipboard and Telegram opened. Paste if needed.");
          break;
        }
        case "signal": {
          const ok = await copyToClipboard(note);
          window.open(`https://signal.me/`, "_blank");
          alert(ok ? "Note copied to clipboard. Paste into Signal." : "Open Signal and paste the note.");
          break;
        }
        case "pathpoint": {
          const ok = await copyToClipboard(note);
          alert(ok ? "Note copied to clipboard. Open Pathpoint and paste." : "Copy failed. Please copy manually.");
          break;
        }
        case "silo": {
          const ok = await copyToClipboard(note);
          alert(ok ? "Note copied to clipboard. Open Silo and paste." : "Copy failed. Please copy manually.");
          break;
        }
      }
    } catch {
      alert(`Failed to share via ${service}.`);
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {onRegenerate && (
        <button onClick={onRegenerate} disabled={generating} title="Re-generate" className="p-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </button>
      )}
      <button onClick={() => window.print()} title="Print" className="p-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80">
        <Printer className="w-4 h-4" />
      </button>
      <button onClick={() => exportTextToPDF(title, note, patientName)} title="Download PDF" className="p-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80">
        <Download className="w-4 h-4" />
      </button>
      {SERVICES.map(svc => {
        const Icon = svc.icon;
        const isLoading = sending === svc.id;
        return (
          <button
            key={svc.id}
            onClick={() => handleShare(svc.id)}
            disabled={isLoading}
            title={svc.label}
            className="p-1.5 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 flex items-center gap-1.5"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
          </button>
        );
      })}
    </div>
  );
}