import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { processReferralChat } from "@/lib/hiveApi";
import { Send, Loader2 } from "lucide-react";

export default function TriageChat({ caseId, caseData }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
  }, [caseId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

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
    if (!input.trim() || sending) return;
    const userMsg = { role: "user", content: input.trim() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setSending(true);

    try {
      await base44.entities.ChatMessage.create({ case_id: caseId, role: "user", content: userMsg.content, message_type: "text" });

      const result = await processReferralChat(newHistory, userMsg.content, [], null);
      const assistantMsg = { role: "assistant", content: result.response };
      setMessages(prev => [...prev, assistantMsg]);

      await base44.entities.ChatMessage.create({ case_id: caseId, role: "assistant", content: result.response, message_type: "text" });
    } catch (err) {
      const errMsg = { role: "assistant", content: "I encountered an error. Please try again." };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No triage conversation recorded for this case.</p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
              msg.role === "user"
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-900"
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-xl px-4 py-2.5">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Continue triage conversation..."
          rows={1}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 resize-none max-h-24"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="p-2.5 rounded-lg bg-gray-800 text-white hover:bg-gray-700 disabled:opacity-40 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}