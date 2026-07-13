import React from "react";
import { Mic, Camera, Type, Monitor, Clock, FileText, User } from "lucide-react";
import AIBadge from "@/components/AIBadge";
import StatusPill from "@/components/StatusPill";
import ReasoningBullets from "@/components/ReasoningBullets";
import FormattedAdmissionNote from "@/components/FormattedAdmissionNote";

const MODE_CONFIG = {
  audio: { icon: Mic, label: "Audio Dictation", color: "bg-purple-50 text-purple-700 border-purple-200" },
  text: { icon: Type, label: "Text", color: "bg-gray-50 text-gray-700 border-gray-200" },
  camera: { icon: Camera, label: "Photo", color: "bg-blue-50 text-blue-700 border-blue-200" },
  screenshot: { icon: Monitor, label: "Screenshot", color: "bg-gray-50 text-gray-700 border-gray-200" }
};

function formatSeenAt(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

function MetaRow({ caseData }) {
  const mode = caseData.referral_mode ? MODE_CONFIG[caseData.referral_mode] : null;
  const seenAt = caseData.patient_seen_at || caseData.created_date;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {mode &&
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${mode.color}`}>
          <mode.icon className="w-3.5 h-3.5" />
          {mode.label}
        </span>
      }
      {seenAt &&
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-gray-50 text-gray-600 border border-gray-200">
          <Clock className="w-3.5 h-3.5" />
          Seen {formatSeenAt(seenAt)}
        </span>
      }
    </div>);

}

function AudioReferralBlock({ caseData }) {
  if (!caseData.referral_audio_url) return null;

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50/50 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-purple-100/50 border-b border-purple-200">
        <Mic className="w-3.5 h-3.5 text-purple-600" />
        <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Audio Referral Recording</span>
      </div>
      <div className="p-3 space-y-3">
        <audio controls src={caseData.referral_audio_url} className="w-full h-9" />
        {caseData.referral_transcript &&
        <div>
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Dictated Text</p>
            <div className="rounded-md bg-white border border-purple-200 p-3">
              <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">{caseData.referral_transcript}</p>
            </div>
          </div>
        }
      </div>
    </div>);

}

function InfoGrid({ caseData }) {
  const items = [];
  if (caseData.mechanism_of_injury) items.push({ label: "Mechanism of Injury", value: caseData.mechanism_of_injury });
  if (caseData.referral_summary && !caseData.referral_transcript) items.push({ label: "Referral Summary", value: caseData.referral_summary });

  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item, i) =>
      <div key={i}>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{item.label}</p>
          <p className="text-sm text-gray-900 mt-0.5 whitespace-pre-wrap">{item.value}</p>
        </div>
      )}
    </div>);

}

function ReferrerBlock({ caseData }) {
  if (!caseData.referrer_name && !caseData.referring_team) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-200">
        <User className="w-3.5 h-3.5 text-gray-600" />
        <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Referrer</span>
      </div>
      <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {caseData.referrer_name &&
        <div>
            <p className="text-[11px] text-gray-500">Name</p>
            <p className="text-sm text-gray-900 font-medium">{caseData.referrer_name}</p>
          </div>
        }
        {caseData.referrer_grade &&
        <div>
            <p className="text-[11px] text-gray-500">Grade</p>
            <p className="text-sm text-gray-900 font-medium capitalize">{caseData.referrer_grade}</p>
          </div>
        }
        {caseData.referrer_department &&
        <div>
            <p className="text-[11px] text-gray-500">Department</p>
            <p className="text-sm text-gray-900 font-medium">{caseData.referrer_department}</p>
          </div>
        }
        {caseData.referring_team &&
        <div>
            <p className="text-[11px] text-gray-500">Team / Hospital</p>
            <p className="text-sm text-gray-900 font-medium">{caseData.referring_team}</p>
          </div>
        }
      </div>
    </div>);

}

function TriageBlock({ caseData }) {
  if (!caseData.triage_decision || caseData.triage_decision === "pending") return null;

  return (
    <div className="pt-3 border-t border-gray-100 space-y-3">
      <StatusPill caseData={caseData} />
      {caseData.triage_reasoning &&
      <div>
          <p className="text-sm text-gray-500 mb-1">Reasoning</p>
          <ReasoningBullets text={caseData.triage_reasoning} />
        </div>
      }
      {caseData.triage_guideline &&
      <div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Guideline Applied</p>
          <p className="text-sm text-gray-900 mt-0.5">{caseData.triage_guideline}</p>
        </div>
      }
    </div>);

}

function AIBlock({ caseData }) {
  return (
    <>
      {caseData.pre_clerking_guidance &&
      <div>
          <div className="flex items-center gap-2 mb-1 hidden">
            <AIBadge />
            <p className="text-sm text-gray-500">Pre-Clerking Guidance</p>
          </div>
          <FormattedAdmissionNote note={caseData.pre_clerking_guidance} />
        </div>
      }
      {caseData.admission_note && !["admitted", "discharge_ready", "discharged"].includes(caseData.status) &&
      <div className="pt-3 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Admission Note</p>
          <FormattedAdmissionNote note={caseData.admission_note} />
        </div>
      }
    </>);

}

export default function ReferralSummaryCard({ caseData }) {
  return (
    <div className="space-y-3">
      <MetaRow caseData={caseData} />

      <AudioReferralBlock caseData={caseData} />

      {caseData.presenting_complaint &&
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
          <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider mb-1">Presenting Complaint</p>
          <p className="text-sm text-gray-900 leading-relaxed">{caseData.presenting_complaint}</p>
        </div>
      }

      <InfoGrid caseData={caseData} />
      <ReferrerBlock caseData={caseData} />
      <TriageBlock caseData={caseData} />
      <AIBlock caseData={caseData} />
    </div>);

}