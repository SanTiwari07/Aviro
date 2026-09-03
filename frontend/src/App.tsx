import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import CommandPalette from './components/CommandPalette';
import EvidenceDrawer from './components/EvidenceDrawer';
import ReconciliationModal from './components/ReconciliationModal';

import Overview from './pages/Overview';
import Reconciliation from './pages/Reconciliation';
import Exceptions from './pages/Exceptions';
import Settlements from './pages/Settlements';
import CashPosition from './pages/CashPosition';
import Runs from './pages/Runs';
import Audit from './pages/Audit';
import Ask from './pages/Ask';
import Benchmark from './pages/Benchmark';

import { Play, Search, ShieldCheck } from 'lucide-react';
import { api } from './api';

export default function App() {
  const [currentSource, setCurrentSource] = useState<string>('synthetic');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);

  // Global keyboard shortcuts (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenCase = (caseId: string) => {
    setSelectedCaseId(caseId);
  };

  const handleCloseDrawer = () => {
    setSelectedCaseId(null);
  };

  const handleSyncRazorpayDirect = async () => {
    try {
      await api.syncRazorpay();
      alert('Razorpay snapshot refreshed.');
    } catch (err: any) {
      alert(`Razorpay Sync note: ${err.message}`);
    }
  };

  return (
    <Router>
      <div className="flex h-screen w-full bg-navy-950 text-tprimary overflow-hidden font-sans antialiased">
        {/* Institutional Left Sidebar */}
        <Sidebar
          currentSource={currentSource}
          onSourceChange={setCurrentSource}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        {/* Main Application Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Institutional Top Header */}
          <header className="h-14 border-b border-navy-700/80 bg-navy-900/60 px-6 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-tsecondary">ARIVO Controller</span>
              <span className="text-navy-600">•</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-tmuted">Workspace:</span>
                <span className="text-xs font-mono font-bold text-brand-blue uppercase">
                  {currentSource}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Quick Switcher Trigger */}
              <button
                onClick={() => setIsCommandPaletteOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-850 hover:bg-navy-800 border border-navy-700 text-xs text-tmuted hover:text-tsecondary transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Quick Actions</span>
                <kbd className="font-mono text-[10px] px-1 py-0.2 rounded bg-navy-900 border border-navy-700">
                  ⌘K
                </kbd>
              </button>

              {/* Run Reconciliation Quick Trigger */}
              <button
                onClick={() => setIsReconcileModalOpen(true)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand-blue hover:bg-brand-hover text-white text-xs font-semibold shadow-card transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Reconcile</span>
              </button>

              <div className="h-4 w-px bg-navy-700 mx-1" />

              {/* System Heartbeat */}
              <div className="flex items-center gap-2" title="Control Gate Active">
                <span className="w-2 h-2 rounded-full bg-status-matched animate-pulse" />
                <span className="text-xs font-mono text-status-matched font-medium hidden md:inline">
                  OPERATIONAL
                </span>
              </div>
            </div>
          </header>

          {/* Scrollable Page Body */}
          <main className="flex-1 overflow-y-auto p-6 bg-navy-950">
            <Routes>
              <Route
                path="/"
                element={
                  <Overview
                    source={currentSource}
                    onSourceChange={setCurrentSource}
                    onOpenCase={handleOpenCase}
                    onOpenReconcileModal={() => setIsReconcileModalOpen(true)}
                  />
                }
              />
              <Route
                path="/reconciliation"
                element={
                  <Reconciliation
                    onOpenCase={handleOpenCase}
                    currentSource={currentSource}
                  />
                }
              />
              <Route
                path="/exceptions"
                element={
                  <Exceptions
                    onOpenCase={handleOpenCase}
                    currentSource={currentSource}
                  />
                }
              />
              <Route
                path="/settlements"
                element={<Settlements currentSource={currentSource} />}
              />
              <Route path="/cash-position" element={<CashPosition />} />
              <Route path="/runs" element={<Runs />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/ask" element={<Ask onOpenCase={handleOpenCase} />} />
              <Route
                path="/benchmark"
                element={<Benchmark onOpenCase={handleOpenCase} />}
              />
            </Routes>
          </main>
        </div>

        {/* Global Slide-In Evidence Drawer */}
        <EvidenceDrawer
          caseId={selectedCaseId}
          onClose={handleCloseDrawer}
          onCaseUpdated={() => {
            // Trigger refresh if needed
          }}
        />

        {/* Global Command Palette */}
        <CommandPalette
          isOpen={isCommandPaletteOpen}
          onClose={() => setIsCommandPaletteOpen(false)}
          onOpenCase={handleOpenCase}
          onTriggerReconcile={() => setIsReconcileModalOpen(true)}
          onSyncRazorpay={handleSyncRazorpayDirect}
        />

        {/* Global Reconciliation Execution Modal */}
        <ReconciliationModal
          isOpen={isReconcileModalOpen}
          onClose={() => setIsReconcileModalOpen(false)}
          source={currentSource === 'all' ? 'synthetic' : currentSource}
          onSuccess={() => {
            // Refresh
          }}
        />
      </div>
    </Router>
  );
}
