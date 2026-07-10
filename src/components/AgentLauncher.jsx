import React, { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { X, Send, Loader2, Bot, ChevronDown, ChevronUp } from "lucide-react";

const AGENTS = [
  {
    name: "Clip",
    label: "Clip",
    subtitle: "Super Agent",
    description: "Oversees all cases & workflows",
    color: "text-hive-gold",
    bg: "bg-hive-gold/10 border-hive-gold/30",
    icon: Bot,
  },
  {
    name: "TheBee",
    label: "The Bee",
    subtitle: "Drug Safety",
    description: "Medication & contraindication watchdog",
    color: "text-warning",
    bg: "bg-warning/10 border-warning/30",
    icon: BeeIcon,
  },
];

function BeeIcon({ className = "" }) {
  return (
    <span className={className} role="img" aria-label="bee">🐝</span>
  );
}

export default function AgentLauncher() {
  const [open, setOpen] = useState(false);
  const [activeAgent, setActiveAgent] = useState("Clip");
  const [conversations, setConversations] = useState({});
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [btnPos, setBtnPos] = useState(null);
  const dragRef = useRef(null);

  // Load conversations for the active agent
  const loadConversations = useCallback(async (agentName) => {
    setLoadingConvos(true);
    try {
      const convos = await base44.agents.listConversations({ agent_name: agentName });
      const map = {};
      convos.forEach((c) => { map[c.id] = c; });
      setConversations(map);
      return convos;
    } catch {
      setConversations({});
      return [];
    } finally {
      setLoadingConvos(false);
    }
  }, []);

  // Load conversation when switching agents or opening
  useEffect(() => {
    if (!open) return;
    loadConversations(activeAgent).then((convos) => {
      if (convos && convos.length > 0) {
        setCurrentConversationId(convos[0].id);
        setMessages(convos[0].messages || []);
      } else {
        setCurrentConversationId(null);
        setMessages([]);
      }
    });
  }, [open, activeAgent, loadConversations]);

  // Subscribe to conversation updates
  useEffect(() => {
    if (!currentConversationId) {
      setMessages([]);
      return;
    }
    const unsubscribe = base44.agents.subscribeToConversation(currentConversationId, (data) => {
      setMessages(data.messages || []);
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [currentConversationId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open && expanded) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, expanded]);

  const handleSwitchAgent = (agentName) => {
    setActiveAgent(agentName);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    let convoId = currentConversationId;
    let convo = conversations[convoId];

    // Create new conversation if none exists
    if (!convoId || !convo) {
      try {
        convo = await base44.agents.createConversation({
          agent_name: activeAgent,
          metadata: { name: text.slice(0, 50), description: `${activeAgent} conversation` },
        });
        convoId = convo.id;
        setCurrentConversationId(convoId);
        setConversations((prev) => ({ ...prev, [convoId]: convo }));
      } catch {
        alert("Failed to start conversation.");
        return;
      }
    }

    setInput("");
    setSending(true);
    try {
      await base44.agents.addMessage(convo, { role: "user", content: text });
    } catch {
      alert("Failed to send message.");
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeAgentConfig = AGENTS.find((a) => a.name === activeAgent);
  const ActiveIcon = activeAgentConfig?.icon || Bot;

  const handleBtnPointerDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      btnLeft: rect.left,
      btnTop: rect.top,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleBtnPointerMove = (e) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      d.moved = true;
    }
    if (d.moved) {
      const btn = e.currentTarget;
      const w = btn.offsetWidth;
      const h = btn.offsetHeight;
      let newLeft = Math.max(8, Math.min(window.innerWidth - w - 8, d.btnLeft + dx));
      let newTop = Math.max(8, Math.min(window.innerHeight - h - 8, d.btnTop + dy));
      setBtnPos({ left: newLeft, top: newTop });
    }
  };

  const handleBtnPointerUp = () => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && !d.moved) {
      setOpen(true);
    }
  };

  if (!open) {
    return (
      <button
        onPointerDown={handleBtnPointerDown}
        onPointerMove={handleBtnPointerMove}
        onPointerUp={handleBtnPointerUp}
        style={btnPos ? { left: btnPos.left, top: btnPos.top } : { right: "1.5rem", bottom: "1.5rem" }}
        className="fixed z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-hive-gold text-hive-gold-foreground font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-transform cursor-grab active:cursor-grabbing touch-none select-none"
      >
        <ActiveIcon className="w-5 h-5" />
        <span className="hidden sm:inline">Ask Clip</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col w-[calc(100vw-3rem)] sm:w-96 max-h-[70vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeAgentConfig?.bg} border`}>
            <ActiveIcon className={`w-4 h-4 ${activeAgentConfig?.color}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">{activeAgentConfig?.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{activeAgentConfig?.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {expanded && (
        <>
          {/* Agent Switcher */}
          <div className="flex gap-1 px-3 py-2 border-b border-border bg-background/50">
            {AGENTS.map((agent) => {
              const Icon = agent.icon;
              const isActive = activeAgent === agent.name;
              return (
                <button
                  key={agent.name}
                  onClick={() => handleSwitchAgent(agent.name)}
                  className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? `${agent.bg} ${agent.color} border`
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate">{agent.label}</span>
                </button>
              );
            })}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-3 min-h-[200px]">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <ActiveIcon className={`w-8 h-8 mx-auto mb-2 ${activeAgentConfig?.color}`} />
                <p className="text-sm font-medium text-foreground">{activeAgentConfig?.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{activeAgentConfig?.description}</p>
                <p className="text-xs text-muted-foreground mt-2">Start a conversation below</p>
              </div>
            )}
            {messages.map((msg, idx) => (
              <MessageBubble key={idx} message={msg} agentConfig={activeAgentConfig} />
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span className="text-xs">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3 bg-background/50">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder={`Message ${activeAgentConfig?.label}...`}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50 resize-none scrollbar-thin max-h-24"
                style={{ minHeight: "38px" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="flex-shrink-0 w-9 h-9 rounded-lg bg-hive-gold text-hive-gold-foreground flex items-center justify-center hover:bg-hive-gold/90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MessageBubble({ message, agentConfig }) {
  const isUser = message.role === "user";
  const Icon = agentConfig?.icon || Bot;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex gap-2 max-w-[85%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {!isUser && (
          <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${agentConfig?.bg} border mt-0.5`}>
            <Icon className={`w-3 h-3 ${agentConfig?.color}`} />
          </div>
        )}
        <div className={`px-3 py-2 rounded-lg ${
          isUser
            ? "bg-hive-gold/15 text-foreground border border-hive-gold/20"
            : "bg-secondary text-foreground"
        }`}>
          {message.content && (
            isUser
              ? <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              : <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{message.content}</ReactMarkdown>
          )}
          {message.tool_calls?.map((toolCall, idx) => (
            <ToolCallDisplay key={idx} toolCall={toolCall} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolCallDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);

  const status = toolCall.status;
  const isFailed = status === "failed" || status === "error";
  const isRunning = status === "pending" || status === "running" || status === "in_progress";
  const isDone = status === "completed" || status === "success";

  const projection = toolCall.display_projection || {};
  const hideDetails = projection.hide_details && projection.details_redacted;

  const statusText = isFailed
    ? (projection.error_label || "Failed")
    : isRunning
      ? (projection.active_label || "Working...")
      : (projection.label || "Done");

  let parsedArgs = toolCall.arguments_string;
  try { parsedArgs = JSON.parse(toolCall.arguments_string); } catch {}

  let parsedResults = toolCall.results;
  if (typeof parsedResults === "string") {
    try { parsedResults = JSON.parse(parsedResults); } catch {}
  }

  const formattedName = (toolCall.name || "tool").replace(/_/g, " ");

  if (hideDetails) {
    return (
      <div className="mt-1.5 text-xs text-muted-foreground flex items-center gap-1">
        {isRunning && <Loader2 className="w-3 h-3 animate-spin" />}
        {isDone && "✓"}
        {isFailed && "✕"}
        <span>{statusText}</span>
      </div>
    );
  }

  return (
    <div className="mt-1.5 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
      >
        {isRunning && <Loader2 className="w-3 h-3 animate-spin" />}
        {isDone && <span className="text-success">✓</span>}
        {isFailed && <span className="text-destructive">✕</span>}
        <span className="capitalize">{formattedName}</span>
        <span className="text-muted-foreground/60">— {statusText}</span>
      </button>
      {expanded && (
        <div className="mt-1 space-y-1 pl-4">
          {parsedArgs && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Parameters</p>
              <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap break-all">{JSON.stringify(parsedArgs, null, 2)}</pre>
            </div>
          )}
          {parsedResults !== undefined && parsedResults !== null && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Result</p>
              <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap break-all">
                {typeof parsedResults === "string" ? parsedResults : JSON.stringify(parsedResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}