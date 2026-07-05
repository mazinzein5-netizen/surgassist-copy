import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import HiveLogo from "./HiveLogo";
import HexBadge from "./HexBadge";
import { LayoutDashboard, FilePlus2, FolderOpen, Stethoscope, ClipboardList, Users, Calculator, User, LogOut, Menu, X, AlertTriangle, Activity, FolderSearch, MessageSquare } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/new-referral", label: "New Referral", icon: FilePlus2 },
  { to: "/cases", label: "My Cases", icon: FolderOpen },
  { to: "/inews-consult", label: "INEWS Consult", icon: AlertTriangle },
  { to: "/inpatient-monitor", label: "Inpatient Monitor", icon: Activity },
  { to: "/theatre-log", label: "Theatre Log", icon: ClipboardList },
  { to: "/handover", label: "Handover", icon: Users },
  { to: "/patient-history", label: "Patient Memory", icon: FolderSearch },
  { to: "/drug-calculator", label: "Drug Calculator", icon: Calculator },
  { to: "/contacts", label: "Contacts", icon: MessageSquare },
  { to: "/profile", label: "Profile", icon: User },
];

const GRADE_LABELS = { nchd: "NCHD", registrar: "Registrar", consultant: "Consultant" };

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const NavContent = () => (
    <>
      <div className="px-4 py-6 border-b border-sidebar-border">
        <Link to="/" onClick={() => setMobileOpen(false)}>
          <HiveLogo size={36} showText />
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-hive-gold/10 text-hive-gold border border-hive-gold/20"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-hive-gold/20 flex items-center justify-center text-hive-gold font-bold text-sm">
            {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{user?.full_name || "User"}</p>
            <p className="text-xs text-muted-foreground">{GRADE_LABELS[user?.clinical_grade] || "NCHD"}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border">
        <NavContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 flex flex-col bg-sidebar border-r border-sidebar-border animate-slide-up">
            <button className="absolute top-4 right-4 text-muted-foreground" onClick={() => setMobileOpen(false)}>
              <X className="w-5 h-5" />
            </button>
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setMobileOpen(true)} className="text-foreground">
            <Menu className="w-6 h-6" />
          </button>
          <HiveLogo size={28} />
        </header>
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
}