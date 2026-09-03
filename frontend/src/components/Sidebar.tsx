import React from 'react';
import { NavLink } from 'react-router-dom';
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
    { label: 'Ask Arivo', path: '/ask', icon: Terminal },
    { label: 'Benchmark', path: '/benchmark', icon: Scale },
  ];

  return (
    <aside className="w-64 bg-navy-900 border-r border-navy-700/80 flex flex-col h-screen sticky top-0 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-navy-700/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-blue to-navy-700 flex items-center justify-center font-mono font-bold text-sm text-white shadow-card">
              AR
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm tracking-wider text-tprimary">ARIVO</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-brand-blue/15 text-brand-blue font-semibold border border-brand-blue/30">
                  CONTROLLER
                </span>
              </div>
              <p className="text-[11px] text-tmuted font-medium">Enterprise AI Finance</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5" title="System Operational">
            <span className="w-2 h-2 rounded-full bg-status-matched animate-pulse" />
          </div>
        </div>

        {/* Workspace Switcher */}
        <div className="mt-4">
          <label className="text-[10px] font-mono uppercase tracking-wider text-tmuted block mb-1.5">
            Active Workspace
          </label>
          <div className="relative">
            <select
              value={currentSource}
              onChange={(e) => onSourceChange(e.target.value)}
              className="w-full bg-navy-850 border border-navy-700 text-tprimary text-xs rounded-lg px-2.5 py-2 appearance-none focus:outline-none focus:border-brand-blue transition-colors cursor-pointer"
            >
              <option value="synthetic">Synthetic Benchmark (5,114 txns)</option>
              <option value="razorpay">Razorpay Test Store</option>
              <option value="all">Unified Global Ledger (All)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-tmuted absolute right-2.5 top-2.5 pointer-events-none" />
          </div>
        </div>

        {/* Global Quick Search Button */}
        <button
          onClick={onOpenCommandPalette}
          className="mt-3 w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-navy-850/80 hover:bg-navy-800 border border-navy-700 text-xs text-tmuted transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-tmuted group-hover:text-tsecondary" />
            <span className="text-xs group-hover:text-tsecondary">Quick Switcher...</span>
          </div>
          <kbd className="font-mono text-[10px] px-1 py-0.5 rounded bg-navy-900 border border-navy-700 text-tmuted">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-blue/15 text-brand-blue border border-brand-blue/30 font-semibold'
                    : 'text-tsecondary hover:bg-navy-800/60 hover:text-tprimary border border-transparent'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Institutional Telemetry Footer */}
      <div className="p-3 border-t border-navy-700/80 bg-navy-950/60 text-[11px] space-y-2 font-mono">
        <div className="flex items-center justify-between text-tmuted">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-status-matched" />
            <span className="text-tsecondary">Control Gate</span>
          </div>
          <span className="text-status-matched font-semibold">7/7 Invariants</span>
        </div>

        <div className="flex items-center justify-between text-tmuted">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-brand-blue" />
            <span className="text-tsecondary">AI Engine</span>
          </div>
          <span className="text-tprimary">Gemini 2.5</span>
        </div>

        <div className="flex items-center justify-between text-tmuted">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-status-review" />
            <span className="text-tsecondary">Precision</span>
          </div>
          <span className="text-tprimary">0 Paise Tol.</span>
        </div>
      </div>
    </aside>
  );
}
