import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2, Plus, FlaskConical, Activity, TrendingUp, TrendingDown, Minus, Trash2, Clock } from "lucide-react";

const LAB_LABELS = {
  haemoglobin: { label: "Hb", unit: "g/L", low: 120, high: 160 },
  wcc: { label: "WCC", unit: "x10⁹/L", low: 4, high: 11 },
  platelets: { label: "Plt", unit: "x10⁹/L", low: 150, high: 400 },
  sodium: { label: "Na", unit: "mmol/L", low: 135, high: 145 },
  potassium: { label: "K", unit: "mmol/L", low: 3.5, high: 5.0 },
  urea: { label: "Urea", unit: "mmol/L", low: 2.5, high: 7.0 },
  creatinine: { label: "Creat", unit: "µmol/L", low: 60, high: 110 },
  crp: { label: "CRP", unit: "mg/L", low: 0, high: 5 },
  egfr: { label: "eGFR", unit: "mL/min", low: 90, high: 999 },
  bilirubin: { label: "Bili", unit: "µmol/L", low: 0, high: 21 },
  alt: { label: "ALT", unit: "IU/L", low: 0, high: 40 },
  albumin: { label: "Alb", unit: "g/L", low: 35, high: 50 },
  inr: { label: "INR", unit: "", low: 0.8, high: 1.2 },
};

function getTrend(results) {
  if (results.length < 2) return null;
  const latest = results[0].value;
  const prev = results[1].value;
  if (latest > prev) return "up";
  if (latest < prev) return "down";
  return "flat";
}

function isAbnormal(testType, value) {
  const ref = LAB_LABELS[testType];
  if (!ref) return false;
  return value < ref.low || value > ref.high;
}

