import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, LayoutDashboard, FileSpreadsheet, AlertTriangle, Layers, TrendingUp, History, ShieldCheck, Terminal, Scale, Download, RefreshCw, Play, ArrowRight, CornerDownLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCase?: (caseId: string) => void;
  onTriggerReconcile?: () => void;
  onSyncRazorpay?: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onOpenCase,
  onTriggerReconcile,
  onSyncRazorpay,
}: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const navItems = [
    { label: 'Overview — Financial Control Room', path: '/', icon: LayoutDashboard, category: 'Navigation' },
    { label: 'Reconciliation Ledger', path: '/reconciliation', icon: FileSpreadsheet, category: 'Navigation' },
    { label: 'Exceptions & Discrepancies', path: '/exceptions', icon: AlertTriangle, category: 'Navigation' },
    { label: 'Settlements & Waterfall Batches', path: '/settlements', icon: Layers, category: 'Navigation' },
    { label: 'Cash Position & Forecast', path: '/cash-position', icon: TrendingUp, category: 'Navigation' },
    { label: 'Reconciliation Runs History', path: '/runs', icon: History, category: 'Navigation' },
    { label: 'Audit & Invariant Verification', path: '/audit', icon: ShieldCheck, category: 'Navigation' },
    { label: 'Ask Arivo — Grounded Investigation Copilot', path: '/ask', icon: Terminal, category: 'Navigation' },
    { label: 'Controlled Synthetic Benchmark', path: '/benchmark', icon: Scale, category: 'Navigation' },
  ];

  const quickActions = [
    {
      label: 'Run Deterministic Reconciliation Engine',
      action: () => {
        onClose();
        onTriggerReconcile?.();
      },
      icon: Play,
      category: 'Action',
    },
    {
      label: 'Sync Ingestion from Razorpay Test Mode',
      action: () => {
        onClose();
        onSyncRazorpay?.();
      },
      icon: RefreshCw,
      category: 'Action',
    },
    {
      label: 'Inspect Flagship AI Safety Scenario (PAY_FLAGSHIP_001)',
      action: () => {
        onClose();
        onOpenCase?.('CASE_PAY_FLAGSHIP_001');
      },
      icon: ShieldCheck,
      category: 'Safety Demo',
    },
  ];

  // If query looks like an ID, add direct search action
  const idSearchAction = query.trim().length > 3 ? [{
    label: `Inspect Entity Reference "${query.trim()}"`,
    action: () => {
      onClose();
      onOpenCase?.(query.trim());
    },
    icon: Search,
    category: 'Direct Search',
  }] : [];

  const allItems = [
    ...idSearchAction,
    ...quickActions.filter(a => a.label.toLowerCase().includes(query.toLowerCase())),
    ...navItems.filter(n => n.label.toLowerCase().includes(query.toLowerCase())),
  ];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, allItems.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allItems.length) % Math.max(1, allItems.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const current = allItems[selectedIndex];
      if (current) {
        if ('path' in current && current.path) {
          navigate(current.path);
          onClose();
        } else if ('action' in current && typeof current.action === 'function') {
          current.action();
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-2xl bg-surface border border-border rounded-xl shadow-elevated overflow-hidden z-10"
            onKeyDown={handleKeyDown}
          >
            {/* Input Header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border bg-surface-elevated">
              <Search className="w-5 h-5 text-content-muted" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search commands, pages, or paste any Transaction / Settlement ID..."
                className="w-full bg-transparent text-content-primary placeholder-content-muted text-sm outline-none font-sans"
              />
              <span className="text-[11px] font-mono text-content-muted px-1.5 py-0.5 rounded border border-border bg-surface-sunken">
                ESC
              </span>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto p-2 space-y-1">
              {allItems.length === 0 ? (
                <div className="p-8 text-center text-sm text-content-muted">
                  No matching commands or entities found for "{query}".
                </div>
              ) : (
                allItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={`${item.category}-${item.label}`}
                      onClick={() => {
                        if ('path' in item && item.path) {
                          navigate(item.path);
                          onClose();
                        } else if ('action' in item && typeof item.action === 'function') {
                          item.action();
                        }
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-colors ${
                        isSelected
                          ? 'bg-brand/12 text-content-primary border border-brand/35 shadow-subtle'
                          : 'text-content-secondary hover:bg-surface-elevated border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-1.5 rounded-md ${
                            isSelected ? 'bg-brand/20 text-brand' : 'bg-surface-sunken text-content-muted border border-border'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-xs sm:text-sm">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-wider font-mono text-content-muted px-1.5 py-0.5 rounded bg-surface-sunken border border-border">
                          {item.category}
                        </span>
                        {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-brand" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-border bg-surface-elevated flex items-center justify-between text-[11px] text-content-muted">
              <div className="flex items-center gap-3 font-mono">
                <span>Navigate <kbd className="bg-surface-sunken px-1.5 py-0.5 rounded border border-border">↑↓</kbd></span>
                <span>Select <kbd className="bg-surface-sunken px-1.5 py-0.5 rounded border border-border">↵</kbd></span>
              </div>
              <span className="font-mono uppercase tracking-wider text-[10px]">ARIVO FINANCIAL SWITCHER</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
