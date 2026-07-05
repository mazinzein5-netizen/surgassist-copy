import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { processReferralChat, uploadFile, transcribeAudio } from "@/lib/hiveApi";
import AIBadge from "@/components/AIBadge";
import RequiredInfoChecklist from "@/components/RequiredInfoChecklist";
import OnCallTeamBar from "@/components/OnCallTeamBar";
import ReferrerDetails from "@/components/ReferrerDetails";
import { Send, Mic, Camera, FileText, Loader2, X, CheckCircle2, AlertCircle, Users } from "lucide-react";

const INPUT_MODES = [
  { id: "text", label: "Text", icon: FileText },
  { id: "audio", label: "Audio", icon: Mic },
  { id: "screenshot", label: "Screenshot", icon: Camera },
  { id: "camera", label: "Camera", icon: Camera },
];

export default function NewReferral() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Welcome to HIVE Surgical Assistant. I'm here to help you triage surgical referrals. Please provide the referral details — you can type, dictate, or upload a photo/screenshot of the referral note. I'll extract the key information and ask for anything missing.",
    },
  ]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("text");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [triageResult, setTriageResult] = useState(null);
  const [onCallTeam, setOnCallTeam] = useState(null);
  const [referrerInfo, setReferrerInfo] = useState({});
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || loading) return;
    const userMessage = { role: "user", content: input.trim() || "[Image attachment uploaded]" };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const result = await processReferralChat(newMessages, userMessage.content, attachments, referrerInfo);
      const assistantMessage = { role: "assistant", content: result.response, requiredInfo: result.required_info };
      setMessages(prev => [...prev, assistantMessage]);

      if (result.triage_decision && result.triage_decision !== "pending") {
        setTriageResult(result);
      }
      setAttachments([]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "I encountered an error processing that. Please try again or provide the information in a different format." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioFile = new File([audioBlob], "referral.webm", { type: "audio/webm" });
        setLoading(true);
        try {
          const uploadResult = await uploadFile(audioFile);
          const transcript = await transcribeAudio(uploadResult.file_url);
          setInput(prev => prev + (prev ? " " : "") + transcript);
        } catch (err) {
          setMessages(prev => [...prev, { role: "assistant", content: "I couldn't process the audio. Please try typing the referral instead." }]);
        } finally {
          setLoading(false);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (err) {
      alert("Microphone access denied. Please allow microphone access or use text input.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      setRecording(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const uploadResult = await uploadFile(file);
      setAttachments(prev => [...prev, uploadResult.file_url]);
      setMessages(prev => [...prev, { role: "user", content: `[Image uploaded: ${file.name}]` }]);
    } catch (err) {
      alert("Failed to upload file. Please try again.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const handleCreateCase = async () => {
    if (!triageResult) return;
    setLoading(true);
    try {
      const mrn = triageResult.patient_mrn || "";
      let patientId = null;

      // Cloud memory: find or create Patient record by MRN
      if (mrn) {
        try {
          const existingPatients = await base44.entities.Patient.filter({ mrn }, "-created_date", 1);
          if (existingPatients.length > 0) {
            patientId = existingPatients[0].id;
            // Update patient with any new info
            await base44.entities.Patient.update(patientId, {
              name: triageResult.patient_name || existingPatients[0].name,
              dob: triageResult.patient_dob || existingPatients[0].dob,
              hospital: user?.hospital || existingPatients[0].hospital,
              department: triageResult.department || existingPatients[0].department,
              specialty: triageResult.accepting_specialty || existingPatients[0].specialty,
            });
          } else {
            const newPatient = await base44.entities.Patient.create({
              name: triageResult.patient_name || "Unknown Patient",
              dob: triageResult.patient_dob || null,
              mrn: mrn,
              hospital: user?.hospital || "",
              department: triageResult.department || user?.department || "orthopaedics",
              specialty: triageResult.accepting_specialty || "",
            });
            patientId = newPatient.id;
          }
        } catch (err) {
          console.error("Patient link error:", err);
        }
      }

      const caseData = {
        patient_name: triageResult.patient_name || "Unknown Patient",
        patient_dob: triageResult.patient_dob || null,
        patient_mrn: mrn,
        patient_id: patientId,
        hospital: user?.hospital || "",
        department: triageResult.department || user?.department || "orthopaedics",
        specialty: triageResult.accepting_specialty || "",
        status: triageResult.triage_decision === "accept" ? "accepted" : triageResult.triage_decision === "decline" ? "declined" : "triage",
        referral_mode: mode,
        referral_summary: triageResult.referral_summary || messages.map(m => m.content).join("\n"),
        presenting_complaint: triageResult.presenting_complaint || "",
        mechanism_of_injury: triageResult.mechanism_of_injury || "",
        triage_decision: triageResult.triage_decision,
        accepting_specialty: triageResult.accepting_specialty || "",
        triage_reasoning: triageResult.reasoning || "",
        triage_guideline: triageResult.guideline_used || "",
        pre_clerking_guidance: triageResult.pre_clerking_guidance || "",
        on_call_consultant: onCallTeam?.consultant_name || "",
        on_call_registrar: onCallTeam?.registrar_name || "",
        on_call_sho: onCallTeam?.sho_name || "",
        referrer_name: referrerInfo.referrer_name || "",
        referrer_grade: referrerInfo.referrer_grade || "",
        referrer_department: referrerInfo.referrer_department || "",
        referrer_contact: referrerInfo.referrer_contact || "",
      };
      const created = await base44.entities.CaseFile.create(caseData);
      for (const msg of messages) {
        await base44.entities.ChatMessage.create({
          case_id: created.id,
          role: msg.role,
          content: msg.content,
          message_type: "text",
        });
      }
      navigate(`/cases/${created.id}`);
    } catch (err) {
      alert("Failed to create case. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border px-4 md:px-8 py-4 bg-card/50">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <h1 className="text-lg font-bold text-foreground">New Referral</h1>
            <p className="text-xs text-muted-foreground">AI-powered triage & decision support — on-call team auto-tagged</p>
          </div>
          <AIBadge />
        </div>
      </div>

      {/* On-Call Team Bar */}
      <div className="px-4 md:px-8 pt-4 max-w-4xl mx-auto w-full">
        <OnCallTeamBar department={user?.department} onTeamChange={setOnCallTeam} />
      </div>

      {/* Referrer Details */}
      <div className="px-4 md:px-8 pt-4 max-w-4xl mx-auto w-full">
        <ReferrerDetails value={referrerInfo} onChange={setReferrerInfo} />
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 md:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-accent/15 border border-accent/30 text-foreground"
                  : "bg-card border border-border text-foreground"
              }`}>
                {msg.role === "assistant" && (
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 hex-clip bg-hive-gold flex items-center justify-center">
                      <span className="text-[8px] font-bold text-hive-gold-foreground">H</span>
                    </div>
                    <span className="text-[10px] font-semibold text-hive-gold">HIVE Assistant</span>
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.role === "assistant" && msg.requiredInfo && (
                  <RequiredInfoChecklist requiredInfo={msg.requiredInfo} />
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-hive-gold" />
                  <span className="text-sm text-muted-foreground">Processing...</span>
                </div>
              </div>
            </div>
          )}

          {/* Triage Result */}
          {triageResult && (
            <div className="bg-card border-2 border-hive-gold/30 rounded-2xl p-5 animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-hive-gold" />
                <h3 className="font-bold text-foreground">Triage Decision</h3>
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-3 ${
                triageResult.triage_decision === "accept" ? "bg-success/15 text-success" :
                triageResult.triage_decision === "decline" ? "bg-destructive/15 text-destructive" :
                "bg-warning/15 text-warning"
              }`}>
                <span className="font-bold text-sm uppercase">
                  {triageResult.triage_decision === "accept" && triageResult.accepting_specialty
                    ? `Accepted — ${triageResult.accepting_specialty}`
                    : triageResult.triage_decision.replace("_", " ")}
                </span>
              </div>
              {triageResult.reasoning && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Reasoning</p>
                  <p className="text-sm text-foreground">{triageResult.reasoning}</p>
                </div>
              )}
              {triageResult.guideline_used && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Guideline Applied</p>
                  <p className="text-sm text-foreground">{triageResult.guideline_used}</p>
                </div>
              )}
              {triageResult.pre_clerking_guidance && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Pre-Clerking Guidance</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{triageResult.pre_clerking_guidance}</p>
                </div>
              )}
              <button
                onClick={handleCreateCase}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg bg-hive-gold text-hive-gold-foreground font-semibold text-sm hover:bg-hive-gold/90 transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Create Case File & Continue
              </button>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      <div className="border-t border-border px-4 md:px-8 py-4 bg-card/50">
        <div className="max-w-4xl mx-auto">
          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="flex gap-2 mb-2">
              {attachments.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="attachment" className="w-16 h-16 rounded-lg object-cover border border-border" />
                  <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Mode selector */}
          <div className="flex gap-1 mb-2">
            {INPUT_MODES.map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    mode === m.id ? "bg-hive-gold/15 text-hive-gold border border-hive-gold/30" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Input area */}
          <div className="flex items-end gap-2">
            {(mode === "screenshot" || mode === "camera") && (
              <>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileUpload} />
                <button
                  onClick={() => mode === "camera" ? cameraInputRef.current?.click() : fileInputRef.current?.click()}
                  className="p-3 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors flex-shrink-0"
                  title={mode === "camera" ? "Take photo" : "Upload screenshot"}
                >
                  <Camera className="w-5 h-5" />
                </button>
              </>
            )}

            {mode === "audio" && (
              <button
                onClick={recording ? handleStopRecording : handleStartRecording}
                className={`p-3 rounded-lg flex-shrink-0 transition-colors ${recording ? "bg-destructive text-destructive-foreground animate-pulse-gold" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
                title={recording ? "Stop recording" : "Start recording"}
              >
                {recording ? <div className="w-5 h-5 rounded bg-destructive-foreground" /> : <Mic className="w-5 h-5" />}
              </button>
            )}

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type referral details or AI responses..."
              rows={1}
              className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50 resize-none max-h-32"
            />

            <button
              onClick={handleSend}
              disabled={loading || (!input.trim() && attachments.length === 0)}
              className="p-3 rounded-lg bg-hive-gold text-hive-gold-foreground hover:bg-hive-gold/90 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}