const UPDATE_TYPES = [
  { value: "clinical_review", label: "Clinical Review", icon: Activity, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "lab_result", label: "Lab Result", icon: FlaskConical, color: "text-purple-600 bg-purple-50 border-purple-200" },
  { value: "imaging", label: "Imaging", icon: TrendingUp, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { value: "medication", label: "Medication Change", icon: Plus, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { value: "general", label: "General Update", icon: Clock, color: "text-gray-600 bg-gray-50 border-gray-200" },
];

export default function ProgressTimeline({ caseData, caseId, onUpdate }) {
  const { user } = useAuth();
  const [labResults, setLabResults] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    update_type: "clinical_review",
    heading: "",
    content: "",
  });

  useEffect(() => {
    loadAll();
  }, [caseId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const labs = await base44.entities.LabResult.filter({ case_id: caseId }, "-collected_at", 100);
      setLabResults(labs);
      const caseNotes = await base44.entities.CaseNote.filter({ case_id: caseId }, "-created_date", 100);
      setNotes(caseNotes);
    } catch {}
    finally { setLoading(false); }
  };

  const labsByType = labResults.reduce((acc, lab) => {
    if (!acc[lab.test_type]) acc[lab.test_type] = [];
    acc[lab.test_type].push(lab);
    return acc;
  }, {});

  // Build timeline entries from labs + notes
  const timeline = [];

  // Add lab results as auto-captured entries
  for (const [testType, results] of Object.entries(labsByType)) {
    const latest = results[0];
    if (!latest) continue;
    timeline.push({
      id: `lab_${latest.id}`,
      timestamp: latest.collected_at,
      type: "lab_result",
      title: `${LAB_LABELS[testType]?.label || testType}: ${latest.value}${latest.unit || ""}`,
      isAbnormal: isAbnormal(testType, latest.value),
      trend: getTrend(results),
      testType,
      results,
    });
  }

  // Add case notes
  for (const note of notes) {
    timeline.push({
      id: `note_${note.id}`,
      timestamp: note.created_date,
      type: note.note_type || "general",
      title: note.note_type === "admission" ? "Admission Note" : note.note_type === "handover" ? "Handover" : note.note_type === "review" ? "Progress Note" : "Clinical Update",
      content: note.content,
      author: note.author_name,
      authorGrade: note.author_grade,
    });
  }

  // Sort by timestamp descending
  timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const handleSave = async () => {
    if (!formData.content.trim()) return;
    setSaving(true);
    try {
      await base44.entities.CaseNote.create({
        case_id: caseId,
        patient_id: caseData.patient_id || "",
        note_type: formData.update_type === "clinical_review" ? "review" : formData.update_type === "medication" ? "general" : "general",
        content: formData.heading.trim() ? `${formData.heading}\n\n${formData.content}` : formData.content,
        author_name: user?.full_name || "Unknown",
        author_id: user?.id || "",
        author_grade: user?.clinical_grade || "nchd",
        author_imc: user?.imc_number || "",
        is_locked: false,
      });
      setFormData({ update_type: "clinical_review", heading: "", content: "" });
      setShowForm(false);
      await loadAll();
      onUpdate();
    } catch {
      alert("Failed to save progress entry.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!confirm("Delete this progress entry?")) return;
    try {
      await base44.entities.CaseNote.delete(noteId);
      await loadAll();
      onUpdate();
    } catch {
      alert("Failed to delete entry.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-hive-gold" />
          <h4 className="font-bold text-gray-900 text-sm">Daily Progress Timeline</h4>
          <span className="text-xs text-gray-400">{timeline.length} entries</span>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800">
          <Plus className="w-3.5 h-3.5" /> Log Update
        </button>
      </div>

      {/* Latest labs auto-capture banner */}
      {labResults.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-2.5 flex items-center gap-2">
          <FlaskConical className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
          <p className="text-xs text-purple-700">
            Auto-captured <strong>{labResults.length}</strong> lab results · Latest: {new Date(labResults[0].collected_at).toLocaleString("en-IE")}
          </p>
        </div>
      )}

      {/* Quick lab summary */}
      {Object.keys(labsByType).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">Latest Lab Snapshot</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(labsByType).map(([testType, results]) => {
              const latest = results[0];
              const abnormal = isAbnormal(testType, latest.value);
              const trend = getTrend(results);
              const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
              return (
                <span key={testType} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${abnormal ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                  {LAB_LABELS[testType]?.label || testType} {latest.value}
                  {trend && <TrendIcon className={`w-3 h-3 ${trend === "up" ? "text-red-500" : trend === "down" ? "text-blue-500" : "text-gray-400"}`} />}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Add new update form */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {UPDATE_TYPES.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.value} onClick={() => setFormData(prev => ({ ...prev, update_type: t.value }))}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${formData.update_type === t.value ? t.color : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
                  <Icon className="w-3 h-3" /> {t.label}
                </button>
              );
            })}
          </div>
          <input type="text" value={formData.heading} onChange={e => setFormData(prev => ({ ...prev, heading: e.target.value }))}
            placeholder="Heading (optional, e.g. 'POD 1 Review', 'Wound Check')"
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400" />
          <textarea value={formData.content} onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Clinical update details..."
            rows={3}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-gray-400 resize-none" />
          <div className="flex items-center gap-2">
            <button onClick={handleSave} disabled={saving || !formData.content.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-xs font-semibold hover:bg-gray-800 disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add to Timeline
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded-lg text-gray-500 text-xs font-medium hover:bg-gray-100">Cancel</button>
          </div>
        </div>
      )}

      {/* Timeline */}
      {timeline.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No progress entries yet. Log a clinical update to start tracking.</p>
        </div>
      ) : (
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200" />

          {timeline.map((entry, i) => {
            const typeConfig = UPDATE_TYPES.find(t => t.value === entry.type) || UPDATE_TYPES.find(t => t.value === "general");
            const Icon = entry.type === "lab_result" ? FlaskConical : typeConfig.icon;
            const isLab = entry.type === "lab_result";

            return (
              <div key={entry.id} className="relative mb-4 last:mb-0">
                {/* Timeline dot */}
                <div className={`absolute -left-[18px] w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${isLab ? "bg-purple-500" : "bg-hive-gold"}`}>
                  <Icon className="w-2 h-2 text-white" />
                </div>

                {/* Entry card */}
                <div className={`rounded-lg border p-3 ${isLab && entry.isAbnormal ? "border-red-200 bg-red-50/30" : "border-gray-200 bg-white"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${entry.isAbnormal ? "text-red-700" : "text-gray-900"}`}>{entry.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(entry.timestamp).toLocaleString("en-IE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {entry.author && ` · ${entry.author}`}
                        {entry.authorGrade && ` (${entry.authorGrade})`}
                      </p>
                    </div>
                    {/* Trend for labs */}
                    {isLab && entry.trend && (
                      <div className="flex items-center gap-1">
                        {entry.trend === "up" ? <TrendingUp className="w-3.5 h-3.5 text-red-500" /> : entry.trend === "down" ? <TrendingDown className="w-3.5 h-3.5 text-blue-500" /> : <Minus className="w-3.5 h-3.5 text-gray-400" />}
                        {entry.isAbnormal && <span className="text-[10px] font-bold text-red-600 px-1.5 py-0.5 bg-red-100 rounded">ABNORMAL</span>}
                      </div>
                    )}
                    {/* Delete for non-locked notes */}
                    {!isLab && entry.id.startsWith("note_") && (
                      <button onClick={() => handleDelete(entry.id.replace("note_", ""))} className="p-1 rounded text-gray-300 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Lab history mini-chart */}
                  {isLab && entry.results?.length > 1 && (
                    <div className="mt-2 flex items-center gap-1">
                      <span className="text-[10px] text-gray-400 mr-1">Trend:</span>
                      {entry.results.slice(0, 5).reverse().map((r, idx) => (
                        <span key={idx} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${isAbnormal(entry.testType, r.value) ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-600"}`}>
                          {r.value}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Note content */}
                  {!isLab && entry.content && (
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{entry.content}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}