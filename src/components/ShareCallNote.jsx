import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { buildCallNoteText } from "@/lib/callNoteUtils";
import { Share2, Mail, MessageCircle, Copy, Users, Loader2, ChevronDown } from "lucide-react";

export default function ShareCallNote({ caseData, patientName }) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(null);
  const navigate = useNavigate();

  const noteText = buildCallNoteText(caseData);
  const subject = `HIVE Call Note — ${patientName || caseData.patient_name || "Unknown"}`;

  const handleEmail = async () => {
    const email = prompt("Enter email address:");
    if (!email) return;
    setSending("email");
    try {
      await base44.integrations.Core.SendEmail({ to: email, subject, body: noteText });
      alert("Call note emailed successfully.");
    } catch {
      alert("Failed to send email.");
    } finally {
      setSending(null);
      setOpen(false);
    }
  };

  const handleWhatsApp = () => {
    const truncated = noteText.length > 4000 ? noteText.slice(0, 4000) + "\n[...truncated]" : noteText;
    window.open(`https://wa.me/?text=${encodeURIComponent(truncated)}`, "_blank");
    setOpen(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(noteText);
      alert("Call note copied to clipboard.");
    } catch {
      alert("Failed to copy.");
    } finally {
      setOpen(false);
    }
  };

  const handleColleague = () => {
    navigate("/contacts", {
      state: {
        prefillNote: noteText,
        prefillLabel: `Call Note — ${patientName || caseData.patient_name || "Unknown"}`,
        caseId: caseData.id,
      },
    });
    setOpen(false);
  };

  const options = [
    { id: "email", label: "Email", icon: Mail, onClick: handleEmail },
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, onClick: handleWhatsApp },
    { id: "copy", label: "Copy to Clipboard", icon: Copy, onClick: handleCopy },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-hive-gold text-hive-gold-foreground text-xs font-semibold hover:bg-hive-gold/90 transition-colors"
      >
        <Share2 className="w-3.5 h-3.5" />
        Share
        <ChevronDown className="w-3 h-3 opacity-70" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-40 w-52 bg-popover border border-border rounded-lg shadow-xl py-1 animate-fade-in">
            {options.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  onClick={opt.onClick}
                  disabled={sending === opt.id}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                >
                  {sending === opt.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4 text-muted-foreground" />}
                  {opt.label}
                </button>
              );
            })}
            <div className="border-t border-border my-1" />
            <button
              onClick={handleColleague}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
            >
              <Users className="w-4 h-4 text-hive-gold" />
              Send to HIVE Colleague
            </button>
          </div>
        </>
      )}
    </div>
  );
}