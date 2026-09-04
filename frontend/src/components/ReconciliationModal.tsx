import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api, formatNumber } from '../api';
import {
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface ReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: string;
  onSuccess?: () => void;
}

const STAGES = [
  { id: 1, name: 'Data Normalization', desc: 'Sanitizing transaction IDs, converting minor units to integer paise' },
  { id: 2, name: 'Deterministic Exact ID Match', desc: 'Direct reference resolution & single unallocated candidate verification' },
  { id: 3, name: 'Settlement Waterfall Audit', desc: 'Net = Gross − Fees − Tax − Refunds. Detecting unexplained deltas' },
  { id: 4, name: 'AI Ambiguity Investigation', desc: 'Investigation Engine semantic reasoning on partial and date/amount candidates', isAi: true },
  { id: 5, name: 'Authoritative Control Gate', desc: 'Evaluating 7 financial invariants. Vetoing ambiguous high-value matches', isGate: true },
  { id: 6, name: 'Ledger Finalization', desc: 'Committing reconciled cases, audit stamps, and cash projections' },
];

export default function ReconciliationModal({
  isOpen,
  onClose,
  source,
  onSuccess,
}: ReconciliationModalProps) {
  const [running, setRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setResult(null);
      setError(null);
      setCurrentStage(0);
      setRunning(false);
    }
  }, [isOpen]);

  // Handle ESC key to close modal when not running
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !running) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, running, onClose]);

  const handleStart = async () => {
    if (running) return;
    setRunning(true);
    setError(null);
    setResult(null);

    // Simulate animated pipeline stages progression
    let stage = 1;
    setCurrentStage(1);

    const interval = setInterval(() => {
      stage += 1;
      if (stage <= 5) {
        setCurrentStage(stage);
      }
    }, 450);

    try {
      const res = await api.runReconciliation(source);
      clearInterval(interval);
      setCurrentStage(6);
      setResult(res);
      onSuccess?.();
    } catch (err: any) {
      clearInterval(interval);
      setError(err?.message || 'Reconciliation run failed.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !running && onClose()}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-xl bg-surface border border-border rounded-xl shadow-elevated overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-elevated">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-brand/10 text-brand border border-brand/20">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-content-primary">
                    Execute Reconciliation Pipeline
                  </h3>
                  <p className="text-xs text-content-muted font-mono">
                    Workspace: {source.toUpperCase()}
                  </p>
                </div>
              </div>
              {!running && (
                <button
                  onClick={onClose}
                  className="p-1 rounded-md text-content-muted hover:text-content-primary hover:bg-surface transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {!result && !error && (
                <>
                  <p className="text-xs text-content-secondary leading-relaxed">
                    Executing the 6-stage deterministic and AI reconciliation pipeline over the active ledger.
                    All financial arithmetic is calculated in integer paise. The Control Gate verifies all 7 invariants before committing final statuses.
                  </p>

                  {/* Stage Progress Tracker */}
                  <div className="space-y-2">
                    {STAGES.map((s) => {
                      const isDone = currentStage > s.id;
                      const isCurrent = currentStage === s.id;
                      return (
                        <div
                          key={s.id}
                          className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors ${
                            isCurrent
                              ? 'bg-brand/10 border-brand/40 shadow-subtle'
                              : isDone
                              ? 'bg-surface-sunken border-border'
                              : 'bg-transparent border-transparent opacity-50'
                          }`}
                        >
                          <div className="mt-0.5">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-status-mint" />
                            ) : isCurrent ? (
                              <Loader2 className="w-4 h-4 text-brand animate-spin" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-border flex items-center justify-center text-[10px] text-content-muted font-mono">
                                {s.id}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold text-content-primary">{s.name}</p>
                              {s.isAi && (
                                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#8B7CFF]/15 text-[#7462F5] dark:text-[#A79CFF] font-bold">
                                  AI
                                </span>
                              )}
                              {s.isGate && (
                                <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-status-mint/15 text-status-mint font-bold">
                                  GATE
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-content-muted">{s.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Success Result Summary */}
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-lg bg-[#04DB7C]/10 border border-[#04DB7C]/30 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-status-mint flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-status-mint">
                        Reconciliation Completed Successfully
                      </p>
                      <p className="text-xs text-content-secondary">
                        All records partitioned under 7 financial invariants with 0 unexplained variance.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-surface-sunken rounded-lg border border-border">
                      <p className="text-[10px] font-mono uppercase text-content-muted">Processed</p>
                      <p className="text-xl font-bold font-mono text-content-primary mt-1 tabular-nums">
                        {formatNumber(result.total_processed || result.cases_saved)}
                      </p>
                    </div>
                    <div className="p-3 bg-surface-sunken rounded-lg border border-border">
                      <p className="text-[10px] font-mono uppercase text-content-muted">Matched</p>
                      <p className="text-xl font-bold font-mono text-status-mint mt-1 tabular-nums">
                        {formatNumber(result.matched)}
                      </p>
                    </div>
                    <div className="p-3 bg-surface-sunken rounded-lg border border-border">
                      <p className="text-[10px] font-mono uppercase text-content-muted">Review / Exception</p>
                      <p className="text-xl font-bold font-mono text-[#D98A26] dark:text-[#FFB454] mt-1 tabular-nums">
                        {formatNumber((result.review || 0) + (result.exceptions || 0))}
                      </p>
                    </div>
                  </div>

                  {result.duration_ms && (
                    <div className="flex items-center justify-between text-xs font-mono text-content-muted px-1">
                      <span>Execution Duration: {result.duration_ms} ms</span>
                      <span>Throughput: {result.throughput || '-'} txns/s</span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-lg bg-[#FF647C]/10 border border-[#FF647C]/30 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-[#E03A53] dark:text-[#FF647C] flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-[#E03A53] dark:text-[#FF647C]">Reconciliation Failed</p>
                    <p className="text-xs text-content-secondary">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border bg-surface-elevated flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={running}
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-surface rounded-md transition-colors disabled:opacity-50"
              >
                {result ? 'Close' : 'Cancel'}
              </button>

              {!result && (
                <button
                  type="button"
                  disabled={running}
                  onClick={handleStart}
                  className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold bg-brand hover:bg-brand-hover text-white rounded-md transition-colors shadow-subtle disabled:opacity-50"
                >
                  {running ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Reconciling Active Ledger...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Reconciliation Run</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
