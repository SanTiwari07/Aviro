import React from 'react';
import { NavLink } from 'react-router-dom';
import arivoLogo from '../assets/arivo-logo.png';
import arivoName from '../assets/arivo-name.png';
import {
  LayoutDashboard,
  FileSpreadsheet,
  AlertTriangle,
  Layers,
  TrendingUp,
  History,
  ShieldCheck,
  Terminal,
  Scale,
  Search,
  CheckCircle2,
  Cpu,
  Database,
  ChevronDown,
} from 'lucide-react';

interface SidebarProps {
  currentSource: string;
  onSourceChange: (source: string) => void;
  onOpenCommandPalette: () => void;
}

export default function Sidebar({
  currentSource,
  onSourceChange,
  onOpenCommandPalette,
}: SidebarProps) {
  const navItems = [
    { label: 'Overview', path: '/', icon: LayoutDashboard },
    { label: 'Reconciliation', path: '/reconciliation', icon: FileSpreadsheet },
    { label: 'Exceptions', path: '/exceptions', icon: AlertTriangle },
    { label: 'Settlements', path: '/settlements', icon: Layers },
    { label: 'Cash Position', path: '/cash-position', icon: TrendingUp },
    { label: 'Runs History', path: '/runs', icon: History },
    { label: 'Audit & Controls', path: '/audit', icon: ShieldCheck },
    { label: 'Ask Arivo', path: '/ask', icon: Terminal, badge: 'AI' },
    { label: 'Benchmark', path: '/benchmark', icon: Scale },
  ];

  return (
    <aside className="w-64 bg-[#012652] text-slate-100 flex flex-col h-screen sticky top-0 select-none border-r border-[#0D94FB]/20 shadow-elevated z-20">
      {/* Brand Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2.5 min-w-0 group" title="ARIVO Enterprise AI Finance">
            <img
              src={arivoLogo}
              alt="ARIVO Logo"
              className="h-8 w-auto object-contain shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1.5">
                <img
                  src={arivoName}
                  alt="ARIVO"
                  className="h-5 w-auto object-contain shrink-0 brightness-[4.8]"
                />
                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#0D94FB]/25 text-[#0D94FB] font-bold border border-[#0D94FB]/40 shrink-0">
                  CONTROLLER
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium truncate mt-0.5">
                Enterprise AI Finance
              </p>
            </div>
          </NavLink>
          <div className="flex items-center gap-1" title="Control Gate Active">
            <span className="w-2 h-2 rounded-full bg-status-mint animate-pulse" />
          </div>
        </div>

        {/* Workspace Switcher */}
        <div className="mt-3.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Active Workspace
          </label>
          <div className="relative">
            <select
              value={currentSource}
              onChange={(e) => onSourceChange(e.target.value)}
              className="w-full bg-[#071E3D] hover:bg-[#0A264D] border border-white/15 text-slate-200 text-xs rounded-md px-2.5 py-1.5 appearance-none focus:outline-none focus:border-[#0D94FB] transition-colors cursor-pointer font-sans"
            >
              <option value="synthetic">Synthetic Benchmark (5,114 txns)</option>
              <option value="razorpay_test">Razorpay Test Store · Synthetic Data</option>
              <option value="all">Unified Global Ledger (All)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
          </div>
        </div>

        {/* Quick Search Button */}
        <button
          onClick={onOpenCommandPalette}
          className="mt-2.5 w-full flex items-center justify-between px-2.5 py-1.5 rounded-md bg-[#071E3D]/80 hover:bg-[#0A264D] border border-white/10 text-xs text-slate-300 hover:text-white transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200" />
            <span className="text-xs">Quick Switcher...</span>
          </div>
          <kbd className="font-mono text-[10px] px-1 py-0.2 rounded bg-[#012652] border border-white/20 text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2.5 py-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#0D94FB]/18 text-white font-semibold border-l-2 border-[#0D94FB] shadow-subtle'
                    : 'text-slate-300 hover:bg-white/8 hover:text-white border-l-2 border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 opacity-80" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#8B7CFF]/20 text-[#A79CFF] border border-[#8B7CFF]/30 font-bold">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Institutional System Health Telemetry Footer */}
      <div className="p-3 border-t border-white/10 bg-[#001D40] text-[11px] space-y-2 font-mono">
        <div className="flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-mint" />
            <span className="text-slate-200">Control Gate</span>
          </div>
          <span className="text-status-mint font-semibold">7/7 Invariants</span>
        </div>

        <div className="flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-[#8B7CFF]" />
            <span className="text-slate-200">AI Investigation</span>
          </div>
          <span className="text-[#A79CFF] font-medium">Investigation Engine</span>
        </div>

        <div className="flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-brand" />
            <span className="text-slate-200">Precision</span>
          </div>
          <span className="text-slate-100">0 Paise Tol.</span>
        </div>
      </div>
    </aside>
  );
}
