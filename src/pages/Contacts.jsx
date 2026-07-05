import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import {
  MessageSquare, Send, ArrowLeft, Loader2, Users, Paperclip, X, Search
} from "lucide-react";

const GRADE_LABELS = { nchd: "NCHD", sho: "SHO", registrar: "Registrar", consultant: "Consultant" };
const DEPT_LABELS = { orthopaedics: "Orthopaedics", general_surgery: "General Surgery" };

export default function Contacts() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sharingNote, setSharingNote] = useState(null);
  const [search, setSearch] = useState("");
  const threadRef = useRef(null);

  // Ensure current user has a StaffProfile
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const existing = await base44.entities.StaffProfile.filter({ user_id: user.id });
        if (existing.length === 0) {
          await base44.entities.StaffProfile.create({
            user_id: user.id,
            full_name: user.full_name || "Unknown",
            grade: user.clinical_grade || "nchd",
            department: user.department || "",
            hospital: user.hospital || "",
          });
        }
      } catch (e) {
        console.error("Profile setup failed:", e);
      }
    })();
  }, [user]);

  // Load data + realtime
  useEffect(() => {
    if (!user) return;
    loadData();
    const unsub = base44.entities.Message.subscribe(() => loadData());
    return unsub;
  }, [user?.id]);

  // Handle pre-fill from ShareCallNote
  useEffect(() => {
    if (location.state?.prefillNote) {
      setSharingNote(location.state);
      setInput(location.state.prefillNote);
      navigate("/contacts", { replace: true, state: {} });
    }
  }, [location.state]);

  // Auto-scroll thread
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, selectedId]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [sent, received, allProfiles] = await Promise.all([
        base44.entities.Message.filter({ sender_id: user.id }, "-created_date", 500),
        base44.entities.Message.filter({ recipient_id: user.id }, "-created_date", 500),
        base44.entities.StaffProfile.list("-created_date", 200),
      ]);
      setMessages(
        [...sent, ...received].sort(
          (a, b) => new Date(a.created_date) - new Date(b.created_date)
        )
      );
      setProfiles(allProfiles.filter((p) => p.user_id !== user.id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Build conversations grouped by partner
  const conversations = useMemo(() => {
    if (!user) return [];
    const map = {};
    for (const msg of messages) {
      const partnerId =
        msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
      if (!map[partnerId]) map[partnerId] = [];
      map[partnerId].push(msg);
    }
    return map;
  }, [messages, user]);

  // Build contact list (all profiles + conversation metadata)
  const contactList = useMemo(() => {
    return profiles
      .map((p) => {
        const conv = conversations[p.user_id] || [];
        const lastMsg = conv[conv.length - 1];
        const unread = conv.filter(
          (m) => m.recipient_id === user?.id && !m.read
        ).length;
        return { ...p, lastMessage: lastMsg, unread };
      })
      .sort((a, b) => {
        if (a.lastMessage && b.lastMessage) {
          return (
            new Date(b.lastMessage.created_date) -
            new Date(a.lastMessage.created_date)
          );
        }
        if (a.lastMessage) return -1;
        if (b.lastMessage) return 1;
        return (a.full_name || "").localeCompare(b.full_name || "");
      });
  }, [profiles, conversations, user]);

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contactList;
    const q = search.toLowerCase();
    return contactList.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(q) ||
        GRADE_LABELS[c.grade]?.toLowerCase().includes(q) ||
        DEPT_LABELS[c.department]?.toLowerCase().includes(q)
    );
  }, [contactList, search]);

  const selectedConv = selectedId ? conversations[selectedId] || [] : [];
  const selectedProfile = profiles.find((p) => p.user_id === selectedId);

  const handleSelectColleague = async (partnerId) => {
    setSelectedId(partnerId);
    // Mark unread messages from this colleague as read
    try {
      await base44.entities.Message.updateMany(
        { recipient_id: user.id, sender_id: partnerId, read: false },
        { $set: { read: true } }
      );
      loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedId) return;
    setSending(true);
    try {
      await base44.entities.Message.create({
        sender_id: user.id,
        sender_name: user.full_name || "Unknown",
        recipient_id: selectedId,
        recipient_name: selectedProfile?.full_name || "Colleague",
        body: input,
        read: false,
        attachment_label: sharingNote?.prefillLabel || "",
        attachment_case_id: sharingNote?.caseId || "",
      });
      setInput("");
      if (sharingNote) setSharingNote(null);
      loadData();
    } catch {
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("en-IE", { day: "numeric", month: "short" });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-border border-t-hive-gold rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-4 md:px-8 py-4 bg-card/50">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <Users className="w-5 h-5 text-hive-gold" />
          <h1 className="text-xl font-bold text-foreground">Contacts & Messaging</h1>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden max-w-6xl mx-auto w-full">
        {/* Contact list */}
        <div
          className={`${
            selectedId ? "hidden md:flex" : "flex"
          } flex-col w-full md:w-80 border-r border-border bg-card/30`}
        >
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search colleagues..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:border-hive-gold/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center">
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {profiles.length === 0
                    ? "No colleagues have joined yet."
                    : "No colleagues match your search."}
                </p>
              </div>
            ) : (
              filteredContacts.map((c) => (
                <button
                  key={c.user_id}
                  onClick={() => handleSelectColleague(c.user_id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 border-b border-border/50 transition-colors text-left ${
                    selectedId === c.user_id
                      ? "bg-hive-gold/10"
                      : "hover:bg-secondary/30"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-hive-gold/20 flex items-center justify-center text-hive-gold font-bold text-sm flex-shrink-0">
                    {c.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {c.full_name}
                      </p>
                      {c.lastMessage && (
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {formatTime(c.lastMessage.created_date)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.lastMessage
                        ? `${c.lastMessage.sender_id === user.id ? "You: " : ""}${c.lastMessage.body}`
                        : `${GRADE_LABELS[c.grade] || ""} · ${DEPT_LABELS[c.department] || ""}`}
                    </p>
                  </div>
                  {c.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-hive-gold text-hive-gold-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {c.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Conversation */}
        <div
          className={`${
            selectedId ? "flex" : "hidden md:flex"
          } flex-col flex-1`}
        >
          {selectedId ? (
            <>
              {/* Conversation header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card/50">
                <button
                  onClick={() => setSelectedId(null)}
                  className="md:hidden p-1 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="w-9 h-9 rounded-full bg-hive-gold/20 flex items-center justify-center text-hive-gold font-bold text-sm">
                  {selectedProfile?.full_name?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {selectedProfile?.full_name || "Colleague"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {GRADE_LABELS[selectedProfile?.grade] || ""} ·{" "}
                    {DEPT_LABELS[selectedProfile?.department] || ""}
                  </p>
                </div>
              </div>

              {/* Sharing banner */}
              {sharingNote && (
                <div className="flex items-center gap-2 px-4 py-2 bg-hive-gold/10 border-b border-hive-gold/30">
                  <Paperclip className="w-3.5 h-3.5 text-hive-gold flex-shrink-0" />
                  <p className="text-xs text-hive-gold flex-1 truncate">
                    Sharing: {sharingNote.prefillLabel}
                  </p>
                  <button
                    onClick={() => {
                      setSharingNote(null);
                      setInput("");
                    }}
                    className="p-0.5 text-hive-gold hover:opacity-70"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Messages */}
              <div
                ref={threadRef}
                className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-2"
              >
                {selectedConv.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No messages yet. Start the conversation.
                    </p>
                  </div>
                ) : (
                  selectedConv.map((msg) => {
                    const isMine = msg.sender_id === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-xl px-3 py-2 ${
                            isMine
                              ? "bg-hive-gold text-hive-gold-foreground"
                              : "bg-secondary text-foreground"
                          }`}
                        >
                          {msg.attachment_label && (
                            <div
                              className={`flex items-center gap-1.5 mb-1 pb-1 border-b ${
                                isMine
                                  ? "border-hive-gold-foreground/20"
                                  : "border-border"
                              }`}
                            >
                              <Paperclip className="w-3 h-3 flex-shrink-0" />
                              <span className="text-xs font-semibold">
                                {msg.attachment_label}
                              </span>
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.body}
                          </p>
                          <p
                            className={`text-[10px] mt-1 ${
                              isMine ? "text-hive-gold-foreground/60" : "text-muted-foreground"
                            }`}
                          >
                            {formatTime(msg.created_date)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input */}
              <div className="border-t border-border p-3 bg-card/50">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    rows={1}
                    placeholder="Type a message..."
                    className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50 resize-none max-h-32"
                    style={{ minHeight: "38px" }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="p-2 rounded-lg bg-hive-gold text-hive-gold-foreground hover:bg-hive-gold/90 disabled:opacity-40 flex-shrink-0"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Select a colleague to start messaging.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}