import React from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Activity, Droplet, Thermometer, Heart, Wind, ChevronRight, Calendar, Stethoscope, BedDouble, ClipboardCheck, ScrollText, Clock } from "lucide-react";

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

const TRAUMA_KEYWORDS = ["fall", "rta", "road traffic", "accident", "fracture", "injury", "trauma", "crush", "assault", "laceration", "collision", "sport"];

function getPatientCategory(caseFile) {
  const text = `${caseFile.presenting_complaint || ""} ${caseFile.mechanism_of_injury || ""} ${caseFile.referral_summary || ""}`.toLowerCase();
  const isTrauma = TRAUMA_KEYWORDS.some(k => text.includes(k));
  const isEmergency = caseFile.status === "inews_consult" || (caseFile.inews_score != null && caseFile.inews_score >= 7);

  if (isEmergency) {
    return { label: "Emergency", color: "bg-destructive/15 text-destructive border-destructive/30", dot: "bg-destructive", bg: "bg-destructive/10", priority: 3 };
  }
  if (isTrauma) {
    return { label: "Trauma / Accident", color: "bg-orange-500/15 text-orange-400 border-orange-500/30", dot: "bg-orange-400", bg: "bg-orange-400/10", priority: 2 };
  }
  if (caseFile.pre_op_status === "in_theatre") {
    return { label: "Peri-Op", color: "bg-purple-500/15 text-purple-400 border-purple-500/30", dot: "bg-purple-400", bg: "bg-purple-400/10", priority: 1 };
  }
  return { label: "Routine", color: "bg-accent/15 text-accent border-accent/30", dot: "bg-accent", bg: "bg-accent/10", priority: 0 };
}

function getElapsedLabel(admissionDate) {
  if (!admissionDate) return null;
  const now = new Date();
  const diff = now - new Date(admissionDate);
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    const remainingHrs = hours % 24;
    return { value: `${days}d ${remainingHrs}h`, sub: `${days} day${days !== 1 ? "s" : ""} ${remainingHrs}h ago`, urgent: false };
  }
  return { value: `${hours}h ${mins}m`, sub: `${hours}h ${mins}m since admission`, urgent: hours >= 12 };
}

function getCategoryBorder(category) {
  if (category.priority === 3) return "border-destructive/50";
  if (category.priority === 2) return "border-orange-500/40";
  if (category.priority === 1) return "border-purple-500/40";
  return "border-border";
}

function getTimeColor(elapsed) {
  if (!elapsed) return "text-muted-foreground";
  if (elapsed.urgent) return "text-destructive";
  return "text-hive-gold";
}

function vitalColor(value, type) {
  if (!value) return "text-muted-foreground";
  const num = parseFloat(value);
  if (isNaN(num)) return "text-muted-foreground";
  const ranges = {
    hr: [[40, 50, "warning"], [111, 131, "warning"], [131, 999, "critical"], [0, 40, "critical"]],
    bp_sys: [[0, 90, "critical"], [90, 100, "warning"], [181, 220, "warning"], [220, 999, "critical"]],
    rr: [[0, 8, "critical"], [8, 11, "warning"], [21, 25, "warning"], [25, 999, "critical"]],
    spO2: [[0, 91, "critical"], [91, 93, "warning"], [93, 95, "warning"]],
    temp: [[0, 35, "warning"], [38.1, 39.1, "warning"], [39.1, 999, "critical"]],
  };
  const r = ranges[type];
  if (!r) return "text-foreground";
  for (const [min, max, sev] of r) {
    if (num >= min && num < max) return sev === "critical" ? "text-destructive" : "text-warning";
  }
  return "text-foreground";
}

