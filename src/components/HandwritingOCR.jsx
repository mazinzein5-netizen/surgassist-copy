import React, { useRef, useState } from "react";
import { uploadFile } from "@/lib/hiveApi";
import { Camera, Loader2, ScanText, X } from "lucide-react";

export default function HandwritingOCR({ onResult, ocrFunction, label = "Capture Handwritten Notes", description = "Photograph handwritten notes for AI text recognition", disabled = false }) {
  const fileRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [rawText, setRawText] = useState(null);
  const [error, setError] = useState(null);

  const handleCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const uploadResult = await uploadFile(file);
      setImageUrl(uploadResult.file_url);
      const result = await ocrFunction(uploadResult.file_url);
      setRawText(result.raw_text || null);
      if (onResult) onResult(result, uploadResult.file_url);
    } catch {
      setError("Failed to read handwriting. Try a clearer photo or enter data manually.");
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleReset = () => {
    setImageUrl(null);
    setRawText(null);
    setError(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 flex-wrap">
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapture} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading || disabled}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {label}
        </button>
        {imageUrl && (
          <div className="relative">
            <img src={imageUrl} alt="captured" className="w-20 h-20 rounded-lg object-cover border border-border" />
            <button onClick={handleReset} className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      {error && <p className="text-xs text-destructive">{error}</p>}
      {rawText && (
        <div className="bg-background/50 rounded-lg p-3 border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <ScanText className="w-3.5 h-3.5 text-hive-gold" />
            <span className="text-xs font-semibold text-hive-gold">AI Handwriting Recognition</span>
          </div>
          <pre className="text-xs text-foreground whitespace-pre-wrap font-body">{rawText}</pre>
        </div>
      )}
    </div>
  );
}