import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { formatTimestamp } from "@/lib/formatDate";
import { Loader2, Plus, ClipboardList } from "lucide-react";

const DEPT_LABELS = { orthopaedics: "Orthopaedics", general_surgery: "General Surgery" };
const ROLE_LABELS = { primary_surgeon: "Primary Surgeon", first_assistant: "1st Assistant", second_assistant: "2nd Assistant", observing: "Observing" };

export default function TheatreLogPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    patient_name: "", patient_mrn: "", procedure_date: "", procedure_name: "",
    procedure_role: "first_assistant", supervisor_name: "", supervisor_imc: "",
    department: user?.department || "orthopaedics", notes: "", learning_points: "",
  });

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    try {
      const data = await base44.entities.TheatreLog.filter({}, "-procedure_date", 100);
      setLogs(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.entities.TheatreLog.create(form);
      setForm({ patient_name: "", patient_mrn: "", procedure_date: "", procedure_name: "", procedure_role: "first_assistant", supervisor_name: "", supervisor_imc: "", department: user?.department || "orthopaedics", notes: "", learning_points: "" });
      setShowForm(false);
      loadLogs();
    } catch { alert("Failed to save entry."); }
    finally { setLoading(false); }
  };

  const toggleArchive = async (log) => {
    try {
      await base44.entities.TheatreLog.update(log.id, { archived: !log.archived });
      loadLogs();
    } catch { alert("Failed to update."); }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-foreground">Theatre</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{logs.filter(l => !l.archived).length} active · {logs.length} total</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background font-medium text-sm hover:opacity-80">
          <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Entry</span>
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-5 mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Patient Name" value={form.patient_name} onChange={v => setForm(p => ({ ...p, patient_name: v }))} required />
            <FormField label="MRN" value={form.patient_mrn} onChange={v => setForm(p => ({ ...p, patient_mrn: v }))} />
            <FormField label="Procedure Date" type="date" value={form.procedure_date} onChange={v => setForm(p => ({ ...p, procedure_date: v }))} required />
            <FormField label="Procedure Name" value={form.procedure_name} onChange={v => setForm(p => ({ ...p, procedure_name: v }))} required />
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Role</label>
              <select value={form.procedure_role} onChange={e => setForm(p => ({ ...p, procedure_role: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground/30">
                {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Department</label>
              <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground/30">
                <option value="orthopaedics">Orthopaedics</option>
                <option value="general_surgery">General Surgery</option>
              </select>
            </div>
            <FormField label="Supervisor Name" value={form.supervisor_name} onChange={v => setForm(p => ({ ...p, supervisor_name: v }))} />
            <FormField label="Supervisor IMC" value={form.supervisor_imc} onChange={v => setForm(p => ({ ...p, supervisor_imc: v }))} />
          </div>
          <FormField label="Notes" value={form.notes} onChange={v => setForm(p => ({ ...p, notes: v }))} textarea />
          <FormField label="Learning Points" value={form.learning_points} onChange={v => setForm(p => ({ ...p, learning_points: v }))} textarea />
          <button type="submit" disabled={loading} className="w-full px-4 py-2.5 rounded-lg bg-foreground text-background font-medium text-sm hover:opacity-80 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Save Entry
          </button>
        </form>
      )}

      {loading && !showForm ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-border border-t-foreground rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No theatre log entries yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div key={log.id} className={`bg-card border border-border rounded-lg p-4 ${log.archived ? "opacity-50" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground text-sm">{log.procedure_name}</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">{log.patient_name} · MRN: {log.patient_mrn || "N/A"}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">{ROLE_LABELS[log.procedure_role]}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">{DEPT_LABELS[log.department]}</span>
                    {log.supervisor_name && <span className="text-xs text-muted-foreground">Supervisor: {log.supervisor_name}</span>}
                    {log.supervisor_signed && <span className="px-2 py-0.5 rounded text-xs font-medium bg-[#16A34A]/10 text-[#16A34A]">Signed</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">{formatTimestamp(log.procedure_date)}</span>
                  <button
                    onClick={() => toggleArchive(log)}
                    className={`px-2 py-1 rounded text-xs font-medium ${log.archived ? "bg-muted text-muted-foreground" : "bg-[#16A34A]/10 text-[#16A34A]"}`}
                  >
                    {log.archived ? "Unarchive" : "Archive"}
                  </button>
                </div>
              </div>
              {log.notes && <p className="text-xs text-muted-foreground mt-2">{log.notes}</p>}
              {log.learning_points && <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">Learning: </span>{log.learning_points}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormField({ label, value, onChange, type = "text", textarea, required }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground block mb-1">{label}{required && <span className="text-[#DC2626] ml-0.5">*</span>}</label>
      {textarea ? (
        <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground/30 resize-none" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-foreground/30" />
      )}
    </div>
  );
}