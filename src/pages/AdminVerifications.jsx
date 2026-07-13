import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Loader2, CheckCircle2, XCircle, Clock, User, FileCheck } from "lucide-react";

export default function AdminVerifications() {
  const { user } = useAuth();
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  useEffect(() => { loadVerifications(); }, []);

  const loadVerifications = async () => {
    try {
      const data = await base44.entities.Verification.filter({}, "-created_date", 100);
      setVerifications(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAction = async (action) => {
    if (!selected) return;
    setActionLoading(true);
    try {
      const status = action === "approve" ? "admin_approved" : "admin_rejected";
      await base44.entities.Verification.update(selected.id, {
        status,
        admin_reviewer_id: user?.id || "",
        admin_reviewer_name: user?.full_name || "Admin",
        admin_notes: adminNotes,
        reviewed_at: new Date().toISOString(),
      });
      setSelected(null);
      setAdminNotes("");
      await loadVerifications();
    } catch {
      alert("Failed to update verification.");
    } finally {
      setActionLoading(false);
    }
  };

  const pending = verifications.filter(v => v.status === "ai_approved" || v.status === "pending");
  const reviewed = verifications.filter(v => v.status === "admin_approved" || v.status === "admin_rejected");

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="w-8 h-8 text-hive-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-hive-gold" /> Identity Verifications
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{pending.length} pending review · {reviewed.length} completed</p>
      </div>

      {verifications.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No verification requests yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {verifications.map(v => (
            <VerificationRow key={v.id} v={v} onClick={() => setSelected(v)} />
          ))}
        </div>
      )}

      {selected && (
        <ReviewModal
          v={selected}
          adminNotes={adminNotes}
          setAdminNotes={setAdminNotes}
          onAction={handleAction}
          onClose={() => { setSelected(null); setAdminNotes(""); }}
          loading={actionLoading}
        />
      )}
    </div>
  );
}

function VerificationRow({ v, onClick }) {
  const STATUS_CONFIG = {
    pending: { label: "Pending", icon: Clock, color: "text-warning" },
    ai_approved: { label: "AI Approved", icon: Clock, color: "text-hive-gold" },
    ai_rejected: { label: "AI Rejected", icon: XCircle, color: "text-destructive" },
    admin_approved: { label: "Approved", icon: CheckCircle2, color: "text-success" },
    admin_rejected: { label: "Rejected", icon: XCircle, color: "text-destructive" },
  };
  const config = STATUS_CONFIG[v.status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  const isPending = v.status === "ai_approved" || v.status === "pending";

  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-card border rounded-xl p-4 hover:border-hive-gold/30 transition-colors ${isPending ? "border-hive-gold/20" : "border-border"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground text-sm truncate">{v.user_name}</p>
          <p className="text-xs text-muted-foreground truncate">{v.user_email}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase ${config.color}`}>
              <Icon className="w-3 h-3" /> {config.label}
            </span>
            {v.ai_confidence && (
              <span className="text-[10px] text-muted-foreground capitalize">AI: {v.ai_confidence} confidence</span>
            )}
          </div>
        </div>
        {isPending && (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-hive-gold/15 text-hive-gold border border-hive-gold/20">
            REVIEW
          </span>
        )}
      </div>
    </button>
  );
}

function ReviewModal({ v, adminNotes, setAdminNotes, onAction, onClose, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-foreground">{v.user_name}</h2>
            <p className="text-xs text-muted-foreground">{v.user_email}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted">
            <XCircle className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Photos side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <FileCheck className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase">Photo ID</p>
              </div>
              <img src={v.id_photo_url} alt="Photo ID" className="w-full rounded-lg border border-border object-contain bg-muted/20" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase">Selfie</p>
              </div>
              <img src={v.selfie_photo_url} alt="Selfie" className="w-full rounded-lg border border-border object-contain bg-muted/20" />
            </div>
          </div>

          {/* AI Assessment */}
          <div className="bg-muted/20 rounded-lg p-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">AI Assessment</p>
            <div className="flex items-center gap-3 text-sm">
              <span className={v.ai_match ? "text-success font-medium" : "text-destructive font-medium"}>
                {v.ai_match ? "✓ Match" : "✕ No Match"}
              </span>
              <span className="text-muted-foreground capitalize">Confidence: {v.ai_confidence}</span>
            </div>
            {v.ai_notes && <p className="text-xs text-foreground mt-1.5">{v.ai_notes}</p>}
          </div>

          {/* Admin Notes */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase block mb-1">Admin Notes</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Add notes about this verification..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-hive-gold/50 resize-none"
            />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex items-center gap-3">
          <button
            onClick={() => onAction("reject")}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/30 font-semibold text-sm hover:bg-destructive/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" /> Reject
          </button>
          <button
            onClick={() => onAction("approve")}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-success/10 text-success border border-success/30 font-semibold text-sm hover:bg-success/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}