import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api, formatNumber } from '../api';
import { Play, CheckCircle2, AlertCircle, Loader2, X, ArrowRight, ShieldCheck, Database, Cpu } from 'lucide-react';

interface ReconciliationModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: string;
  onSuccess?: () => void;
}

const STAGES = [
  { id: 1, name: 'Data Normalization', desc: 'Sanitizing transaction IDs, converting minor units to integer paise' },
  { id: 2, name: 'Deterministic Exact ID Match', desc: 'Direct reference resolution & single unallocated candidate verification' },
  { id: 3, name: 'Settlement Waterfall Audit', desc: 'Net = Gross - Fees - Tax - Refunds. Detecting unexplained deltas' },
  { id: 4, name: 'AI Ambiguity Investigation', desc: 'Gemini semantic reasoning on partial and date/amount candidates' },
  { id: 5, name: 'Authoritative Control Gate', desc: 'Evaluating 7 financial invariants. Vetoing ambiguous high-value matches' },
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

  const handleStart = async () => {
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-xl bg-navy-850 border border-navy-700 rounded-xl shadow-elevated overflow-hidden z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-navy-700 bg-navy-900/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-brand-blue/15 text-brand-blue border border-brand-blue/30">
                  <Play className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-tprimary">Execute Reconciliation Pipeline</h3>
                  <p className="text-xs text-tmuted font-mono">Workspace: {source.toUpperCase()}</p>
                </div>
              </div>
              {!running && (
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-tmuted hover:text-tprimary hover:bg-navy-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {!result && !error && (
                <>
                  <p className="text-xs text-tsecondary leading-relaxed">
                    Executing the 6-stage deterministic and AI reconciliation pipeline over the active ledger.
                    All financial arithmetic is calculated in integer paise. The Control Gate verifies all 7 invariants before committing final statuses.
                  </p>

                  {/* Stage Progress Tracker */}
                  <div className="space-y-3">
                    {STAGES.map((s) => {
                      const isDone = currentStage > s.id;
                      const isCurrent = currentStage === s.id;
                      return (
                        <div
                          key={s.id}
                          className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors ${
                            isCurrent
                              ? 'bg-navy-800/80 border-brand-blue/40'
                              : isDone
                              ? 'bg-navy-900/40 border-navy-700/60'
                              : 'bg-transparent border-transparent opacity-60'
                          }`}
                        >
                          <div className="mt-0.5">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-status-matched" />
                            ) : isCurrent ? (
                              <Loader2 className="w-4 h-4 text-brand-blue animate-spin" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-navy-600 flex items-center justify-center text-[10px] text-tmuted font-mono">
                                {s.id}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-tprimary">{s.name}</p>
                            <p className="text-[11px] text-tmuted">{s.desc}</p>
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
                  <div className="p-4 rounded-xl bg-status-matched/10 border border-status-matched/30 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-status-matched flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-status-matched">Reconciliation Completed Successfully</p>
                      <p className="text-xs text-tsecondary">All records partitioned under 7 financial invariants.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-navy-900 rounded-lg border border-navy-700">
                      <p className="text-[10px] font-mono uppercase text-tmuted">Processed</p>
                      <p className="text-xl font-bold font-mono text-tprimary mt-1">
                        {formatNumber(result.total_processed || result.cases_saved)}
                      </p>
                    </div>
                    <div className="p-3 bg-navy-900 rounded-lg border border-navy-700">
                      <p className="text-[10px] font-mono uppercase text-tmuted">Matched</p>
                      <p className="text-xl font-bold font-mono text-status-matched mt-1">
                        {formatNumber(result.matched)}
                      </p>
                    </div>
                    <div className="p-3 bg-navy-900 rounded-lg border border-navy-700">
                      <p className="text-[10px] font-mono uppercase text-tmuted">Review / Exception</p>
                      <p className="text-xl font-bold font-mono text-status-review mt-1">
                        {formatNumber((result.review || 0) + (result.exceptions || 0))}
                      </p>
                    </div>
                  </div>

                  {result.duration_ms && (
                    <div className="flex items-center justify-between text-xs font-mono text-tmuted px-1">
                      <span>Execution Duration: {result.duration_ms} ms</span>
                      <span>Throughput: {result.throughput || '—'}</span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 rounded-xl bg-status-exception/10 border border-status-exception/30 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-status-exception flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-status-exception">Reconciliation Failed</p>
                    <p className="text-xs text-tsecondary">{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-navy-700 bg-navy-900/60 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={running}
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-medium text-tsecondary hover:text-tprimary hover:bg-navy-800 rounded-lg transition-colors disabled:opacity-50"
              >
                {result ? 'Close' : 'Cancel'}
              </button>

              {!result && (
                <button
                  type="button"
                  disabled={running}
                  onClick={handleStart}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-brand-blue hover:bg-brand-hover text-white rounded-lg transition-colors shadow-card disabled:opacity-50"
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
