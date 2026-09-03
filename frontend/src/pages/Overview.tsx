import React, { useEffect, useState } from 'react';
import { api, formatINR, formatNumber, formatDate } from '../api';
import {
  Play,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  TrendingUp,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  ExternalLink,
  DollarSign,
  Activity,
  FileSpreadsheet,
} from 'lucide-react';
import { motion } from 'motion/react';

interface OverviewProps {
  source: string;
  onSourceChange: (source: string) => void;
  onOpenCase: (caseId: string) => void;
  onOpenReconcileModal: () => void;
}

export default function Overview({
  source,
  onSourceChange,
  onOpenCase,
  onOpenReconcileModal,
}: OverviewProps) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [rzpStatus, setRzpStatus] = useState<any>(null);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const loadOverviewData = () => {
    setLoading(true);
    Promise.all([
      api.getDashboard(source),
      api.getCashForecast().catch(() => null),
      api.getRazorpayStatus().catch(() => null),
      api.getExceptions({ source, limit: 5 }).catch(() => []),
    ])
      .then(([dash, fcast, rzp, exc]) => {
        setDashboard(dash);
        if (fcast) setForecast(fcast);
        if (rzp) setRzpStatus(rzp);
        if (Array.isArray(exc)) setExceptions(exc);
      })
      .catch((err) => console.error('Overview load failed:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOverviewData();
  }, [source]);

  const handleSyncRazorpay = async () => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await api.syncRazorpay();
      setSyncMessage(`Synced ${res.payments_fetched || 0} payments and ${res.settlements_fetched || 0} settlements.`);
      loadOverviewData();
    } catch (err: any) {
      setSyncMessage(`Sync note: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const d = dashboard || {};
  const totalVolume = d.total_processed_volume || d.total_volume || 0;
  const totalCount = d.total_records || d.total_cases || 0;
  const matchedVol = d.matched_volume || 0;
  const matchedCount = d.matched_count || 0;
  const reviewVol = d.review_volume || 0;
  const reviewCount = d.review_count || 0;
  const exceptionVol = d.exception_volume || 0;
  const exceptionCount = d.exception_count || 0;
  const unresolvedExposure = d.unresolved_financial_exposure || (reviewVol + exceptionVol);
  const highValExposure = d.high_value_exposure || 0;

  return (
    <div className="space-y-6">
      {/* Top Action & Workspace Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-tprimary tracking-tight">Financial Control Room</h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-status-matched/15 text-status-matched border border-status-matched/30 font-bold">
              LIVE MONITOR
            </span>
          </div>
          <p className="text-xs text-tmuted mt-0.5 font-mono">
            Deterministic Reconciliation • Gemini 2.5 Investigation • Authoritative Control Gate
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSyncRazorpay}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-850 hover:bg-navy-800 border border-navy-700 text-xs font-semibold text-tsecondary hover:text-tprimary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-brand-blue' : ''}`} />
            <span>Sync Razorpay</span>
          </button>

          <button
            onClick={onOpenReconcileModal}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-brand-blue hover:bg-brand-hover text-white text-xs font-semibold shadow-card transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Reconciliation</span>
          </button>
        </div>
      </div>

      {syncMessage && (
        <div className="p-3 rounded-lg bg-navy-850 border border-brand-blue/30 text-xs text-tsecondary font-mono flex items-center justify-between">
          <span>{syncMessage}</span>
          <button onClick={() => setSyncMessage(null)} className="text-tmuted hover:text-tprimary">✕</button>
        </div>
      )}

      {/* Hero Unresolved Exposure Metric Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-navy-850 via-navy-800 to-navy-850 border border-navy-700 shadow-elevated relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-status-review font-semibold">
                Critical Metric: Financial Exposure Under Review
              </span>
              <span className="w-2 h-2 rounded-full bg-status-review animate-ping" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-status-review tabular-nums">
              {formatINR(unresolvedExposure)}
            </div>
            <p className="text-xs text-tmuted max-w-xl">
              Cumulative gross transaction amount currently withheld by the Control Gate pending controller sign-off or exception investigation.
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-3 text-right">
            <div className="p-3 bg-navy-900/80 rounded-lg border border-navy-700">
              <span className="text-[10px] font-mono uppercase text-tmuted block">High-Value Items (≥₹50k)</span>
              <span className="text-base font-bold font-mono text-status-review tabular-nums">
                {formatINR(highValExposure)}
              </span>
            </div>
            <div className="p-3 bg-navy-900/80 rounded-lg border border-navy-700">
              <span className="text-[10px] font-mono uppercase text-tmuted block">Unresolved Cases</span>
              <span className="text-base font-bold font-mono text-tprimary">
                {formatNumber(reviewCount + exceptionCount)} records
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Column KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Processed */}
        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card space-y-2">
          <div className="flex items-center justify-between text-tmuted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Processed Volume</span>
            <Activity className="w-4 h-4 text-tsecondary" />
          </div>
          <p className="text-2xl font-bold font-mono text-tprimary tabular-nums">
            {formatINR(totalVolume)}
          </p>
          <p className="text-[11px] font-mono text-tmuted">
            {formatNumber(totalCount)} total transaction records
          </p>
        </div>

        {/* Confirmed Reconciled */}
        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card space-y-2">
          <div className="flex items-center justify-between text-tmuted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Confirmed Reconciled</span>
            <CheckCircle2 className="w-4 h-4 text-status-matched" />
          </div>
          <p className="text-2xl font-bold font-mono text-status-matched tabular-nums">
            {formatINR(matchedVol)}
          </p>
          <p className="text-[11px] font-mono text-tmuted">
            {formatNumber(matchedCount)} records • 0 paise delta
          </p>
        </div>

        {/* Under Review */}
        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card space-y-2">
          <div className="flex items-center justify-between text-tmuted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Under Controller Review</span>
            <AlertTriangle className="w-4 h-4 text-status-review" />
          </div>
          <p className="text-2xl font-bold font-mono text-status-review tabular-nums">
            {formatINR(reviewVol)}
          </p>
          <p className="text-[11px] font-mono text-tmuted">
            {formatNumber(reviewCount)} records awaiting human sign-off
          </p>
        </div>

        {/* Critical Exceptions */}
        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card space-y-2">
          <div className="flex items-center justify-between text-tmuted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Critical Exceptions</span>
            <AlertOctagon className="w-4 h-4 text-status-exception" />
          </div>
          <p className="text-2xl font-bold font-mono text-status-exception tabular-nums">
            {formatINR(exceptionVol)}
          </p>
          <p className="text-[11px] font-mono text-tmuted">
            {formatNumber(exceptionCount)} records with delta or anomaly
          </p>
        </div>
      </div>

      {/* Financial Pipeline Flow Visual */}
      <div className="p-5 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-navy-700">
          <div>
            <h3 className="text-sm font-bold text-tprimary">Autonomous Financial Architecture Flow</h3>
            <p className="text-xs text-tmuted">
              Decoupled semantic investigation and deterministic invariant control gate.
            </p>
          </div>
          <span className="text-xs font-mono text-status-matched font-semibold">
            CONTROL GATE VETO ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs font-mono">
          <div className="p-3 bg-navy-900 rounded-lg border border-navy-700/80 space-y-1">
            <span className="text-tmuted text-[10px] uppercase">1. Ingestion</span>
            <p className="text-tprimary font-bold">Dual Source</p>
            <p className="text-tmuted text-[11px]">Synthetic / Razorpay</p>
          </div>

          <div className="p-3 bg-navy-900 rounded-lg border border-navy-700/80 space-y-1">
            <span className="text-tmuted text-[10px] uppercase">2. Deterministic</span>
            <p className="text-brand-blue font-bold">Exact & Normal</p>
            <p className="text-tmuted text-[11px]">0 Paise Tolerance</p>
          </div>

          <div className="p-3 bg-navy-900 rounded-lg border border-navy-700/80 space-y-1">
            <span className="text-tmuted text-[10px] uppercase">3. AI Copilot</span>
            <p className="text-tprimary font-bold">Gemini 2.5</p>
            <p className="text-tmuted text-[11px]">Investigate Ambiguity</p>
          </div>

          <div className="p-3 bg-navy-900 rounded-lg border border-status-review/30 space-y-1">
            <span className="text-status-review text-[10px] uppercase">4. Control Gate</span>
            <p className="text-status-review font-bold">7 Invariants</p>
            <p className="text-tmuted text-[11px]">Vetoes Ambiguous Risk</p>
          </div>

          <div className="p-3 bg-navy-900 rounded-lg border border-status-matched/30 space-y-1">
            <span className="text-status-matched text-[10px] uppercase">5. Output Ledger</span>
            <p className="text-status-matched font-bold">Final Status</p>
            <p className="text-tmuted text-[11px]">Matched/Review/Exception</p>
          </div>
        </div>
      </div>

      {/* Top Ranked Exceptions Preview */}
      <div className="p-5 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-navy-700">
          <div>
            <h3 className="text-sm font-bold text-tprimary">High-Exposure Exceptions Requiring Action</h3>
            <p className="text-xs text-tmuted">
              Prioritized by monetary exposure. Click any row to inspect complete waterfall and take controller action.
            </p>
          </div>
          <span className="text-xs font-mono text-tmuted">
            Ranked by Exposure DESC
          </span>
        </div>

        {exceptions.length === 0 ? (
          <p className="text-xs text-tmuted py-4 text-center">No active exceptions found for workspace {source}.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-navy-700 text-tmuted text-[10px] uppercase">
                  <th className="py-2 px-3">Case ID</th>
                  <th className="py-2 px-3">Payment ID</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3 text-right">Exposure</th>
                  <th className="py-2 px-3">Control Verdict</th>
                  <th className="py-2 px-3 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-700/50">
                {exceptions.map((ex) => (
                  <tr
                    key={ex.case_id}
                    onClick={() => onOpenCase(ex.case_id)}
                    className="hover:bg-navy-800 cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 px-3 font-bold text-tprimary group-hover:text-brand-blue">
                      {ex.case_id}
                    </td>
                    <td className="py-2.5 px-3 text-tsecondary">
                      {ex.payment_id || '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded font-bold border ${
                        ex.status === 'REVIEW'
                          ? 'bg-status-review/15 text-status-review border-status-review/30'
                          : 'bg-status-exception/15 text-status-exception border-status-exception/30'
                      }`}>
                        {ex.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-status-review tabular-nums">
                      {formatINR(ex.financial_impact)}
                    </td>
                    <td className="py-2.5 px-3 text-tsecondary">
                      {ex.control_result || 'BLOCK'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="text-[11px] text-brand-blue group-hover:underline flex items-center justify-end gap-1">
                        Inspect <ArrowRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
