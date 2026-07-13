import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Pen, Eraser, CheckCircle2, ShieldCheck, Loader2, User, FileSignature, Lock } from "lucide-react";

/**
 * SignaturePad — canvas-based signature capture with biometric metadata.
 * Captures: stroke count, total points, drawing duration, mean velocity.
 */
function SignaturePad({ label, onChange, color = "#1e292b" }) {
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSig, setHasSig] = useState(false);
  const strokesRef = useRef(0);
  const pointsRef = useRef(0);
  const startTimeRef = useRef(null);
  const totalDistanceRef = useRef(0);
  const lastPointRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, [color]);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const start = (e) => {
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setDrawing(true);
    strokesRef.current++;
    if (!startTimeRef.current) startTimeRef.current = Date.now();
    lastPointRef.current = pos;
  };

  const move = (e) => {
    if (!drawing) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    if (lastPointRef.current) {
      const dx = pos.x - lastPointRef.current.x;
      const dy = pos.y - lastPointRef.current.y;
      totalDistanceRef.current += Math.sqrt(dx * dx + dy * dy);
    }
    lastPointRef.current = pos;
    pointsRef.current = (pointsRef.current || 0) + 1;
    if (!hasSig) setHasSig(true);
  };

  const end = () => {
    setDrawing(false);
    lastPointRef.current = null;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
    strokesRef.current = 0;
    pointsRef.current = 0;
    totalDistanceRef.current = 0;
    startTimeRef.current = null;
    onChange?.(null, null);
  };

  const exportSig = () => {
    if (!hasSig) return null;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    const duration = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 0;
    const pointCount = pointsRef.current || 0;
    const distance = totalDistanceRef.current;
    const meanVelocity = duration > 0 ? distance / duration : 0;
    // Simple integrity hash from biometric metadata
    const hashInput = `${strokesRef.current}-${pointCount}-${duration.toFixed(2)}-${distance.toFixed(0)}`;
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      hash = ((hash << 5) - hash) + hashInput.charCodeAt(i);
      hash |= 0;
    }
    return {
      dataUrl,
      biometric: {
        stroke_count: strokesRef.current,
        point_count: pointCount,
        duration_seconds: Math.round(duration * 100) / 100,
        total_distance_px: Math.round(distance),
        mean_velocity_px_s: Math.round(meanVelocity),
        integrity_hash: `SIG-${Math.abs(hash).toString(16).toUpperCase().padStart(8, "0")}`,
      },
    };
  };

  // Expose exportSig to parent via onChange when user stops drawing
  useEffect(() => {
    if (hasSig) {
      const result = exportSig();
      onChange?.(result?.dataUrl, result?.biometric);
    }
  }, [hasSig]);

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>
        {hasSig && (
          <button onClick={clear} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-500">
            <Eraser className="w-3 h-3" /> Clear
          </button>
        )}
      </div>
      <div className="relative rounded-xl border-2 border-dashed border-gray-300 bg-white overflow-hidden" style={{ touchAction: "none" }}>
        <canvas
          ref={canvasRef}
          width={400}
          height={160}
          className="w-full h-40 cursor-crosshair"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
        />
        {!hasSig && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm text-gray-300 flex items-center gap-1.5">
              <Pen className="w-3.5 h-3.5" /> Sign here
            </span>
          </div>
        )}
        <div className="absolute bottom-0 left-4 right-4 border-b border-gray-200" />
      </div>
    </div>
  );
}

