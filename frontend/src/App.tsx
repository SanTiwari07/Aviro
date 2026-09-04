import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import CommandPalette from './components/CommandPalette';
import EvidenceDrawer from './components/EvidenceDrawer';
import ReconciliationModal from './components/ReconciliationModal';
import ThemeToggle from './components/ThemeToggle';

import ControlCenter from './pages/ControlCenter';
import Overview from './pages/Overview';
import Reconciliation from './pages/Reconciliation';
import Exceptions from './pages/Exceptions';
import Settlements from './pages/Settlements';
import CashPosition from './pages/CashPosition';
import Runs from './pages/Runs';
import Audit from './pages/Audit';
import Ask from './pages/Ask';
import Benchmark from './pages/Benchmark';

import { Play, Search } from 'lucide-react';
import { api } from './api';
import arivoLogo from './assets/arivo-logo.png';
import arivoName from './assets/arivo-name.png';

export default function App() {
  const [currentSource, setCurrentSource] = useState<string>('synthetic');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);

  // Global keyboard shortcuts (Cmd+K / Ctrl+K and Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
        setIsReconcileModalOpen(false);
        setSelectedCaseId(null);
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
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Dedicated ARIVO Control Center (Editorial Entry Flow) */}
          <Route path="/" element={<ControlCenter />} />
          <Route path="/control-center" element={<ControlCenter />} />

          {/* Institutional Financial Control Room Shell */}
          <Route
            path="/*"
            element={
              <div className="flex h-screen w-full bg-canvas text-content-primary overflow-hidden font-sans antialiased">
                {/* Institutional Left Sidebar */}
                <Sidebar
                  currentSource={currentSource}
                  onSourceChange={setCurrentSource}
                  onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
                />

                {/* Main Application Area - stationary in both collapsed and expanded overlay states */}
                <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0 pl-3.5">
                  {/* Precision Top Header */}
                  <header className="h-14 border-b border-border bg-surface/85 backdrop-blur-sm px-6 flex items-center justify-between shrink-0 select-none z-10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={arivoLogo}
                          alt="ARIVO Logo"
                          className="h-5 w-auto object-contain shrink-0"
                        />
                        <img
                          src={arivoName}
                          alt="ARIVO"
                          className="h-3.5 w-auto object-contain shrink-0 hidden sm:block dark:brightness-[4.8]"
                        />
                      </div>
                      <span className="text-content-muted text-xs">•</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono text-content-muted">Workspace:</span>
                        <span className="text-xs font-mono font-bold text-brand uppercase tracking-wider">
                          {currentSource === 'razorpay_test' ? 'RAZORPAY TEST STORE' : currentSource}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* Quick Actions Search Trigger */}
                      <button
                        onClick={() => setIsCommandPaletteOpen(true)}
                        className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-surface-elevated hover:bg-surface-sunken border border-border text-xs text-content-muted hover:text-content-primary transition-colors group shadow-subtle"
                        title="Quick Actions (⌘K)"
                      >
                        <Search className="w-3.5 h-3.5 text-content-muted group-hover:text-content-secondary" />
                        <span className="text-xs font-medium">Quick Actions</span>
                        <kbd className="font-mono text-[10px] px-1 py-0.2 rounded bg-surface border border-border text-content-muted">
                          ⌘K
                        </kbd>
                      </button>

                      {/* Run Reconciliation Primary Button */}
                      <button
                        onClick={() => setIsReconcileModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-card transition-all active:scale-[0.98]"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Run Reconciliation</span>
                      </button>

                      {/* Theme Toggle (Sun / Moon) */}
                      <ThemeToggle />
                    </div>
                  </header>

                  {/* Scrollable Page Canvas */}
                  <main className="flex-1 overflow-y-auto p-6 bg-canvas transition-colors">
                    <Routes>
                      <Route
                        path="overview"
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
                        path="reconciliation"
                        element={
                          <Reconciliation
                            onOpenCase={handleOpenCase}
                            currentSource={currentSource}
                          />
                        }
                      />
                      <Route
                        path="exceptions"
                        element={
                          <Exceptions
                            onOpenCase={handleOpenCase}
                            currentSource={currentSource}
                          />
                        }
                      />
                      <Route
                        path="settlements"
                        element={<Settlements currentSource={currentSource} onOpenCase={handleOpenCase} />}
                      />
                      <Route path="cash-position" element={<CashPosition />} />
                      <Route path="runs" element={<Runs />} />
                      <Route path="audit" element={<Audit />} />
                      <Route path="ask" element={<Ask onOpenCase={handleOpenCase} />} />
                      <Route
                        path="benchmark"
                        element={<Benchmark onOpenCase={handleOpenCase} />}
                      />
                      {/* Catch-all within shell redirects to overview */}
                      <Route path="*" element={<Navigate to="/overview" replace />} />
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
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
