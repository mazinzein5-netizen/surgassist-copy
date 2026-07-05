import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import HexBadge from "@/components/HexBadge";
import { INEWSAlertCard, PendingReferralCard } from "@/components/DashboardAlertCard";
import { FilePlus2, FolderOpen, AlertTriangle, ClipboardList, Users, Calculator, Activity, Clock, ChevronRight, BedDouble, Siren } from "lucide-react";

const GRADE_LABELS = { nchd: "NCHD", registrar: "Registrar", consultant: "Consultant" };
const DEPT_LABELS = { orthopaedics: "Orthopaedics", general_surgery: "General Surgery" };

export default function Dashboard() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    try {
      const data = await base44.entities.CaseFile.filter({}, "-created_date", 50);
      setCases(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const activeCases = cases.filter((c) => !["discharged", "declined"].includes(c.status));
  const pendingReview = cases.filter((c) => c.review_status === "pending" && c.status === "admitted");

  // Critical INEWS alerts — admitted/inews_consult patients with INEWS >= 3, sorted by score desc
  const inewsAlerts = cases.
  filter((c) => ["admitted", "inews_consult"].includes(c.status) && c.inews_score != null && c.inews_score >= 3).
  sort((a, b) => b.inews_score - a.inews_score);

  // Pending referrals — not yet accepted/declined
  const pendingReferrals = cases.
  filter((c) => ["referral_intake", "triage"].includes(c.status)).
  sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  const stats = [
  { label: "Active Cases", value: activeCases.length, icon: FolderOpen, color: "text-accent", to: "/cases" },
  { label: "INEWS Alerts", value: inewsAlerts.length, icon: Siren, color: "text-destructive", to: "/inpatient-monitor" },
  { label: "Pending Referrals", value: pendingReferrals.length, icon: Clock, color: "text-warning", to: "/cases" },
  { label: "Pending Review", value: pendingReview.length, icon: Activity, color: "text-hive-gold", to: "/cases" }];


  const quickActions = [
  { label: "New Referral", desc: "Process a new surgical referral", icon: FilePlus2, to: "/new-referral", color: "bg-hive-gold/10 border-hive-gold/20 text-hive-gold" },
  { label: "INEWS Consult", desc: "Rapid inpatient consult for INEWS > 2", icon: AlertTriangle, to: "/inews-consult", color: "bg-destructive/10 border-destructive/20 text-destructive" },
  { label: "Handover", desc: "Generate ISBAR handover sheet", icon: Users, to: "/handover", color: "bg-accent/10 border-accent/20 text-accent" },
  { label: "Drug Calculator", desc: "Weight & renal-adjusted dosing", icon: Calculator, to: "/drug-calculator", color: "bg-success/10 border-success/20 text-success" }];


  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold tracking-wider text-hive-gold uppercase">HIVE Surgical Assistant</span>
        </div>
        <h1 className="text-2xl md:text-3xl text-foreground font-medium [font-family:'Titan_One',_system-ui]">
          Welcome, Dr. {user?.full_name?.split(" ").pop() || "User"}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {GRADE_LABELS[user?.clinical_grade] || "NCHD"} · {DEPT_LABELS[user?.department] || "Surgery"} · {user?.hospital || "HSE Hospital"}
        </p>
      </div>

      {/* Priority: INEWS Alerts & Pending Referrals */}
      {loading ?
      <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-border border-t-hive-gold rounded-full animate-spin" />
        </div> :
      (inewsAlerts.length > 0 || pendingReferrals.length > 0) &&
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* INEWS Alerts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Siren className="w-4 h-4 text-destructive" />
                <h2 className="text-sm font-semibold text-destructive uppercase tracking-wider">INEWS Alerts</h2>
              </div>
              <Link to="/inpatient-monitor" className="text-xs text-hive-gold hover:underline">Monitor →</Link>
            </div>
            {inewsAlerts.length > 0 ?
          <div className="space-y-2">
                {inewsAlerts.slice(0, 5).map((c) => <INEWSAlertCard key={c.id} caseFile={c} />)}
              </div> :

          <div className="bg-card border border-border rounded-lg p-4 text-center">
                <p className="text-xs text-success flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" /> No active INEWS alerts
                </p>
              </div>
          }
          </div>

          {/* Pending Referrals */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" />
                <h2 className="text-sm font-semibold text-warning uppercase tracking-wider">Pending Referrals</h2>
              </div>
              <Link to="/cases" className="text-xs text-hive-gold hover:underline">All cases →</Link>
            </div>
            {pendingReferrals.length > 0 ?
          <div className="space-y-2">
                {pendingReferrals.slice(0, 5).map((c) => <PendingReferralCard key={c.id} caseFile={c} />)}
              </div> :

          <div className="bg-card border border-border rounded-lg p-4 text-center">
                <p className="text-xs text-muted-foreground">No pending referrals</p>
              </div>
          }
          </div>
        </div>
      }

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.to} className="bg-card border border-border rounded-xl p-4 hover:border-hive-gold/30 transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`w-5 h-5 ${stat.color}`} />
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </Link>);

        })}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} to={action.to} className={`border rounded-xl p-5 hover:scale-[1.02] transition-transform ${action.color}`}>
                <Icon className="w-6 h-6 mb-3" />
                <div className="font-semibold text-sm">{action.label}</div>
                <div className="text-xs opacity-80 mt-1">{action.desc}</div>
              </Link>);

          })}
        </div>
      </div>

      {/* Recent Cases */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Cases</h2>
          <Link to="/cases" className="text-xs text-hive-gold hover:underline">View all →</Link>
        </div>
        {loading ?
        <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-border border-t-hive-gold rounded-full animate-spin" />
          </div> :
        cases.length === 0 ?
        <div className="bg-card border border-border rounded-xl p-12 text-center">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No cases yet. Start by processing a new referral.</p>
            <Link to="/new-referral" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-hive-gold text-hive-gold-foreground font-medium text-sm hover:bg-hive-gold/90 transition-colors">
              <FilePlus2 className="w-4 h-4" />
              New Referral
            </Link>
          </div> :

        <div className="space-y-2">
            {cases.slice(0, 5).map((c) =>
          <Link key={c.id} to={`/cases/${c.id}`} className="flex items-center justify-between bg-card border border-border rounded-lg p-4 hover:border-hive-gold/30 transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 hex-clip bg-hive-gold/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-hive-gold font-bold text-sm">{c.patient_name?.charAt(0)?.toUpperCase() || "?"}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{c.patient_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.presenting_complaint || c.referral_summary || "No summary"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <HexBadge status={c.status} />
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {new Date(c.created_date).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </Link>
          )}
          </div>
        }
      </div>
    </div>);

}