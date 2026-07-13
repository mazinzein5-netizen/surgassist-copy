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
      setMessages((prev) => [...prev, assistantMsg]);

      await base44.entities.ChatMessage.create({ case_id: caseId, role: "assistant", content: result.response, message_type: "text" });
    } catch (err) {
      const errMsg = { role: "assistant", content: "I encountered an error. Please try again." };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>);

  }

  return (
    <div className="space-y-3">
      






















      

      <div className="flex items-end gap-2">
        





        
        
        





        
      </div>
    </div>);

}