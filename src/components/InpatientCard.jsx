import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Activity, Droplet, Thermometer, Heart, Wind, ChevronRight, Calendar, Stethoscope, FileText } from "lucide-react";

function getAbnormalFindings(inewsData, inewsScore) {
  const flags = [];
  if (!inewsData) return flags;

  const hr = parseInt(inewsData.hr);
  if (hr && (hr <= 40 || hr >= 131)) flags.push({ label: `HR ${hr}`, severity: "critical" });
  else if (hr && (hr <= 50 || hr >= 111)) flags.push({ label: `HR ${hr}`, severity: "warning" });

  const sys = parseInt(inewsData.bp_sys);
  if (sys && (sys <= 90 || sys >= 220)) flags.push({ label: `SBP ${sys}`, severity: "critical" });
  else if (sys && sys <= 100) flags.push({ label: `SBP ${sys}`, severity: "warning" });

  const rr = parseInt(inewsData.rr);
  if (rr && (rr <= 8 || rr >= 25)) flags.push({ label: `RR ${rr}`, severity: "critical" });
  else if (rr && (rr <= 11 || rr >= 21)) flags.push({ label: `RR ${rr}`, severity: "warning" });

  const spO2 = parseInt(inewsData.spO2);
  if (spO2 && spO2 <= 91) flags.push({ label: `SpO₂ ${spO2}%`, severity: "critical" });
  else if (spO2 && spO2 <= 93) flags.push({ label: `SpO₂ ${spO2}%`, severity: "warning" });

  const temp = parseFloat(inewsData.temp);
  if (temp && (temp < 35 || temp >= 39.1)) flags.push({ label: `Temp ${temp}°C`, severity: "warning" });

  if (inewsData.avpu && inewsData.avpu !== "A") flags.push({ label: `AVPU ${inewsData.avpu}`, severity: "critical" });

  if (inewsScore >= 7) flags.push({ label: `INEWS ${inewsScore}`, severity: "critical" });
  else if (inewsScore >= 5) flags.push({ label: `INEWS ${inewsScore}`, severity: "warning" });
  else if (inewsScore >= 3) flags.push({ label: `INEWS ${inewsScore}`, severity: "warning" });

  return flags;
}

function scoreColor(score) {
  if (!score && score !== 0) return "bg-muted text-muted-foreground";
  if (score >= 7) return "bg-destructive/20 text-destructive";
  if (score >= 5) return "bg-warning/20 text-warning";
  if (score >= 3) return "bg-accent/20 text-accent";
  return "bg-success/20 text-success";
}

export default function InpatientCard({ caseFile }) {
  const flags = getAbnormalFindings(caseFile.inews_data, caseFile.inews_score);
  const hasCritical = flags.some(f => f.severity === "critical");
  const inewsData = caseFile.inews_data || {};

  const borderClass = hasCritical
    ? "border-destructive/40"
    : flags.length > 0
    ? "border-warning/30"
    : "border-border";

  return (
    <Link
      to={`/cases/${caseFile.id}`}
      className={`block bg-card border ${borderClass} rounded-xl p-4 hover:border-hive-gold/30 transition-colors group relative`}
    >
      {hasCritical && (
        <div className="absolute top-3 right-3 flex items-center gap-1 text-destructive">
          <AlertTriangle className="w-4 h-4 animate-pulse-gold" />
        </div>
      )}

      {/* Patient header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 hex-clip bg-hive-gold/10 flex items-center justify-center flex-shrink-0">
          <span className="text-hive-gold font-bold text-sm">
            {caseFile.patient_name?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground text-sm truncate">{caseFile.patient_name || "Unknown"}</p>
          <p className="text-xs text-muted-foreground truncate">
            MRN: {caseFile.patient_mrn || "—"}
          </p>
        </div>
        {caseFile.inews_score != null && (
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${scoreColor(caseFile.inews_score)}`}>
            {caseFile.inews_score}
          </span>
        )}
      </div>

      {/* Admission / Pre-op info */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {caseFile.admission_date && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="w-3 h-3" />
            Adm {new Date(caseFile.admission_date).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}
          </span>
        )}
        {caseFile.pre_op_status && caseFile.pre_op_status !== "not_listed" && (
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
            caseFile.pre_op_status === "in_theatre" ? "bg-destructive/15 text-destructive" :
            caseFile.pre_op_status === "listed" ? "bg-hive-gold/15 text-hive-gold" :
            caseFile.pre_op_status === "post_op" ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground"
          }`}>
            <Stethoscope className="w-2.5 h-2.5" />
            {caseFile.pre_op_status === "in_theatre" ? "In Theatre" :
             caseFile.pre_op_status === "listed" ? "Listed" :
             caseFile.pre_op_status === "post_op" ? "Post-Op" : caseFile.pre_op_status}
          </span>
        )}
        {caseFile.procedure_date && (() => {
          const pod = Math.floor((new Date() - new Date(caseFile.procedure_date)) / (1000 * 60 * 60 * 24));
          return <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">POD {pod}</span>;
        })()}
        {caseFile.admission_note && (
          <span className="inline-flex items-center gap-1 text-[10px] text-hive-gold">
            <FileText className="w-2.5 h-2.5" /> Note ready
          </span>
        )}
      </div>

      {/* Presenting complaint */}
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
        {caseFile.presenting_complaint || caseFile.referral_summary || "No complaint recorded"}
      </p>

      {/* Vitals snapshot */}
      {(inewsData.hr || inewsData.rr || inewsData.spO2 || inewsData.temp || inewsData.bp_sys) && (
        <div className="grid grid-cols-5 gap-1 mb-3">
          <VitalChip icon={Heart} value={inewsData.hr} unit="" />
          <VitalChip icon={Activity} value={inewsData.bp_sys} unit="" />
          <VitalChip icon={Wind} value={inewsData.rr} unit="" />
          <VitalChip icon={Droplet} value={inewsData.spO2} unit="%" />
          <VitalChip icon={Thermometer} value={inewsData.temp} unit="°" />
        </div>
      )}

      {/* Abnormal flags */}
      {flags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {flags.map((flag, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                flag.severity === "critical"
                  ? "bg-destructive/15 text-destructive"
                  : "bg-warning/15 text-warning"
              }`}
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              {flag.label}
            </span>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] text-success">
          <span className="w-1.5 h-1.5 rounded-full bg-success" />
          Stable — no abnormal flags
        </div>
      )}

      <div className="flex items-center justify-end mt-2 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
        View file <ChevronRight className="w-3 h-3 ml-0.5" />
      </div>
    </Link>
  );
}

function VitalChip({ icon: Icon, value, unit }) {
  if (!value) return <div className="text-center text-[10px] text-muted-foreground/40">—</div>;
  return (
    <div className="flex flex-col items-center gap-0.5 bg-background/50 rounded-md py-1.5">
      <Icon className="w-3 h-3 text-muted-foreground" />
      <span className="text-[10px] font-medium text-foreground">{value}{unit}</span>
    </div>
  );
}