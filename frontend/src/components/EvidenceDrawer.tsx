import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api, formatINR, formatDate, CaseDetail } from '../api';
import {
  X,
  FileText,
  UserCheck,
  Sparkles,
  AlertOctagon,
  CornerDownRight,
  Loader2,
} from 'lucide-react';
import StatusBadge from './StatusBadge';

interface EvidenceDrawerProps {
  caseId: string | null;
  onClose: () => void;
  onCaseUpdated?: () => void;
}

export default function EvidenceDrawer({
  caseId,
  onClose,
  onCaseUpdated,
}: EvidenceDrawerProps) {
  const [data, setData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolution action state
  const [resolving, setResolving] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const [showNotesModal, setShowNotesModal] = useState<string | null>(null);
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    api.getCaseDetail(caseId)
      .then((res) => {
        setData(res);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load case audit details.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [caseId]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showNotesModal) {
          setShowNotesModal(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showNotesModal]);

  const handleResolveAction = async (action: 'APPROVED' | 'REJECTED' | 'ESCALATED') => {
    if (!caseId) return;
    setResolving(true);
    setResolveError(null);
    try {
      await api.resolveCase(caseId, action, notesInput, 'Controller (SecOps)');
      setShowNotesModal(null);
      setNotesInput('');
      // Reload case detail
      const updated = await api.getCaseDetail(caseId);
      setData(updated);
      onCaseUpdated?.();
    } catch (err: any) {
      setResolveError(`Resolution failed: ${err.message || 'Unknown error'}`);
    } finally {
      setResolving(false);
    }
  };

  const c = data?.case;
  const payment = data?.payment;
  const settlement = data?.settlement_waterfall;
  const ai = data?.ai_investigation;
  const control = data?.control_gate;

  const isFlagshipSafetyScenario =
    c?.case_id === 'CASE_PAY_FLAGSHIP_001' ||
    (ai?.confidence && ai.confidence > 0.85 && control?.verdict === 'BLOCK');

  return (
    <AnimatePresence>
      {caseId && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Slide-out Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-surface border-l border-border shadow-drawer flex flex-col h-full z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-surface-elevated flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-brand/10 border border-brand/20 text-brand">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-content-primary">{caseId}</span>
                    {c && <StatusBadge status={c.status} size="sm" />}
                  </div>
                  <p className="text-xs text-content-muted font-mono mt-0.5">
                    Method: {c?.match_method || 'PENDING'} • Source: {c?.source || 'synthetic'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-md text-content-muted hover:text-content-primary hover:bg-surface transition-colors"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading && (
                <div className="py-20 flex flex-col items-center justify-center text-content-muted space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin text-brand" />
                  <p className="text-xs font-mono">Loading authoritative case provenance...</p>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-lg bg-[#FF647C]/10 border border-[#FF647C]/30 text-[#E03A53] dark:text-[#FF647C] text-xs font-mono">
                  {error}
                </div>
              )}

              {data && !loading && (
                <>
                  {/* Flagship AI Safety Juxtaposition Showcase */}
                  {isFlagshipSafetyScenario && (
                    <motion.div
                      initial={{ scale: 0.98, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="p-5 rounded-lg bg-surface-elevated border-l-4 border-l-[#8B7CFF] border border-border shadow-card space-y-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold tracking-wider text-[#7462F5] dark:text-[#A79CFF] uppercase">
                            CONTROL GATE SAFEGUARD
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-content-muted font-semibold">
                          Invariant 6: High-Value Protection
                        </span>
                      </div>

                      <div className="bg-surface-sunken p-3.5 rounded-lg border border-border">
                        <h4 className="text-sm font-bold text-content-primary mb-1">
                          "The AI is confident. The system is not."
                        </h4>
                        <p className="text-xs text-content-secondary leading-relaxed">
                          The Investigation Engine analyzed the transaction candidate pool and recommended{' '}
                          <span className="text-[#7462F5] dark:text-[#A79CFF] font-bold">
                            MATCH with {ai?.confidence ? `${(ai.confidence * 100).toFixed(0)}%` : '97%'} confidence
                          </span>.
                          However, Arivo's deterministic Control Gate blocked automatic finalization because candidate ambiguity combined with high monetary risk violates the zero-tolerance boundary.
                        </p>
                      </div>

                      {/* Visual Progression: VIOLET -> CORAL -> AMBER */}
                      <div className="grid grid-cols-3 gap-2.5 text-center text-xs font-mono">
                        <div className="p-2.5 rounded-md bg-surface border-2 border-[#8B7CFF]/40">
                          <p className="text-[10px] text-[#7462F5] dark:text-[#A79CFF] uppercase font-bold">1. Investigation Engine</p>
                          <p className="font-bold text-[#7462F5] dark:text-[#A79CFF] mt-0.5">
                            {ai?.confidence ? `${(ai.confidence * 100).toFixed(0)}% MATCH` : '97% MATCH'}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-md bg-surface border-2 border-[#FF647C]/40">
                          <p className="text-[10px] text-[#E03A53] dark:text-[#FF647C] uppercase font-bold">2. Control Gate</p>
                          <p className="font-bold text-[#E03A53] dark:text-[#FF647C] mt-0.5">BLOCK</p>
                        </div>
                        <div className="p-2.5 rounded-md bg-surface border-2 border-[#FFB454]/50">
                          <p className="text-[10px] text-[#D98A26] dark:text-[#FFB454] uppercase font-bold">3. Arivo Decision</p>
                          <p className="font-bold text-[#D98A26] dark:text-[#FFB454] mt-0.5">REVIEW</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Financial Provenance: Transaction vs Settlement Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Payment Record Card (Blue Accent Rail) */}
                    <div className="p-4 rounded-lg bg-surface border-l-2 border-l-brand border border-border shadow-subtle space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-content-muted font-semibold">
                          Payment Ledger
                        </span>
                        <span className="text-xs font-mono text-brand font-bold">
                          {payment?.payment_id || c?.payment_id || '-'}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-content-muted">Gross Amount:</span>
                          <span className="font-mono font-bold text-content-primary tabular-nums">
                            {formatINR(payment?.amount || c?.financial_impact)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-content-muted">Method:</span>
                          <span className="font-mono text-content-secondary">{payment?.method || 'Card / UPI'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-content-muted">Order ID:</span>
                          <span className="font-mono text-content-secondary">{payment?.order_id || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-content-muted">Captured At:</span>
                          <span className="font-mono text-content-secondary">{formatDate(payment?.created_at || c?.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Settlement Record Card (Mint Accent Rail) */}
                    <div className="p-4 rounded-lg bg-surface border-l-2 border-l-status-mint border border-border shadow-subtle space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-content-muted font-semibold">
                          Settlement Batch
                        </span>
                        <span className="text-xs font-mono text-content-primary font-bold">
                          {settlement?.settlement_id || c?.settlement_id || 'Unallocated'}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-content-muted">Deposited Net:</span>
                          <span className="font-mono font-bold text-status-mint tabular-nums">
                            {formatINR(settlement?.net_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-content-muted">Bank UTR:</span>
                          <span className="font-mono text-content-secondary">{settlement?.utr || 'Pending Clearing'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-content-muted">Batch Status:</span>
                          <span className="font-mono text-content-secondary">{settlement?.status || 'PROCESSED'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-content-muted">Batch Date:</span>
                          <span className="font-mono text-content-secondary">{formatDate(settlement?.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Settlement Waterfall Breakdown */}
                  {settlement && (
                    <div className="p-4 rounded-lg bg-surface border border-border shadow-subtle space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border">
                        <span className="text-xs font-bold text-content-primary font-mono">
                          Settlement Waterfall Arithmetic
                        </span>
                        <span className="text-[11px] font-mono text-content-muted">Integer Paise Exact</span>
                      </div>

                      <div className="space-y-1.5 text-xs font-mono bg-surface-sunken p-3 rounded-lg border border-border">
                        <div className="flex justify-between py-1 border-b border-border/80">
                          <span className="text-content-secondary flex items-center gap-2">
                            <span className="font-bold text-status-mint">+</span>
                            <span>Gross Captured Volume</span>
                          </span>
                          <span className="text-content-primary font-semibold tabular-nums">
                            {formatINR(settlement.gross_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/80">
                          <span className="text-content-muted flex items-center gap-2">
                            <span className="font-bold text-[#E03A53] dark:text-[#FF647C]">−</span>
                            <span>MDR Processing Fees</span>
                          </span>
                          <span className="text-[#E03A53] dark:text-[#FF647C] font-medium tabular-nums">
                            {formatINR(settlement.fees)}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-border/80">
                          <span className="text-content-muted flex items-center gap-2">
                            <span className="font-bold text-[#E03A53] dark:text-[#FF647C]">−</span>
                            <span>Statutory GST (18%)</span>
                          </span>
                          <span className="text-[#E03A53] dark:text-[#FF647C] font-medium tabular-nums">
                            {formatINR(settlement.tax)}
                          </span>
                        </div>
                        {settlement.refunds > 0 && (
                          <div className="flex justify-between py-1 border-b border-border/80">
                            <span className="text-content-muted flex items-center gap-2">
                              <span className="font-bold text-[#E03A53] dark:text-[#FF647C]">−</span>
                              <span>Net Customer Refunds</span>
                            </span>
                            <span className="text-[#E03A53] dark:text-[#FF647C] font-medium tabular-nums">
                              {formatINR(settlement.refunds)}
                            </span>
                          </div>
                        )}
                        {settlement.chargebacks > 0 && (
                          <div className="flex justify-between py-1 border-b border-border/80">
                            <span className="text-content-muted flex items-center gap-2">
                              <span className="font-bold text-[#E03A53] dark:text-[#FF647C]">−</span>
                              <span>Chargeback Deductions</span>
                            </span>
                            <span className="text-[#E03A53] dark:text-[#FF647C] font-medium tabular-nums">
                              {formatINR(settlement.chargebacks)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between py-1.5 font-bold text-sm border-t border-border bg-surface px-2 rounded">
                          <span className="text-content-primary flex items-center gap-2">
                            <span className="font-bold text-brand">=</span>
                            <span>Actual Bank Net Credit</span>
                          </span>
                          <span className="text-status-mint tabular-nums">
                            {formatINR(settlement.net_amount)}
                          </span>
                        </div>

                        {settlement.unexplained_delta > 0 && (
                          <div className="mt-2 p-2.5 rounded-lg bg-[#FF647C]/12 border border-[#FF647C]/30 flex items-center justify-between text-[#E03A53] dark:text-[#FF647C] font-bold">
                            <div className="flex items-center gap-2">
                              <AlertOctagon className="w-4 h-4" />
                              <span>UNEXPLAINED ARITHMETIC DELTA:</span>
                            </div>
                            <span className="tabular-nums font-mono text-sm">
                              {formatINR(settlement.unexplained_delta)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI Semantic Investigation Card (Violet Header & Elements) */}
                  <div className="p-4 rounded-lg bg-surface border-l-2 border-l-[#8B7CFF] border border-border shadow-subtle space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#8B7CFF]" />
                        <span className="text-xs font-bold text-content-primary">
                          AI Investigation
                        </span>
                      </div>
                      {ai?.confidence !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-content-muted">AI Confidence:</span>
                          <div className="w-16 h-1.5 bg-surface-sunken rounded-full overflow-hidden border border-border">
                            <div
                              className="h-full bg-[#8B7CFF] rounded-full"
                              style={{ width: `${Math.round(ai.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-bold text-[#7462F5] dark:text-[#A79CFF]">
                            {(ai.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-content-muted">Investigation Recommendation:</span>
                        <span className="font-mono font-bold text-content-primary px-2 py-0.5 rounded bg-surface-sunken border border-border">
                          {ai?.recommendation || 'NOT_INVOKED'}
                        </span>
                      </div>

                      <p className="text-content-secondary leading-relaxed bg-surface-sunken p-3 rounded-lg border border-border font-sans">
                        {ai?.summary || ai?.reason || 'Deterministic exact identifier match resolved with 0 delta. AI reasoning was not required.'}
                      </p>

                      {ai?.supporting_evidence && ai.supporting_evidence.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <span className="text-[11px] font-mono text-content-muted uppercase font-semibold">
                            Supporting Evidence Items:
                          </span>
                          <ul className="space-y-1">
                            {ai.supporting_evidence.map((ev, i) => (
                              <li key={i} className="flex items-start gap-2 text-content-muted font-mono text-[11px]">
                                <CornerDownRight className="w-3 h-3 text-[#8B7CFF] mt-0.5 flex-shrink-0" />
                                <span>{ev}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Technical Transparency & Model Audit Details */}
                      <div className="pt-2.5 mt-2 border-t border-border/70 text-[10px] font-mono text-content-muted flex flex-wrap items-center gap-x-4 gap-y-1">
                        <span>Engine: <strong className="text-content-secondary font-semibold">Investigation Engine</strong></span>
                        <span>Provider: <strong className="text-content-secondary font-semibold">Google</strong></span>
                        <span>Model: <strong className="text-content-secondary font-semibold">Gemini 2.5</strong></span>
                        <span>Status: <strong className="text-content-secondary font-semibold">{ai?.recommendation ? 'Completed' : 'Not Invoked'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Controller Resolution History if resolved */}
                  {c?.resolved_by && (
                    <div className="p-4 rounded-lg bg-surface border border-border shadow-subtle space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-status-mint" />
                          <span className="text-xs font-bold text-content-primary">Human Controller Resolution</span>
                        </div>
                        <span className="text-[11px] font-mono text-content-muted">{formatDate(c.resolved_at)}</span>
                      </div>
                      <div className="text-xs text-content-secondary space-y-1 font-mono">
                        <p>Action: <span className="font-bold text-content-primary">{c.resolution_action}</span> by <span className="text-brand">{c.resolved_by}</span></p>
                        {c.resolution_notes && (
                          <p className="text-content-muted italic bg-surface-sunken p-2 rounded border border-border">
                            "{c.resolution_notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Human Controller Action Footer Bar */}
            {data && (
              <div className="p-4 border-t border-border bg-surface-elevated flex items-center justify-between flex-shrink-0">
                <div className="text-xs text-content-muted font-mono">
                  Status: <span className="font-bold text-content-primary">{c?.status}</span>
                </div>

                <div className="flex items-center gap-2">
                  {c?.status !== 'MATCHED' && (
                    <button
                      disabled={resolving}
                      onClick={() => setShowNotesModal('APPROVED')}
                      className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#04DB7C] hover:bg-[#03b868] text-slate-950 transition-colors shadow-subtle disabled:opacity-50"
                    >
                      Approve Match
                    </button>
                  )}

                  {c?.status !== 'EXCEPTION' && (
                    <button
                      disabled={resolving}
                      onClick={() => setShowNotesModal('REJECTED')}
                      className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-[#FF647C] hover:bg-[#e05269] text-white transition-colors shadow-subtle disabled:opacity-50"
                    >
                      Reject Exception
                    </button>
                  )}

                  <button
                    disabled={resolving}
                    onClick={() => setShowNotesModal('ESCALATED')}
                    className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-surface hover:bg-surface-sunken text-content-secondary border border-border transition-colors disabled:opacity-50 shadow-subtle"
                  >
                    Escalate / Note
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Action Note Confirmation Modal */}
          {showNotesModal && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setShowNotesModal(null)}
              />
              <div className="relative w-full max-w-md bg-surface border border-border rounded-xl p-5 shadow-elevated z-10 space-y-4">
                <h4 className="text-sm font-bold text-content-primary">
                  {showNotesModal === 'APPROVED' && 'Approve & Confirm Match'}
                  {showNotesModal === 'REJECTED' && 'Reject & Mark as Exception'}
                  {showNotesModal === 'ESCALATED' && 'Escalate Case to Treasury'}
                </h4>
                <p className="text-xs text-content-muted">
                  This action is recorded in the permanent institutional audit log with your controller credentials.
                </p>

                {resolveError && (
                  <div className="p-2 rounded bg-[#FF647C]/15 border border-[#FF647C]/30 text-xs text-[#E03A53] dark:text-[#FF647C] font-mono">
                    {resolveError}
                  </div>
                )}

                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Enter audit rationale (e.g. Verified bank statement credit advice UTR...)"
                  className="w-full h-24 bg-surface-sunken border border-border rounded-lg p-2.5 text-xs text-content-primary placeholder-content-muted focus:outline-none focus:border-brand resize-none font-mono"
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={resolving}
                    onClick={() => setShowNotesModal(null)}
                    className="px-3 py-1.5 text-xs text-content-muted hover:text-content-primary rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={resolving}
                    onClick={() => handleResolveAction(showNotesModal as any)}
                    className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold bg-brand hover:bg-brand-hover text-white rounded-md shadow-subtle disabled:opacity-50"
                  >
                    {resolving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Decision'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
