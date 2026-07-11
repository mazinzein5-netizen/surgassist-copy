import React, { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import AgentLauncher from "./AgentLauncher";
import { FolderOpen, Users, ClipboardList, MoreHorizontal, LogOut, FilePlus2, AlertTriangle, Activity, BedDouble, MessageSquare, User, X, LayoutDashboard } from "lucide-react";

const MAIN_NAV = [
  { to: "/", label: "Referrals", icon: FolderOpen },
  { to: "/patients", label: "Patients", icon: Users },
  { to: "/theatre-log", label: "Theatre", icon: ClipboardList },
];

const MORE_NAV = [
  { to: "/new-referral", label: "New Referral", icon: FilePlus2 },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inews-consult", label: "INEWS Consult", icon: AlertTriangle },
  { to: "/inpatient-monitor", label: "Inpatient Monitor", icon: Activity },
  { to: "/handover", label: "Handover", icon: BedDouble },
  { to: "/patient-history", label: "Patient Memory", icon: FolderOpen },
  { to: "/contacts", label: "Contacts", icon: MessageSquare },
  { to: "/profile", label: "Profile", icon: User },
];

export default function AppLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (to) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  const handleLogout = async () => { await logout(); };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 flex-col bg-white border-r border-gray-200">
        <div className="px-5 py-6 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900">HIVE</h1>
          <p className="text-xs text-gray-400 mt-0.5">Surgical Assistant</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {MAIN_NAV.map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.to) ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"
                }`}>
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* More dropdown */}
        <div className="relative px-3 pb-2">
          {moreOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
              <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-20">
                {MORE_NAV.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.to} to={item.to} onClick={() => setMoreOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </>
          )}
          <button onClick={() => setMoreOpen(!moreOpen)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 w-full">
            <MoreHorizontal className="w-4 h-4 flex-shrink-0" />
            More
          </button>
        </div>

        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-bold text-sm">
              {user?.full_name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.full_name || "User"}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors w-full">
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 flex">
        {MAIN_NAV.map(item => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 ${
                isActive(item.to) ? "text-gray-900" : "text-gray-400"
              }`}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button onClick={() => setMoreOpen(true)}
          className="flex-1 flex flex-col items-center gap-1 py-2.5 text-gray-400">
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] font-medium">More</span>
        </button>
      </div>

      {/* Mobile More sheet */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 pb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-900">More</h2>
              <button onClick={() => setMoreOpen(false)} className="text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {MORE_NAV.map(item => {
                const Icon = item.icon;
                return (
                  <Link key={item.to} to={item.to} onClick={() => setMoreOpen(false)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50">
                    <Icon className="w-5 h-5 text-gray-600" />
                    <span className="text-xs text-gray-600 text-center">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <button onClick={handleLogout}
              className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm text-red-600 bg-red-50">
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto scrollbar-thin pb-16 md:pb-0">
          <Outlet />
        </main>
      </div>

      <AgentLauncher />
    </div>
  );
}