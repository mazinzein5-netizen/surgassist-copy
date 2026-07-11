import React, { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import HiveLogo from "./HiveLogo";
import AgentLauncher from "./AgentLauncher";
import { FolderOpen, Users, ClipboardList, MoreHorizontal, LogOut, FilePlus2, LayoutDashboard, AlertTriangle, Activity, MessageSquare, User, ChevronDown } from "lucide-react";

const MAIN_NAV = [
  { to: "/", label: "Referrals", icon: FolderOpen },
  { to: "/patient-history", label: "Patients", icon: Users },
  { to: "/theatre-log", label: "Theatre", icon: ClipboardList },
];

const MORE_NAV = [
  { to: "/new-referral", label: "New Referral", icon: FilePlus2 },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inews-consult", label: "INEWS Consult", icon: AlertTriangle },
  { to: "/inpatient-monitor", label: "Inpatient Monitor", icon: Activity },
  { to: "/handover", label: "Handover", icon: Users },
  { to: "/contacts", label: "Contacts", icon: MessageSquare },
  { to: "/profile", label: "Profile", icon: User },
];

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = async () => { await logout(); };
  const isActive = (to) => location.pathname === to;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col bg-card border-r border-border">
        <div className="px-5 py-5 border-b border-border">
          <Link to="/"><HiveLogo size={28} showText /></Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {MAIN_NAV.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.to) ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* More dropdown */}
        <div className="px-3 relative">
          <button
            onClick={() => setMoreOpen(v => !v)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-colors ${
              moreOpen ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <MoreHorizontal className="w-4 h-4 flex-shrink-0" />
            More
            <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${moreOpen ? "rotate-180" : ""}`} />
          </button>
          {moreOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-10">
              {MORE_NAV.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                      isActive(item.to) ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* User + logout */}
        <div className="px-3 py-3 border-t border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground font-medium text-sm">
              {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{user?.full_name || "User"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-muted transition-colors w-full"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto scrollbar-thin pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex items-center justify-around z-40">
        {MAIN_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 py-2 px-4 ${isActive(item.to) ? "text-foreground" : "text-muted-foreground"}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(v => !v)}
          className={`flex flex-col items-center gap-0.5 py-2 px-4 ${moreOpen ? "text-foreground" : "text-muted-foreground"}`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>

      {/* Mobile More sheet */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-16 left-0 right-0 bg-card border-t border-border rounded-t-xl p-3 space-y-1">
            {MORE_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMoreOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${isActive(item.to) ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}

      <AgentLauncher />
    </div>
  );
}