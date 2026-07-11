import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Send, MessageSquare } from "lucide-react";

export default function CaseChat({ caseId, caseData }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    loadMessages();
  }, [caseId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      const data = await base44.entities.ChatMessage.filter({ case_id: caseId }, "created_date", 100);
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setSending(true);

    const tempUserMsg = { id: "temp-" + Date.now(), role: "user", content: userMsg, created_date: new Date().toISOString() };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      await base44.entities.ChatMessage.create({
        case_id: caseId,
        role: "user",
        content: userMsg,
        message_type: "text",
      });

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a surgical triage assistant. A clinician is discussing a patient case.

PATIENT: ${caseData.patient_name}
MRN: ${caseData.patient_mrn || "N/A"}
DEPARTMENT: ${caseData.department}
PRESENTING COMPLAINT: ${caseData.presenting_complaint || "N/A"}
REFERRAL SUMMARY: ${caseData.referral_summary || "N/A"}

CLINICIAN MESSAGE: ${userMsg}

Provide a concise, clinically appropriate response. Focus on triage, assessment, and management advice.`,
      });

      const aiContent = typeof response === "string" ? response : response.content || JSON.stringify(response);

      const savedAiMsg = await base44.entities.ChatMessage.create({
        case_id: caseId,
        role: "assistant",
        content: aiContent,
        message_type: "text",
      });

      setMessages(prev => [...prev.filter(m => m.id !== tempUserMsg.id), savedAiMsg]);
    } catch (err) {
      console.error(err);
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[400px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 px-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <MessageSquare className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No messages yet. Start the triage conversation.</p>
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-foreground text-background"
                  : "bg-muted text-foreground"
              }`}>
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2">
              <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !sending) handleSend(); }}
          placeholder="Type a message..."
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-foreground text-background disabled:opacity-40 flex-shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}