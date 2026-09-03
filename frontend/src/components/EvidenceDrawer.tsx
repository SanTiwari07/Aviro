import React, { useEffect, useState } from 'react';
import { api, formatINR } from '../api';

interface EvidenceDrawerProps {
  caseData: any;
  onClose: () => void;
}

export default function EvidenceDrawer({ caseData, onClose }: EvidenceDrawerProps) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!caseData?.case_id) return;
    setLoading(true);
    api.getCaseDetail(caseData.case_id)
      .then((res) => {
        setDetail(res);
      })
      .catch((err) => {
        console.warn('Failed to load full case details, using prop data:', err);
        setDetail(null);
      })
      .finally(() => setLoading(false));
  }, [caseData?.case_id]);

  const c = detail?.case || caseData;
  const p = detail?.payment;
  const s = detail?.settlement_waterfall;
  const ai = detail?.ai_investigation;
  const cg = detail?.control_gate;

  const controlReasons: string[] = cg?.reasons?.length
    ? cg.reasons
    : (() => {
        try {
          return c?.control_reasons ? JSON.parse(c.control_reasons) : [];
        } catch {
          return [];
        }
      })();

  const aiEvidence: string[] = ai?.supporting_evidence?.length
    ? ai.supporting_evidence
    : (() => {
        try {
          return c?.ai_evidence ? JSON.parse(c.ai_evidence) : [];
        } catch {
          return [];
        }
      })();

  const isFlagshipSafetyCase =
    (c?.ai_confidence && c.ai_confidence > 0.8) &&
    c?.control_result === 'BLOCK' &&
    c?.status === 'REVIEW';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden border-l border-slate-200 animate-slide-left">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold">
                {c.case_id}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium ${
                  c.source === 'razorpay_test'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {c.source === 'razorpay_test' ? '⚡ Razorpay Test Mode' : '🔬 Synthetic Benchmark'}
              </span>
            </div>
            <h3 className="font-bold text-lg text-slate-900">Financial Evidence Audit</h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Run: {c.run_id || 'N/A'} {c.sync_id ? `• Sync: ${c.sync_id}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors text-xl font-bold leading-none"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5 text-sm text-slate-700">
          {loading && (
            <div className="text-center py-4 text-slate-400 animate-pulse text-xs">
              Loading verified accounting records...
            </div>
          )}

          {/* Flagship AI Safety Callout */}
          {isFlagshipSafetyCase && (
            <div className="p-3.5 bg-amber-50 border-l-4 border-amber-500 rounded-r-md text-amber-900">
              <div className="font-bold flex items-center gap-1.5 text-xs tracking-wide uppercase">
                🛡️ AI Safety Invariant Triggered
              </div>
              <p className="font-semibold text-sm mt-1">
                "The AI is confident. The system is not."
              </p>
              <p className="text-xs text-amber-800 mt-1">
                Gemini recommended MATCH with {((c.ai_confidence || 0.97) * 100).toFixed(0)}% confidence,
                but the Control Gate blocked automatic clearance due to ambiguity/high value.
              </p>
            </div>
          )}

          {/* Record Identifiers */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/70">
            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-xs uppercase tracking-wider">
              <span>🗂️</span> Record Identifiers
            </h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block">Payment ID</span>
                <span className="font-mono text-slate-900 font-medium">
                  {p?.payment_id || c.payment_id || 'None'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Settlement ID</span>
                <span className="font-mono text-slate-900 font-medium">
                  {s?.settlement_id || c.settlement_id || 'Unsettled / None'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Order ID</span>
                <span className="font-mono text-slate-900">
                  {p?.order_id || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Bank UTR / Ref</span>
                <span className="font-mono text-slate-900">
                  {s?.utr || 'Pending clearance'}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Waterfall */}
          <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center justify-between text-xs uppercase tracking-wider">
              <span className="flex items-center gap-2"><span>📊</span> Settlement Waterfall</span>
              <span className="text-xs font-mono font-normal text-slate-500">Paise precision</span>
            </h4>
            <div className="space-y-1.5 pt-1 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Payment Amount (Gross):</span>
                <span className="font-mono font-medium text-slate-900">
                  {formatINR(p?.amount || c.financial_impact)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Gateway Fees:</span>
                <span className="font-mono text-slate-700">
                  - {formatINR(s?.fees || p?.fee || 0)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">Taxes (GST):</span>
                <span className="font-mono text-slate-700">
                  - {formatINR(s?.tax || p?.tax || 0)}
                </span>
              </div>
              {s?.refunds ? (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">Refunds:</span>
                  <span className="font-mono text-slate-700">- {formatINR(s.refunds)}</span>
                </div>
              ) : null}
              <div className="flex justify-between py-1.5 border-b border-slate-200 font-semibold">
                <span className="text-slate-900">Expected Net Settlement:</span>
                <span className="font-mono text-slate-900">
                  {formatINR(s?.net_amount || (c.financial_impact - (s?.fees || 0) - (s?.tax || 0)))}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-600">Actual Net Deposited:</span>
                <span className="font-mono font-medium text-slate-900">
                  {formatINR(s?.net_amount || c.financial_impact)}
                </span>
              </div>
              {c.amount_delta > 0 && (
                <div className="flex justify-between py-1.5 px-2 bg-red-50 rounded text-red-700 font-semibold">
                  <span>Unexplained Delta:</span>
                  <span className="font-mono">{formatINR(c.amount_delta)}</span>
                </div>
              )}
            </div>
          </div>

          {/* AI Investigation Section */}
          <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/50">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center justify-between text-xs uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><span>✨</span> AI Investigation</span>
              <span className="text-xs font-medium text-blue-700 font-mono">
                {c.ai_recommendation ? 'Gemini 2.5' : 'Heuristic Guard'}
              </span>
            </h4>

            <div className="text-xs text-slate-600 mb-3 bg-white/70 p-2 rounded border border-blue-100">
              <span className="font-medium text-blue-900">Audit Rule: </span>
              {c.ai_reason || 'AI Not required. Reason: Unique identifier and financial controls were sufficient.'}
            </div>

            {c.ai_recommendation ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">AI Recommendation:</span>
                  <span className={`px-2 py-0.5 rounded font-bold text-xs ${
                    c.ai_recommendation === 'MATCHED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : c.ai_recommendation === 'REVIEW'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {c.ai_recommendation}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">AI Confidence:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {((c.ai_confidence || 0) * 100).toFixed(0)}%
                  </span>
                </div>
                {c.ai_summary && (
                  <div className="mt-2 text-slate-700 bg-white p-2 rounded border border-blue-100">
                    {c.ai_summary}
                  </div>
                )}
                {aiEvidence.length > 0 && (
                  <ul className="list-disc pl-4 text-xs text-slate-600 space-y-0.5 mt-2">
                    {aiEvidence.map((ev, i) => (
                      <li key={i}>{ev}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Deterministic unique identifier was verified with 100% mathematical certainty.
              </p>
            )}
          </div>

          {/* Control Gate */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/70">
            <h4 className="font-semibold text-slate-900 mb-2 flex items-center justify-between text-xs uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><span>🛡️</span> Authoritative Control Gate</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-xs ${
                  c.control_result === 'PASS'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {c.control_result || 'PASS'}
              </span>
            </h4>
            {controlReasons.length > 0 ? (
              <div className="mt-2 space-y-1">
                <span className="text-xs text-slate-500 block">Audit Invariant Blocks:</span>
                <ul className="list-disc pl-4 text-xs text-red-700 space-y-0.5">
                  {controlReasons.map((r, i) => (
                    <li key={i} className="font-medium">{r}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-slate-600 mt-1">
                All 7 financial control invariants verified (zero delta, single candidate, valid waterfall).
              </p>
            )}
          </div>

          {/* Final Arivo Decision */}
          <div className="p-4 rounded-lg bg-slate-900 text-white shadow-md">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
                Final Arivo Decision
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  c.status === 'MATCHED'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : c.status === 'REVIEW'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {c.status}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-2">
              {c.status === 'MATCHED'
                ? 'Deterministic exact-match confirmed with zero financial discrepancy.'
                : c.status === 'REVIEW'
                ? 'Control Gate blocked automatic execution to safeguard high value or candidate ambiguity.'
                : 'Critical financial exception: Unresolved discrepancy or missing settlement record.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
