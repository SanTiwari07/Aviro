import React, { useState, useRef, useEffect } from 'react';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navItems = [
    { label: 'Overview', path: '/overview', icon: LayoutDashboard },
    { label: 'Reconciliation', path: '/reconciliation', icon: FileSpreadsheet },
    { label: 'Exceptions', path: '/exceptions', icon: AlertTriangle },
    { label: 'Settlements', path: '/settlements', icon: Layers },
    { label: 'Cash Position', path: '/cash-position', icon: TrendingUp },
    { label: 'Runs History', path: '/runs', icon: History },
    { label: 'Audit & Controls', path: '/audit', icon: ShieldCheck },
    { label: 'Ask Arivo', path: '/ask', icon: Terminal },
    { label: 'Benchmark', path: '/benchmark', icon: Scale },
  ];

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsExpanded(true);
  };

  const handleMouseLeave = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
    }
    leaveTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
    }, 180);
  };

  // Extra safety: detect when mouse approaches the far-left edge of the screen (<= 14px)
  useEffect(() => {
    if (isExpanded) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientX <= 14) {
        if (leaveTimeoutRef.current) {
          clearTimeout(leaveTimeoutRef.current);
          leaveTimeoutRef.current = null;
        }
        setIsExpanded(true);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isExpanded]);

  // Collapse on ESC key if expanded
  useEffect(() => {
    if (!isExpanded) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Subtle non-blocking backdrop overlay for visual focus while expanded */}
      <div
        className={`fixed inset-0 bg-black/20 backdrop-blur-[1px] z-30 transition-opacity duration-[250ms] pointer-events-none ${
          isExpanded ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <aside
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`fixed top-0 left-0 w-64 h-screen bg-[#012652] text-slate-100 flex flex-col select-none border-r border-[#0D94FB]/30 shadow-2xl z-40 transition-transform duration-[250ms] ease-in-out overflow-hidden ${
          isExpanded ? 'translate-x-0' : '-translate-x-[calc(100%-14px)]'
        }`}
        style={{ willChange: 'transform' }}
      >
        {/* Collapsed Hover-Trigger Strip Indicator */}
        <div
          className={`absolute top-0 right-0 w-3.5 h-full bg-[#012652] border-r border-[#0D94FB]/30 flex flex-col items-center justify-center transition-opacity duration-200 pointer-events-none z-10 ${
            isExpanded ? 'opacity-0' : 'opacity-100'
          }`}
          title="Hover to expand navigation"
        >
          <div className="w-1 h-14 rounded-full bg-[#0D94FB]/60 shadow-[0_0_8px_rgba(13,148,251,0.5)]" />
        </div>

        {/* Full Sidebar Navigation Surface */}
        <div
          className={`w-64 h-full flex flex-col transition-opacity duration-200 ${
            isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Brand Header */}
          <div className="p-4 border-b border-white/10 shrink-0">
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
                  </div>
                  <p className="text-[10px] text-slate-300 font-medium truncate mt-0.5">
                    Enterprise AI Finance
                  </p>
                </div>
              </NavLink>
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
              onClick={() => {
                onOpenCommandPalette();
                setIsExpanded(false);
              }}
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
                    <Icon className="w-4 h-4 opacity-80 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
