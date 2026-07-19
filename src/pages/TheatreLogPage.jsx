import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, ClipboardList, Calendar, Archive, ArchiveRestore } from "lucide-react";
import PullToRefresh from "@/components/PullToRefresh";

const DEPT_LABELS = { orthopaedics: "Orthopaedics", general_surgery: "General Surgery" };
const ROLE_LABELS = { primary_surgeon: "Primary Surgeon", first_assistant: "1st Assistant", second_assistant: "2nd Assistant", observing: "Observing" };

export default function TheatreLogPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState({
    patient_name: "", patient_mrn: "", procedure_date: "", procedure_name: "",
    procedure_role: "first_assistant", supervisor_name: "", supervisor_imc: "",
    department: user?.department || "orthopaedics", notes: "", learning_points: "",
  });

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    try {
      const data = await base44.entities.TheatreLog.filter({}, "-procedure_date", 100);
      setLogs(JSON.parse(JSON.stringify(data)));
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
    } catch { alert("Failed to update entry."); }
  };

  const visibleLogs = logs.filter(l => showArchived ? l.archived : !l.archived);

  return (
    <PullToRefresh onRefresh={loadLogs}>
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Theatre Log</h1>
          <p className="text-sm text-gray-500 mt-0.5">{logs.filter(l => !l.archived).length} entries</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white font-medium text-sm hover:bg-gray-800">
          <Plus className="w-4 h-4" /> Add Entry
        </button>
      </div>

      <button onClick={() => setShowArchived(!showArchived)}
        className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200">
        {showArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
        {showArchived ? "Show Active" : "Show Archived"}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="Patient Name" value={form.patient_name} onChange={v => setForm(p => ({ ...p, patient_name: v }))} required />
            <FormField label="MRN" value={form.patient_mrn} onChange={v => setForm(p => ({ ...p, patient_mrn: v }))} />
            <FormField label="Procedure Date" type="date" value={form.procedure_date} onChange={v => setForm(p => ({ ...p, procedure_date: v }))} required />
            <FormField label="Procedure Name" value={form.procedure_name} onChange={v => setForm(p => ({ ...p, procedure_name: v }))} required />
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Role</label>
              <select value={form.procedure_role} onChange={e => setForm(p => ({ ...p, procedure_role: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400">
                {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Department</label>
              <select value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400">
                <option value="orthopaedics">Orthopaedics</option>
                <option value="general_surgery">General Surgery</option>
              </select>
            </div>
            <FormField label="Supervisor Name" value={form.supervisor_name} onChange={v => setForm(p => ({ ...p, supervisor_name: v }))} />
            <FormField label="Supervisor IMC" value={form.supervisor_imc} onChange={v => setForm(p => ({ ...p, supervisor_imc: v }))} />
          </div>
          <FormField label="Notes" value={form.notes} onChange={v => setForm(p => ({ ...p, notes: v }))} textarea />
          <FormField label="Learning Points" value={form.learning_points} onChange={v => setForm(p => ({ ...p, learning_points: v }))} textarea />
          <button type="submit" disabled={loading} className="w-full px-4 py-2.5 rounded-lg bg-gray-900 text-white font-medium text-sm hover:bg-gray-800 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Save Entry
          </button>
        </form>
      )}

      {loading && !showForm ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
        </div>
      ) : visibleLogs.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No entries yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visibleLogs.map(log => (
            <div key={log.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{log.procedure_name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{log.patient_name}{log.patient_mrn ? ` · MRN: ${log.patient_mrn}` : ""}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">{ROLE_LABELS[log.procedure_role]}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">{DEPT_LABELS[log.department]}</span>
                    {log.supervisor_signed && <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Signed</span>}
                  </div>
                  {log.supervisor_name && <p className="text-xs text-gray-500 mt-1.5">Supervisor: {log.supervisor_name}{log.supervisor_imc ? ` · IMC: ${log.supervisor_imc}` : ""}</p>}
                  {log.notes && <p className="text-xs text-gray-500 mt-2">{log.notes}</p>}
                  {log.learning_points && <p className="text-xs text-gray-500 mt-1"><span className="font-medium">Learning: </span>{log.learning_points}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    {new Date(log.procedure_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                  <button onClick={() => toggleArchive(log)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                    {log.archived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </PullToRefresh>
  );
}

function FormField({ label, value, onChange, type = "text", textarea, required }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 block mb-1">{label}{required && <span className="text-red-600 ml-0.5">*</span>}</label>
      {textarea ? (
        <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400 resize-none" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-gray-400" />
      )}
    </div>
  );
}