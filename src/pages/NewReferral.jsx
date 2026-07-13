import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { processReferralChat, uploadFile, transcribeAudio } from "@/lib/hiveApi";
import AIBadge from "@/components/AIBadge";
import RequiredInfoChecklist from "@/components/RequiredInfoChecklist";
import OnCallTeamBar from "@/components/OnCallTeamBar";
import ReferrerDetails from "@/components/ReferrerDetails";
import PatientDetailsBox from "@/components/PatientDetailsBox";
import PatientStatusSelector from "@/components/PatientStatusSelector";
import { Send, Mic, Camera, Loader2, X, CheckCircle2, AlertCircle, Users } from "lucide-react";
import CameraCaptureModal from "@/components/CameraCaptureModal";


export default function NewReferral() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([
  {
    role: "assistant",
    content: "Welcome to HIVE. I'm here to help you document and organize surgical referrals. Please provide the referral details — you can type, dictate, or upload a photo/screenshot of the referral note. I'll extract the key information and ask for anything missing."
  }]
  );
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("text");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [triageResult, setTriageResult] = useState(null);
  const [onCallTeam, setOnCallTeam] = useState(null);
  const [referrerInfo, setReferrerInfo] = useState({});
  const [patientInfo, setPatientInfo] = useState({});
  const [patientStatusInfo, setPatientStatusInfo] = useState({});
  const [patientAutoFilled, setPatientAutoFilled] = useState(false);
  const [referringHospital, setReferringHospital] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [clinicalPhotos, setClinicalPhotos] = useState([]);
  const [audioReferral, setAudioReferral] = useState({ url: null, transcript: "" });
  const expandedRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (expanded) {
      setTimeout(() => {
        expandedRef.current?.focus();
        const len = expandedRef.current?.value?.length || 0;
        expandedRef.current?.setSelectionRange(len, len);
      }, 50);
    }
  }, [expanded]);

  const handleSend = async () => {
    if (!input.trim() && attachments.length === 0 || loading) return;
    const userMessage = { role: "user", content: input.trim() || "[Image attachment uploaded]" };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const result = await processReferralChat(newMessages, userMessage.content, attachments, referrerInfo);
      const assistantMessage = { role: "assistant", content: result.response, requiredInfo: result.required_info };
      setMessages((prev) => [...prev, assistantMessage]);

      // Auto-fill patient details from AI extraction (only fill empty fields — don't overwrite manual edits)
      setPatientInfo((prev) => {
        const merged = { ...prev };
        let changed = false;
        const fields = [
        ["patient_name", result.patient_name],
        ["patient_dob", result.patient_dob],
        ["patient_mrn", result.patient_mrn],
        ["patient_gender", result.patient_gender]];

        for (const [key, val] of fields) {
          if (val && !prev[key]) {
            merged[key] = val;
            changed = true;
          }
        }
        if (changed) setPatientAutoFilled(true);
        return merged;
      });

      if (result.triage_decision && result.triage_decision !== "pending") {
        setTriageResult(result);
      }
      setAttachments([]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "I encountered an error processing that. Please try again or provide the information in a different format." }]);
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
          setAudioReferral({ url: uploadResult.file_url, transcript });
          setInput((prev) => prev + (prev ? " " : "") + transcript);
        } catch (err) {
          setMessages((prev) => [...prev, { role: "assistant", content: "I couldn't process the audio. Please try typing the referral instead." }]);
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
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
    }
  };

  const handlePhotoCapture = (photo) => {
    setClinicalPhotos((prev) => [...prev, photo]);
    setAttachments((prev) => [...prev, photo.photo_url]);
    const dangerCount = photo.danger_alerts?.filter(a => a.severity === "red").length || 0;
    const alertText = dangerCount > 0
      ? ` ⚠ ${dangerCount} RED alert${dangerCount > 1 ? "s" : ""} — review below.`
      : "";
    setMessages((prev) => [...prev, {
      role: "assistant",
      content: `📷 Clinical photo captured — "${photo.label}"\nClassified as: ${photo.detected_type?.replace(/_/g, " ")}\n${photo.summary || ""}${alertText}`
    }]);
  };

  const handleCreateCase = async () => {
    if (!triageResult) return;
    setLoading(true);
    try {
      const mrn = patientInfo.patient_mrn || triageResult.patient_mrn || "";
      let patientId = null;

      // Cloud memory: find or create Patient record by MRN
      if (mrn) {
        try {
          const existingPatients = await base44.entities.Patient.filter({ mrn }, "-created_date", 1);
          if (existingPatients.length > 0) {
            patientId = existingPatients[0].id;
            // Update patient with any new info (patientInfo box takes priority)
            await base44.entities.Patient.update(patientId, {
              name: patientInfo.patient_name || triageResult.patient_name || existingPatients[0].name,
              dob: patientInfo.patient_dob || triageResult.patient_dob || existingPatients[0].dob,
              gender: patientInfo.patient_gender || existingPatients[0].gender,
              hospital: user?.hospital || existingPatients[0].hospital,
              department: triageResult.department || existingPatients[0].department,
              specialty: triageResult.accepting_specialty || existingPatients[0].specialty
            });
          } else {
            const newPatient = await base44.entities.Patient.create({
              name: patientInfo.patient_name || triageResult.patient_name || "Unknown Patient",
              dob: patientInfo.patient_dob || triageResult.patient_dob || null,
              mrn: mrn,
              gender: patientInfo.patient_gender || null,
              hospital: user?.hospital || "",
              department: triageResult.department || user?.department || "orthopaedics",
              specialty: triageResult.accepting_specialty || ""
            });
            patientId = newPatient.id;
          }
        } catch (err) {
          console.error("Patient link error:", err);
        }
      }

      const resolvedDepartment = patientStatusInfo.inpatientDepartment || triageResult.department || user?.department || "orthopaedics";

      const caseData = {
        patient_name: patientInfo.patient_name || triageResult.patient_name || "Unknown Patient",
        patient_dob: patientInfo.patient_dob || triageResult.patient_dob || null,
        patient_mrn: mrn,
        patient_gender: patientInfo.patient_gender || null,
        patient_id: patientId,
        hospital: user?.hospital || "",
        department: resolvedDepartment,
        specialty: patientStatusInfo.inpatientConsultant || triageResult.accepting_specialty || "",
        consultant_name: patientStatusInfo.inpatientConsultant || "",
        patient_status: patientStatusInfo.patientStatus || "",
        status: patientStatusInfo.patientStatus === "inpatient" ? "admitted" : triageResult.triage_decision === "accept" ? "accepted" : triageResult.triage_decision === "decline" ? "declined" : "triage",
        referral_mode: audioReferral.url ? "audio" : (clinicalPhotos.length > 0 ? "camera" : "text"),
        referral_audio_url: audioReferral.url || "",
        referral_transcript: audioReferral.transcript || "",
        patient_seen_at: new Date().toISOString(),
        referral_summary: triageResult.referral_summary || messages.map((m) => m.content).join("\n"),
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
        referring_team: referringHospital || "",
        note_author_name: user?.full_name || "Unknown",
        note_author_grade: user?.clinical_grade || "nchd",
        note_author_imc: user?.imc_number || "",
        note_locked_at: new Date().toISOString()
      };
      const created = await base44.entities.CaseFile.create(caseData);
      for (const msg of messages) {
        await base44.entities.ChatMessage.create({
          case_id: created.id,
          role: msg.role,
          content: msg.content,
          message_type: "text"
        });
      }
      // Save classified clinical photos to the patient record
      for (const photo of clinicalPhotos) {
        await base44.entities.ClinicalPhoto.create({
          case_id: created.id,
          photo_type: photo.detected_type || "other",
          photo_url: photo.photo_url,
          caption: photo.label,
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
            <p className="text-xs text-muted-foreground">Referral documentation assistant — on-call team auto-tagged</p>
          </div>
          <AIBadge />
        </div>
      </div>

      {/* On-Call Team Bar */}
      <div className="px-4 md:px-8 pt-4 max-w-4xl mx-auto w-full">
        <OnCallTeamBar department={user?.department} onTeamChange={setOnCallTeam} onReferringHospitalChange={setReferringHospital} />
      </div>

      {/* Patient Details */}
      <div className="px-4 md:px-8 pt-4 max-w-4xl mx-auto w-full">
        <PatientDetailsBox value={patientInfo} onChange={setPatientInfo} autoFilled={patientAutoFilled} />
      </div>

      {/* Patient Status */}
      <div className="px-4 md:px-8 pt-4 max-w-4xl mx-auto w-full">
        <PatientStatusSelector value={patientStatusInfo} onChange={setPatientStatusInfo} />
      </div>

      {/* Referrer Details */}
      <div className="px-4 md:px-8 pt-4 max-w-4xl mx-auto w-full">
        <ReferrerDetails value={referrerInfo} onChange={setReferrerInfo} />
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 md:px-8 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, i) =>
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              
















            
            </div>
          )}
          {loading &&
          <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-hive-gold" />
                  <span className="text-sm text-muted-foreground">Processing...</span>
                </div>
              </div>
            </div>
          }

          {/* Triage Result */}
          {triageResult &&
          <div className="bg-card border-2 border-hive-gold/30 rounded-2xl p-5 animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-hive-gold" />
                <h3 className="font-bold text-foreground">Intake Decision</h3>
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-3 ${
            triageResult.triage_decision === "accept" ? "bg-success/15 text-success" :
            triageResult.triage_decision === "decline" ? "bg-destructive/15 text-destructive" :
            "bg-warning/15 text-warning"}`
            }>
                <span className="font-bold text-sm uppercase">
                  {triageResult.triage_decision === "accept" && triageResult.accepting_specialty ?
                `Accepted — ${triageResult.accepting_specialty}` :
                triageResult.triage_decision.replace("_", " ")}
                </span>
              </div>
              {triageResult.reasoning &&
            <div className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Assessment Notes</p>
                  <p className="text-sm text-foreground">{triageResult.reasoning}</p>
                </div>
            }
              {triageResult.guideline_used &&
            <div className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Protocol Reference</p>
                  <p className="text-sm text-foreground">{triageResult.guideline_used}</p>
                </div>
            }
              {triageResult.pre_clerking_guidance &&
            <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Intake Guidance</p>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{triageResult.pre_clerking_guidance}</p>
                </div>
            }
              <button
              onClick={handleCreateCase}
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg bg-hive-gold text-hive-gold-foreground font-semibold text-sm hover:bg-hive-gold/90 transition-colors flex items-center justify-center gap-2">
              
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Create Case File & Continue
              </button>
            </div>
          }
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Bar */}
      <div className="border-t border-border px-4 md:px-8 py-4 bg-card/50">
        <div className="max-w-4xl mx-auto">
          {/* Captured photos preview */}
          {clinicalPhotos.length > 0 &&
          <div className="flex gap-2 mb-2 flex-wrap">
              {clinicalPhotos.map((photo, i) =>
            <div key={i} className="relative group">
                  <img src={photo.photo_url} alt={photo.label} className="w-16 h-16 rounded-lg object-cover border border-border" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 rounded-b-lg px-1 py-0.5">
                    <p className="text-[9px] text-white truncate">{photo.label}</p>
                  </div>
                  {photo.danger_alerts?.some(a => a.severity === "red") && (
                    <span className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-destructive border border-white" />
                  )}
                  <button
                    onClick={() => {
                      setClinicalPhotos(prev => prev.filter((_, idx) => idx !== i));
                      setAttachments(prev => prev.filter((_, idx) => idx !== i));
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                </div>
            )}
            </div>
          }

          {/* Input area — Text + Audio + Camera only */}
          <div className="flex items-end gap-2">
            {/* Camera */}
            <button
              onClick={() => setShowCamera(true)}
              disabled={loading}
              className="p-3 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 transition-colors flex-shrink-0 disabled:opacity-50"
              title="Capture clinical photo">
              <Camera className="w-5 h-5" />
            </button>

            {/* Audio */}
            <button
              onClick={recording ? handleStopRecording : handleStartRecording}
              className={`p-3 rounded-lg flex-shrink-0 transition-colors ${recording ? "bg-destructive text-destructive-foreground animate-pulse-gold" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
              title={recording ? "Stop recording" : "Start recording"}>
              {recording ? <div className="w-5 h-5 rounded bg-destructive-foreground" /> : <Mic className="w-5 h-5" />}
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setExpanded(true)}
              placeholder="Type referral details..."
              rows={1}
              className="flex-1 bg-background border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50 resize-none max-h-32" />

            {expanded &&
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              onClick={() => setExpanded(false)}>
              <div
                className="flex flex-col w-full max-w-lg bg-card/90 border border-border rounded-xl shadow-2xl overflow-hidden"
                style={{ height: "min(60vh, 400px)" }}
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-sm font-semibold text-foreground">Referral Details</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpanded(false)}
                      className="px-4 py-1.5 rounded-lg bg-hive-gold text-hive-gold-foreground text-sm font-medium hover:bg-hive-gold/90 transition-colors">
                      Done
                    </button>
                    <button
                      onClick={() => setExpanded(false)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <textarea
                  ref={expandedRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                      setExpanded(false);
                    }
                  }}
                  placeholder="Type referral details..."
                  className="flex-1 w-full bg-transparent border-0 px-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none resize-none" />
              </div>
            </div>
            }

            <button
              onClick={handleSend}
              disabled={loading || !input.trim() && attachments.length === 0}
              className="p-3 rounded-lg bg-hive-gold text-hive-gold-foreground hover:bg-hive-gold/90 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {showCamera && (
        <CameraCaptureModal
          patientInfo={patientInfo}
          onCapture={handlePhotoCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>);

}