import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { api, formatINR, formatDate, CaseDetail } from '../api';
import {
  X,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Cpu,
  FileText,
  UserCheck,
  Sparkles,
  ExternalLink,
  MessageSquare,
  AlertOctagon,
  CornerDownRight,
  Loader2,
} from 'lucide-react';

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
  const [showNotesModal, setShowNotesModal] = useState<string | null>(null); // 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'NOTE'

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
    try {
      await api.resolveCase(caseId, action, notesInput, 'Controller (SecOps)');
      setShowNotesModal(null);
      setNotesInput('');
      // Reload case detail
      const updated = await api.getCaseDetail(caseId);
      setData(updated);
      onCaseUpdated?.();
    } catch (err: any) {
      alert(`Resolution failed: ${err.message}`);
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
            className="relative w-full max-w-2xl bg-navy-900 border-l border-navy-700/80 shadow-drawer flex flex-col h-full z-10 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-navy-700 bg-navy-950/80 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-navy-800 border border-navy-700 text-brand-blue">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-tprimary">{caseId}</span>
                    {c && (
                      <span
                        className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold border ${
                          c.status === 'MATCHED'
                            ? 'bg-status-matched/15 text-status-matched border-status-matched/30'
                            : c.status === 'REVIEW'
                            ? 'bg-status-review/15 text-status-review border-status-review/30'
                            : 'bg-status-exception/15 text-status-exception border-status-exception/30'
                        }`}
                      >
                        {c.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-tmuted font-mono">
                    Method: {c?.match_method || 'PENDING'} • Source: {c?.source || 'synthetic'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-tmuted hover:text-tprimary hover:bg-navy-800 transition-colors"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading && (
                <div className="py-20 flex flex-col items-center justify-center text-tmuted space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-blue" />
                  <p className="text-xs font-mono">Loading authoritative case provenance...</p>
                </div>
              )}

              {error && (
                <div className="p-4 rounded-xl bg-status-exception/10 border border-status-exception/30 text-status-exception text-xs">
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
                      className="p-5 rounded-xl bg-gradient-to-br from-navy-850 via-navy-800 to-navy-850 border border-status-review/40 shadow-card space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-status-review" />
                          <span className="text-xs font-bold font-mono uppercase tracking-wider text-status-review">
                            Control Gate Invariant Safeguard
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-tmuted">Invariant 6: High-Value Protection</span>
                      </div>

                      <div className="bg-navy-950/70 p-3.5 rounded-lg border border-navy-700/80">
                        <h4 className="text-sm font-bold text-tprimary mb-1">
                          "The AI is confident. The system is not."
                        </h4>
                        <p className="text-xs text-tsecondary leading-relaxed">
                          Gemini investigated the transaction candidate pool and recommended{' '}
                          <span className="text-status-matched font-bold">MATCH with {ai?.confidence ? `${(ai.confidence * 100).toFixed(0)}%` : '97%'} confidence</span>.
                          However, Arivo's deterministic Control Gate blocked automatic finalization because candidate ambiguity combined with high monetary risk violates the zero-tolerance boundary.
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                        <div className="p-2.5 rounded bg-navy-900 border border-navy-700">
                          <p className="text-[10px] text-tmuted uppercase">Gemini LLM</p>
                          <p className="font-bold text-status-matched mt-0.5">
                            {ai?.confidence ? `${(ai.confidence * 100).toFixed(0)}% MATCH` : '97% MATCH'}
                          </p>
                        </div>
                        <div className="p-2.5 rounded bg-navy-900 border border-status-exception/30">
                          <p className="text-[10px] text-tmuted uppercase">Control Gate</p>
                          <p className="font-bold text-status-exception mt-0.5">BLOCK</p>
                        </div>
                        <div className="p-2.5 rounded bg-navy-900 border border-status-review/30">
                          <p className="text-[10px] text-tmuted uppercase">Arivo Status</p>
                          <p className="font-bold text-status-review mt-0.5">REVIEW</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Financial Provenance: Transaction vs Settlement Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Payment Record Card */}
                    <div className="p-4 rounded-xl bg-navy-850 border border-navy-700 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-navy-700/60">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-tmuted">
                          Payment Ledger
                        </span>
                        <span className="text-xs font-mono text-brand-blue font-semibold">
                          {payment?.payment_id || c?.payment_id || '—'}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-tmuted">Gross Amount:</span>
                          <span className="font-mono font-bold text-tprimary tabular-nums">
                            {formatINR(payment?.amount || c?.financial_impact)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-tmuted">Method:</span>
                          <span className="font-mono text-tsecondary">{payment?.method || 'Card / UPI'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-tmuted">Order ID:</span>
                          <span className="font-mono text-tsecondary">{payment?.order_id || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-tmuted">Captured At:</span>
                          <span className="font-mono text-tsecondary">{formatDate(payment?.created_at || c?.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Settlement Record Card */}
                    <div className="p-4 rounded-xl bg-navy-850 border border-navy-700 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-navy-700/60">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-tmuted">
                          Settlement Batch
                        </span>
                        <span className="text-xs font-mono text-tprimary font-semibold">
                          {settlement?.settlement_id || c?.settlement_id || 'Unallocated'}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-tmuted">Deposited Net:</span>
                          <span className="font-mono font-bold text-status-matched tabular-nums">
                            {formatINR(settlement?.net_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-tmuted">Bank UTR:</span>
                          <span className="font-mono text-tsecondary">{settlement?.utr || 'Pending Clearing'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-tmuted">Batch Status:</span>
                          <span className="font-mono text-tsecondary">{settlement?.status || 'PROCESSED'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-tmuted">Batch Date:</span>
                          <span className="font-mono text-tsecondary">{formatDate(settlement?.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Settlement Waterfall Breakdown */}
                  {settlement && (
                    <div className="p-4 rounded-xl bg-navy-850 border border-navy-700 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-navy-700/60">
                        <span className="text-xs font-bold text-tprimary">Settlement Waterfall Arithmetic</span>
                        <span className="text-[11px] font-mono text-tmuted">Integer Paise Exact</span>
                      </div>

                      <div className="space-y-1.5 text-xs font-mono">
                        <div className="flex justify-between py-1 border-b border-navy-800">
                          <span className="text-tsecondary">Gross Captured Volume</span>
                          <span className="text-tprimary font-semibold tabular-nums">
                            + {formatINR(settlement.gross_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-navy-800">
                          <span className="text-tmuted">MDR Processing Fees</span>
                          <span className="text-status-exception font-medium tabular-nums">
                            - {formatINR(settlement.fees)}
                          </span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-navy-800">
                          <span className="text-tmuted">Statutory GST (18%)</span>
                          <span className="text-status-exception font-medium tabular-nums">
                            - {formatINR(settlement.tax)}
                          </span>
                        </div>
                        {settlement.refunds > 0 && (
                          <div className="flex justify-between py-1 border-b border-navy-800">
                            <span className="text-tmuted">Net Customer Refunds</span>
                            <span className="text-status-exception font-medium tabular-nums">
                              - {formatINR(settlement.refunds)}
                            </span>
                          </div>
                        )}
                        {settlement.chargebacks > 0 && (
                          <div className="flex justify-between py-1 border-b border-navy-800">
                            <span className="text-tmuted">Chargeback Deductions</span>
                            <span className="text-status-exception font-medium tabular-nums">
                              - {formatINR(settlement.chargebacks)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between py-1.5 font-bold text-sm border-t border-navy-700">
                          <span className="text-tprimary">Actual Bank Net Credit</span>
                          <span className="text-status-matched tabular-nums">
                            = {formatINR(settlement.net_amount)}
                          </span>
                        </div>

                        {settlement.unexplained_delta > 0 && (
                          <div className="mt-2 p-2.5 rounded-lg bg-status-exception/15 border border-status-exception/30 flex items-center justify-between text-status-exception font-bold">
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

                  {/* AI Semantic Investigation Card */}
                  <div className="p-4 rounded-xl bg-navy-850 border border-navy-700 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-navy-700/60">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-brand-blue" />
                        <span className="text-xs font-bold text-tprimary">Gemini 2.5 Investigation</span>
                      </div>
                      {ai?.confidence !== undefined && (
                        <span className="text-xs font-mono font-semibold text-brand-blue">
                          Confidence: {(ai.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-tmuted">AI Recommendation:</span>
                        <span className="font-mono font-bold text-tprimary px-2 py-0.5 rounded bg-navy-800 border border-navy-700">
                          {ai?.recommendation || 'NOT_INVOKED'}
                        </span>
                      </div>

                      <p className="text-tsecondary leading-relaxed bg-navy-900/60 p-3 rounded-lg border border-navy-800">
                        {ai?.summary || ai?.reason || 'Deterministic exact identifier match resolved with 0 delta. AI reasoning was not required.'}
                      </p>

                      {ai?.supporting_evidence && ai.supporting_evidence.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <span className="text-[11px] font-mono text-tmuted uppercase">Supporting Evidence Items:</span>
                          <ul className="space-y-1">
                            {ai.supporting_evidence.map((ev, i) => (
                              <li key={i} className="flex items-start gap-2 text-tmuted font-mono text-[11px]">
                                <CornerDownRight className="w-3 h-3 text-brand-blue mt-0.5 flex-shrink-0" />
                                <span>{ev}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Controller Resolution History if resolved */}
                  {c?.resolved_by && (
                    <div className="p-4 rounded-xl bg-navy-800/80 border border-navy-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-status-matched" />
                          <span className="text-xs font-bold text-tprimary">Human Controller Resolution</span>
                        </div>
                        <span className="text-[11px] font-mono text-tmuted">{formatDate(c.resolved_at)}</span>
                      </div>
                      <div className="text-xs text-tsecondary space-y-1 font-mono">
                        <p>Action: <span className="font-bold text-tprimary">{c.resolution_action}</span> by <span className="text-brand-blue">{c.resolved_by}</span></p>
                        {c.resolution_notes && (
                          <p className="text-tmuted italic bg-navy-900/60 p-2 rounded border border-navy-700">
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
              <div className="p-4 border-t border-navy-700 bg-navy-950 flex items-center justify-between flex-shrink-0">
                <div className="text-xs text-tmuted">
                  Status: <span className="font-mono font-bold text-tprimary">{c?.status}</span>
                </div>

                <div className="flex items-center gap-2">
                  {c?.status !== 'MATCHED' && (
                    <button
                      disabled={resolving}
                      onClick={() => setShowNotesModal('APPROVED')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-status-matched hover:bg-emerald-600 text-slate-950 transition-colors shadow-sm disabled:opacity-50"
                    >
                      Approve Match
                    </button>
                  )}

                  {c?.status !== 'EXCEPTION' && (
                    <button
                      disabled={resolving}
                      onClick={() => setShowNotesModal('REJECTED')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-status-exception hover:bg-rose-600 text-white transition-colors shadow-sm disabled:opacity-50"
                    >
                      Reject Exception
                    </button>
                  )}

                  <button
                    disabled={resolving}
                    onClick={() => setShowNotesModal('ESCALATED')}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy-800 hover:bg-navy-750 text-tsecondary border border-navy-700 transition-colors disabled:opacity-50"
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
                className="fixed inset-0 bg-black/75"
                onClick={() => setShowNotesModal(null)}
              />
              <div className="relative w-full max-w-md bg-navy-850 border border-navy-700 rounded-xl p-5 shadow-elevated z-10 space-y-4">
                <h4 className="text-sm font-bold text-tprimary">
                  {showNotesModal === 'APPROVED' && 'Approve & Confirm Match'}
                  {showNotesModal === 'REJECTED' && 'Reject & Mark as Exception'}
                  {showNotesModal === 'ESCALATED' && 'Escalate Case to Treasury'}
                </h4>
                <p className="text-xs text-tmuted">
                  This action is recorded in the permanent institutional audit log with your controller credentials.
                </p>

                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Enter audit rationale (e.g. Verified bank statement credit advice UTR...)"
                  className="w-full h-24 bg-navy-900 border border-navy-700 rounded-lg p-2.5 text-xs text-tprimary placeholder-tmuted focus:outline-none focus:border-brand-blue resize-none"
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={resolving}
                    onClick={() => setShowNotesModal(null)}
                    className="px-3 py-1.5 text-xs text-tmuted hover:text-tprimary rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={resolving}
                    onClick={() => handleResolveAction(showNotesModal as any)}
                    className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold bg-brand-blue hover:bg-brand-hover text-white rounded-lg shadow-card disabled:opacity-50"
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