export default function DigitalConsentForm({ caseData, user, onUpdate }) {
  const [patientSig, setPatientSig] = useState(null);
  const [patientBiometric, setPatientBiometric] = useState(null);
  const [witnessName, setWitnessName] = useState(user?.full_name || "");
  const [witnessImc, setWitnessImc] = useState(user?.imc_number || "");
  const [witnessSig, setWitnessSig] = useState(null);
  const [witnessBiometric, setWitnessBiometric] = useState(null);
  const [saving, setSaving] = useState(false);
  const [signed, setSigned] = useState(caseData?.consent_signed || false);

  const procedure = caseData?.procedure_name || caseData?.presenting_complaint || caseData?.diagnosis || "the proposed procedure";
  const patientName = caseData?.patient_name || "";
  const mrn = caseData?.patient_mrn || "";
  const dob = caseData?.patient_dob ? new Date(caseData.patient_dob).toLocaleDateString("en-GB") : "";

  const handleSave = async () => {
    if (!patientSig || !witnessSig) {
      alert("Both patient and witness signatures are required.");
      return;
    }
    if (!witnessName || !witnessImc) {
      alert("Witness name and IMC number are required.");
      return;
    }
    setSaving(true);
    try {
      // Upload combined signature image
      const combinedCanvas = document.createElement("canvas");
      combinedCanvas.width = 800;
      combinedCanvas.height = 400;
      const ctx = combinedCanvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, 800, 400);

      // Patient signature
      const pImg = new Image();
      pImg.crossOrigin = "anonymous";
      pImg.src = patientSig;
      await new Promise(r => { pImg.onload = r; });
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.fillStyle = "#374151";
      ctx.fillText("Patient Signature:", 20, 25);
      ctx.drawImage(pImg, 20, 35, 360, 140);

      // Witness signature
      const wImg = new Image();
      wImg.crossOrigin = "anonymous";
      wImg.src = witnessSig;
      await new Promise(r => { wImg.onload = r; });
      ctx.fillText("Witness Signature:", 420, 25);
      ctx.drawImage(wImg, 420, 35, 360, 140);

      // Metadata block
      ctx.font = "11px Inter, sans-serif";
      ctx.fillStyle = "#6b7280";
      ctx.fillText(`Patient: ${patientName}  MRN: ${mrn}  DOB: ${dob}`, 20, 210);
      ctx.fillText(`Procedure: ${procedure}`, 20, 230);
      ctx.fillText(`Witness: ${witnessName}  IMC: ${witnessImc}`, 20, 250);
      ctx.fillText(`Signed: ${new Date().toLocaleString("en-GB")}`, 20, 270);
      ctx.fillText(`Patient biometric hash: ${patientBiometric?.integrity_hash || "N/A"}`, 20, 290);
      ctx.fillText(`Witness biometric hash: ${witnessBiometric?.integrity_hash || "N/A"}`, 20, 310);
      ctx.fillText(`This document constitutes a legally binding digital consent under HSE Consent Policy.`, 20, 340);

      const blob = await new Promise(r => combinedCanvas.toBlob(r, "image/png"));
      const file = new File([blob], `consent_${caseData.id}.png`, { type: "image/png" });
      const uploadResult = await base44.integrations.Core.UploadFile({ file });

      await base44.entities.CaseFile.update(caseData.id, {
        consent_signed: true,
        consent_signature_url: uploadResult.file_url,
        consent_witness_name: witnessName,
        consent_witness_imc: witnessImc,
        consent_signed_at: new Date().toISOString(),
        consent_biometric_hash: `${patientBiometric?.integrity_hash}|${witnessBiometric?.integrity_hash}`,
      });

      setSigned(true);
      onUpdate?.();
    } catch (err) {
      console.error(err);
      alert("Failed to save digital consent.");
    } finally {
      setSaving(false);
    }
  };

  if (signed) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h4 className="font-bold text-green-700 text-sm">Digital Consent Signed & Filed</h4>
            <p className="text-xs text-gray-500">
              Witnessed by {caseData?.consent_witness_name || witnessName} (IMC: {caseData?.consent_witness_imc || witnessImc})
              {caseData?.consent_signed_at && ` · ${new Date(caseData.consent_signed_at).toLocaleString("en-GB")}`}
            </p>
          </div>
        </div>
        {caseData?.consent_signature_url && (
          <img src={caseData.consent_signature_url} alt="Signed consent" className="w-full rounded-lg border border-green-200" />
        )}
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
          <Lock className="w-3 h-3" />
          <span>Biometric hash: {caseData?.consent_biometric_hash || "N/A"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legal consent text */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileSignature className="w-4 h-4 text-indigo-600" />
          <h4 className="font-bold text-gray-900 text-sm">Consent to Treatment</h4>
        </div>
        <div className="text-xs text-gray-600 leading-relaxed space-y-2">
          <p>
            I, <strong>{patientName}</strong>{dob && ` (DOB: ${dob})`}{mrn && `, MRN: ${mrn}`}, hereby give my informed consent to undergo:
          </p>
          <p className="font-semibold text-gray-900 bg-white border border-gray-200 rounded-lg px-3 py-2">{procedure}</p>
          <p>
            I confirm that the nature, purpose, expected benefits, and potential risks of the above procedure have been explained to me in language I understand.
            I have been given the opportunity to ask questions and all have been answered to my satisfaction.
          </p>
          <p>
            I understand that no guarantee has been given that the procedure will cure or improve my condition, and that unforeseen complications may require additional treatment.
            I consent to the administration of anaesthesia as deemed necessary by the anaesthetist, and to any additional procedure that may be immediately necessary for my safety.
          </p>
          <p className="text-gray-500 italic">
            By signing below, I acknowledge that this digital signature, including its biometric data (stroke pattern, timing, and velocity), constitutes a legally binding equivalent to a handwritten signature under the Electronic Commerce Act 2000 and HSE Consent Policy.
          </p>
        </div>
      </div>

      {/* Patient signature */}
      <SignaturePad
        label="Patient Signature"
        onChange={(dataUrl, biometric) => { setPatientSig(dataUrl); setPatientBiometric(biometric); }}
      />

      {/* Witness details */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Witness Name</label>
          <input value={witnessName} onChange={e => setWitnessName(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400" />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Witness IMC Number</label>
          <input value={witnessImc} onChange={e => setWitnessImc(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400" />
        </div>
      </div>

      {/* Witness signature */}
      <SignaturePad
        label="Witness Signature (Clinician)"
        onChange={(dataUrl, biometric) => { setWitnessSig(dataUrl); setWitnessBiometric(biometric); }}
        color="#4f46e5"
      />

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || !patientSig || !witnessSig || !witnessName || !witnessImc}
        className="w-full px-4 py-3 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-40"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
        Lock & File Digital Consent
      </button>
    </div>
  );
}