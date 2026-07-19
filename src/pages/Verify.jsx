import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { ChevronLeft, Loader2, Upload, Camera, ShieldCheck, AlertTriangle, CheckCircle2, User, FileCheck, RefreshCw } from "lucide-react";

export default function Verify() {
  const navigate = useNavigate();
  const { user, checkUserAuth } = useAuth();
  const [idPhoto, setIdPhoto] = useState(null);
  const [selfiePhoto, setSelfiePhoto] = useState(null);
  const [idUrl, setIdUrl] = useState(null);
  const [selfieUrl, setSelfieUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const idInputRef = useRef(null);
  const selfieInputRef = useRef(null);

  const handleIdUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIdPhoto(URL.createObjectURL(file));
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setIdUrl(res.file_url);
    } catch {
      alert("Failed to upload ID photo. Please try again.");
      setIdPhoto(null);
    }
  };

  const handleSelfieUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelfiePhoto(URL.createObjectURL(file));
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      setSelfieUrl(res.file_url);
    } catch {
      alert("Failed to upload selfie. Please try again.");
      setSelfiePhoto(null);
    }
  };

  const handleSubmit = async () => {
    if (!idUrl || !selfieUrl) return;
    setSubmitting(true);
    setResult(null);
    try {
      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an identity verification assistant. Compare the face in the selfie photo with the face on the photo ID document. Determine if they are the same person.\n\nRespond with whether the faces match, a confidence level (high/medium/low), and brief notes about your assessment (e.g. lighting, angle, visible features). If you cannot detect a face in either image, respond with match=false and confidence=low.`,
        file_urls: [idUrl, selfieUrl],
        response_json_schema: {
          type: "object",
          properties: {
            match: { type: "boolean" },
            confidence: { type: "string", enum: ["high", "medium", "low"] },
            notes: { type: "string" }
          }
        }
      });

      const status = aiResponse.match ? "ai_approved" : "ai_rejected";

      const verification = await base44.entities.Verification.create({
        user_id: user?.id || "",
        user_name: user?.full_name || "Unknown",
        user_email: user?.email || "",
        id_photo_url: idUrl,
        selfie_photo_url: selfieUrl,
        ai_match: aiResponse.match,
        ai_confidence: aiResponse.confidence,
        ai_notes: aiResponse.notes || "",
        status: status,
      });

      setResult({ ...aiResponse, status, verificationId: verification.id });

      if (aiResponse.match) {
        await base44.auth.updateMe({ verification_status: "pending_admin" });
        await checkUserAuth();
      }
    } catch {
      alert("Verification failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setIdPhoto(null);
    setSelfiePhoto(null);
    setIdUrl(null);
    setSelfieUrl(null);
    setResult(null);
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="sticky top-0 z-30 -mx-4 md:-mx-8 px-4 md:px-8 py-3 bg-background/95 backdrop-blur border-b border-border mb-4">
        <button onClick={() => navigate("/profile")} className="flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary -ml-1">
          <ChevronLeft className="w-6 h-6" /> Profile
        </button>
      </div>

      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-hive-gold" /> Verify Your Identity
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Upload a photo ID and take a selfie. We'll confirm your identity to keep HIVE secure.
        </p>
      </div>

      {result ? (
        <ResultCard result={result} onReset={handleReset} />
      ) : (
        <div className="space-y-4">
          {/* Step 1: Photo ID */}
          <UploadCard
            step={1}
            icon={FileCheck}
            title="Photo ID"
            description="Driver's license, passport, or national ID"
            photo={idPhoto}
            inputRef={idInputRef}
            onUpload={handleIdUpload}
            uploaded={!!idUrl}
          />

          {/* Step 2: Selfie */}
          <UploadCard
            step={2}
            icon={User}
            title="Selfie"
            description="Take a clear photo of your face"
            photo={selfiePhoto}
            inputRef={selfieInputRef}
            onUpload={handleSelfieUpload}
            uploaded={!!selfieUrl}
            capture="user"
          />

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!idUrl || !selfieUrl || submitting}
            className="w-full px-4 py-3 rounded-lg bg-hive-gold text-hive-gold-foreground font-semibold text-sm hover:bg-hive-gold/90 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {submitting ? "Verifying..." : "Verify Identity"}
          </button>
        </div>
      )}
    </div>
  );
}

function UploadCard({ step, icon: Icon, title, description, photo, inputRef, onUpload, uploaded, capture }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${uploaded ? "bg-success/15 text-success" : "bg-hive-gold/15 text-hive-gold"}`}>
          {uploaded ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs font-bold">{step}</span>}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Icon className="w-3.5 h-3.5" /> {title}
          </h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      {photo ? (
        <div className="relative">
          <img src={photo} alt={title} className="w-full max-h-64 object-contain rounded-lg border border-border bg-muted/20" />
          <button
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 px-3 py-1.5 rounded-lg bg-background/90 border border-border text-xs font-medium text-foreground hover:bg-background"
          >
            Retake
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-border rounded-lg py-8 flex flex-col items-center gap-2 hover:border-hive-gold/40 hover:bg-hive-gold/5 transition-colors"
        >
          <Camera className="w-6 h-6 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Tap to upload</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" capture={capture} className="hidden" onChange={onUpload} />
    </div>
  );
}

function ResultCard({ result, onReset }) {
  const isApproved = result.status === "ai_approved";

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className={`flex items-center gap-3 p-4 rounded-lg ${isApproved ? "bg-success/10 border border-success/20" : "bg-destructive/10 border border-destructive/20"}`}>
        {isApproved ? <CheckCircle2 className="w-6 h-6 text-success" /> : <AlertTriangle className="w-6 h-6 text-destructive" />}
        <div>
          <h3 className={`font-bold ${isApproved ? "text-success" : "text-destructive"}`}>
            {isApproved ? "Identity Confirmed" : "Verification Failed"}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isApproved
              ? "Your photos match. An admin will confirm your verification shortly."
              : "We couldn't confirm a match. Please try again with clearer photos."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/20 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">Confidence</p>
          <p className="text-sm font-medium text-foreground capitalize mt-0.5">{result.confidence}</p>
        </div>
        <div className="bg-muted/20 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase">Match</p>
          <p className="text-sm font-medium text-foreground mt-0.5">{result.match ? "Yes" : "No"}</p>
        </div>
      </div>

      {result.notes && (
        <div className="bg-muted/20 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Assessment</p>
          <p className="text-sm text-foreground">{result.notes}</p>
        </div>
      )}

      {!isApproved && (
        <button
          onClick={onReset}
          className="w-full px-4 py-2.5 rounded-lg bg-hive-gold text-hive-gold-foreground font-semibold text-sm hover:bg-hive-gold/90 flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      )}
    </div>
  );
}