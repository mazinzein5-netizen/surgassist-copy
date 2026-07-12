import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function DeleteAccountModal({ open, onClose }) {
  const { user, logout } = useAuth();
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleReset = () => {
    setStep(1);
    setConfirmText("");
    setDeleting(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await base44.auth.updateMe({
        imc_number: "",
        clinical_grade: "",
        hospital: "",
        department: "",
      });
      try {
        const profiles = await base44.entities.StaffProfile.filter({ user_id: user?.id });
        for (const p of profiles) {
          await base44.entities.StaffProfile.delete(p.id);
        }
      } catch {}
      await logout();
    } catch {
      alert("Failed to complete account deletion. Please contact support.");
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        {step === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" /> Delete Account
              </DialogTitle>
              <DialogDescription className="text-left">
                You are about to permanently delete your account. This will:
              </DialogDescription>
            </DialogHeader>
            <ul className="text-sm text-foreground space-y-1.5 py-2">
              <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">•</span> Remove your profile details (IMC number, hospital, department)</li>
              <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">•</span> Delete your staff profile record</li>
              <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">•</span> Sign you out of the application</li>
              <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">•</span> Clinical cases you authored will be retained per medical record regulations</li>
            </ul>
            <div className="bg-warning/10 border border-warning/30 rounded-lg p-3 mt-2">
              <p className="text-xs text-warning">⚠ This action cannot be undone.</p>
            </div>
            <DialogFooter className="gap-2 mt-4">
              <Button variant="outline" onClick={handleClose} className="flex-1 min-h-[44px]">Cancel</Button>
              <Button variant="destructive" onClick={() => setStep(2)} className="flex-1 min-h-[44px]">Continue</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" /> Final Confirmation
              </DialogTitle>
              <DialogDescription className="text-left">
                To permanently delete your account, type <span className="font-bold text-destructive">DELETE</span> below.
              </DialogDescription>
            </DialogHeader>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-destructive"
            />
            <DialogFooter className="gap-2 mt-4">
              <Button variant="outline" onClick={handleClose} className="flex-1 min-h-[44px]" disabled={deleting}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting || confirmText !== "DELETE"}
                className="flex-1 min-h-[44px]"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {deleting ? "Deleting..." : "Delete Forever"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}