export default function InpatientCard({ caseFile, onPrint }) {
  const flags = getAbnormalFindings(caseFile.inews_data, caseFile.inews_score);
  const hasCritical = flags.some(f => f.severity === "critical");
  const inewsData = caseFile.inews_data || {};
  const category = getPatientCategory(caseFile);
  const elapsed = getElapsedLabel(caseFile.admission_date);

  const borderClass = hasCritical
    ? "border-destructive/40"
    : getCategoryBorder(category);

  // Post-op / pre-op day calculation
  const now = new Date();
  let podLabel = null;
  let podValue = null;
  let podColor = "text-muted-foreground";

  if (caseFile.procedure_date) {
    podValue = Math.floor((now - new Date(caseFile.procedure_date)) / (1000 * 60 * 60 * 24));
    podLabel = "POD";
  } else if (caseFile.pre_op_status === "listed" && caseFile.admission_date) {
    podValue = Math.floor((now - new Date(caseFile.admission_date)) / (1000 * 60 * 60 * 24)) + 1;
    podLabel = "Pre-op Day";
    podColor = "text-hive-gold";
  }

  return (
    <Link
      to={`/cases/${caseFile.id}`}
      className={`block bg-card border ${borderClass} rounded-xl hover:border-hive-gold/30 transition-colors group relative overflow-hidden`}
    >
      {/* Patient header */}
      <div className="flex items-center gap-3 p-4 pb-3">
        <div className={`w-10 h-10 hex-clip flex items-center justify-center flex-shrink-0 ${category.bg}`}>
          <span className={`font-bold text-sm ${category.color.split(" ").find(c => c.startsWith("text-"))}`}>
            {caseFile.patient_name?.charAt(0)?.toUpperCase() || "?"}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground text-sm truncate">{caseFile.patient_name || "Unknown"}</p>
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${category.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${category.dot}`} />
              {category.label}
            </span>
          </div>
        </div>
        {caseFile.inews_score != null && (
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${scoreColor(caseFile.inews_score)}`}>
            INEWS {caseFile.inews_score}
          </span>
        )}
        {hasCritical && <AlertTriangle className="w-4 h-4 text-destructive animate-pulse-gold flex-shrink-0" />}
        {onPrint && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPrint(caseFile); }}
            className="p-1.5 rounded-lg bg-hive-gold/10 border border-hive-gold/20 text-hive-gold hover:bg-hive-gold/20 transition-colors flex-shrink-0"
            title="Print Call Note & Plan"
          >
            <ScrollText className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Time since admission — prominent timer */}
      {elapsed && (
        <div className="mx-4 mb-2.5 flex items-center justify-between rounded-lg px-3 py-2 border border-border/50 bg-secondary/30">
          <div className="flex items-baseline gap-1.5">
            <Clock className={`w-3.5 h-3.5 ${getTimeColor(elapsed)}`} />
            <span className={`text-lg font-bold tabular-nums ${getTimeColor(elapsed)}`}>{elapsed.value}</span>
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">since admit</span>
          </div>
          {caseFile.admission_date && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {new Date(caseFile.admission_date).toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      )}

      {/* Section 1: Admission Details */}
      <div className="px-4 pb-2.5 border-l-2 border-l-hive-gold/20 ml-1">
        <p className="text-[9px] font-bold text-hive-gold/70 uppercase tracking-wider mb-1.5">Admission</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          {caseFile.ward && (
            <span className="inline-flex items-center gap-1">
              <BedDouble className="w-2.5 h-2.5" />
              {caseFile.ward}{caseFile.bed_number ? ` · Bed ${caseFile.bed_number}` : ""}
            </span>
          )}
          {caseFile.admission_date && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" />
              {new Date(caseFile.admission_date).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}
            </span>
          )}
          {caseFile.pre_op_status && caseFile.pre_op_status !== "not_listed" && caseFile.pre_op_status !== "not_applicable" && (
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium ${
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
        </div>
      </div>

      {/* Section 2: Post-Op Day Counter */}
      {podLabel && (
        <div className="mx-4 mb-2.5 flex items-center gap-3 bg-secondary/50 rounded-lg px-3 py-2 border border-border/50">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-foreground tabular-nums">{podValue}</span>
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${podColor}`}>{podLabel}</span>
          </div>
          {caseFile.procedure_name && (
            <span className="text-[10px] text-muted-foreground truncate flex-1">{caseFile.procedure_name}</span>
          )}
        </div>
      )}

      {/* Presenting complaint */}
      <p className="px-4 text-xs text-muted-foreground mb-2.5 line-clamp-2">
        {caseFile.presenting_complaint || caseFile.referral_summary || "No complaint recorded"}
      </p>

      {/* Section 3: Vital Signs */}
      <div className="mx-4 mb-2.5">
        <p className="text-[9px] font-bold text-hive-gold/70 uppercase tracking-wider mb-1.5">Vitals</p>
        {(inewsData.hr || inewsData.rr || inewsData.spO2 || inewsData.temp || inewsData.bp_sys) ? (
          <div className="grid grid-cols-5 gap-1">
            <VitalChip icon={Heart} value={inewsData.hr} color={vitalColor(inewsData.hr, "hr")} />
            <VitalChip icon={Activity} value={inewsData.bp_sys} color={vitalColor(inewsData.bp_sys, "bp_sys")} />
            <VitalChip icon={Wind} value={inewsData.rr} color={vitalColor(inewsData.rr, "rr")} />
            <VitalChip icon={Droplet} value={inewsData.spO2} unit="%" color={vitalColor(inewsData.spO2, "spO2")} />
            <VitalChip icon={Thermometer} value={inewsData.temp} unit="°" color={vitalColor(inewsData.temp, "temp")} />
          </div>
        ) : (
          <p className="text-[10px] text-muted-foreground/50 py-2 text-center">No vitals recorded</p>
        )}
      </div>

      {/* Abnormal flags */}
      <div className="px-4 pb-3">
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
            <ClipboardCheck className="w-3 h-3" />
            Stable — no abnormal flags
          </div>
        )}
      </div>

      <div className="flex items-center justify-end px-4 pb-3 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
        View file <ChevronRight className="w-3 h-3 ml-0.5" />
      </div>
    </Link>
  );
}

function VitalChip({ icon: Icon, value, unit, color }) {
  if (!value) return <div className="text-center text-[10px] text-muted-foreground/40 py-1.5">—</div>;
  return (
    <div className="flex flex-col items-center gap-0.5 bg-background/50 rounded-md py-1.5">
      <Icon className="w-3 h-3 text-muted-foreground" />
      <span className={`text-[10px] font-bold ${color}`}>{value}{unit}</span>
    </div>
  );
}