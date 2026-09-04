import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { api, formatINR, formatNumber } from '../api';
import {
  Play,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Activity,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';

interface OverviewProps {
  source: string;
  onSourceChange: (source: string) => void;
  onOpenCase: (caseId: string) => void;
  onOpenReconcileModal: () => void;
}

export default function Overview({
  source,
  onOpenCase,
  onOpenReconcileModal,
}: OverviewProps) {
  const location = useLocation();
  const locState = (location.state as {
    runId?: string;
    recordCount?: number;
    matchedCount?: number;
    reviewCount?: number;
    exceptionCount?: number;
    completedAt?: string;
  }) || null;

  const [dashboard, setDashboard] = useState<any>(null);
  const [latestRun, setLatestRun] = useState<any>(null);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const loadOverviewData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      api.getDashboard(source),
      api.getCashForecast().catch(() => null),
      api.getRazorpayStatus().catch(() => null),
      api.getExceptions({ source, limit: 5 }).catch(() => []),
      api.getRuns(1).catch(() => []),
    ])
      .then(([dash, , , exc, runs]) => {
        setDashboard(dash);
        if (Array.isArray(exc)) setExceptions(exc);
        if (Array.isArray(runs) && runs.length > 0) setLatestRun(runs[0]);
      })
      .catch((err) => {
        console.error('Overview load failed:', err);
        setError(err?.message || 'Failed to connect to reconciliation backend. Please ensure the backend server is running.');
      })
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
      const countMsg = res.message || `Synced ${res.payments_fetched || 0} payments and ${res.settlements_fetched || 0} settlements.`;
      const provenance = res.mode === 'synthetic' ? ' [Razorpay Test Store · Synthetic Data]' : ' [Live API]';
      setSyncMessage(`${countMsg}${provenance}`);
      loadOverviewData();
    } catch (err: any) {
      setSyncMessage(`Sync note: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const d = dashboard || {};
  const totalVolume = d.total_processed_volume ?? d.total_volume ?? d.cash_position?.expected ?? 0;
  const totalCount = d.total_records ?? d.total_cases ?? d.processed ?? 0;
  const matchedVol = d.matched_volume ?? d.cash_position?.settled ?? 0;
  const matchedCount = d.matched_count ?? d.matched ?? 0;
  const reviewVol = d.review_volume ?? d.unresolved_exposure?.review_paise ?? 0;
  const reviewCount = d.review_count ?? d.review ?? 0;
  const exceptionVol = d.exception_volume ?? d.unresolved_exposure?.exception_paise ?? 0;
  const exceptionCount = d.exception_count ?? d.exceptions ?? 0;
  const unresolvedExposure =
    d.unresolved_financial_exposure ?? d.unresolved_exposure?.total_paise ?? (reviewVol + exceptionVol);
  const highValExposure = d.high_value_exposure ?? d.unresolved_exposure?.high_value_paise ?? 0;

  const matchedPercent = totalVolume > 0 ? ((matchedVol / totalVolume) * 100).toFixed(1) : '0.0';

  const activeRunId = locState?.runId || latestRun?.run_id || 'RUN_INIT';
  const activeCompletedAt = locState?.completedAt || (latestRun ? 'from latest run' : 'just now');
  const activeRecordCount = locState?.recordCount || latestRun?.records_processed || totalCount || 5114;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Action & Workspace Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-content-primary">
              Financial Control Room
            </h1>
          </div>
          <p className="text-xs text-content-muted mt-1 font-mono">
            Deterministic Reconciliation · Investigation Engine · Authoritative Control Gate
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleSyncRazorpay}
            disabled={syncing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface hover:bg-surface-elevated border border-border text-xs font-medium text-content-secondary hover:text-content-primary shadow-subtle transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${syncing ? 'animate-spin text-brand' : ''}`}
            />
            <span>{source === 'razorpay_test' ? 'Sync Razorpay Test Store' : 'Sync Razorpay'}</span>
          </button>

          <button
            onClick={onOpenReconcileModal}
            className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-card transition-all active:scale-[0.98]"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run Reconciliation</span>
          </button>
        </div>
      </div>

      {/* Control Run Context Bar */}
      <div className="p-3.5 rounded-lg bg-surface border border-border shadow-subtle flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-4 sm:gap-6">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-content-muted block">CONTROL RUN</span>
            <span className="text-sm font-bold text-brand tabular-nums">{activeRunId}</span>
          </div>
          <div className="h-6 w-px bg-border hidden sm:block" />
          <div>
            <span className="text-[10px] uppercase tracking-wider text-content-muted block">STATUS</span>
            <span className="text-status-mint font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-status-mint" />
              <span>Completed {activeCompletedAt}</span>
            </span>
          </div>
          <div className="h-6 w-px bg-border hidden sm:block" />
          <div>
            <span className="text-[10px] uppercase tracking-wider text-content-muted block">RECORDS</span>
            <span className="text-content-primary font-medium tabular-nums">{formatNumber(activeRecordCount)} records</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="px-3 py-1.5 rounded-md bg-surface-elevated hover:bg-surface-sunken border border-border text-xs font-mono text-content-secondary hover:text-content-primary transition-colors flex items-center gap-1.5"
            title="Return to ARIVO Control Center"
          >
            <span>Control Center</span>
            <ArrowRight className="w-3.5 h-3.5 text-content-muted" />
          </Link>
        </div>
      </div>

      {/* Explicit Backend Error Banner - NEVER Silently Mask As ₹0.00 */}
      {error && (
        <div className="p-4 rounded-lg bg-status-coral/10 border border-status-coral/40 text-status-coral flex items-center justify-between shadow-subtle">
          <div className="flex items-center gap-2.5">
            <AlertOctagon className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-xs font-semibold">Reconciliation Backend Connection Error</p>
              <p className="text-xs font-mono opacity-90">{error}</p>
            </div>
          </div>
          <button
            onClick={loadOverviewData}
            className="px-3 py-1 rounded bg-status-coral/20 hover:bg-status-coral/30 text-xs font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State Diagnostic Banner */}
      {!loading && !error && totalCount === 0 && (
        <div className="p-4 rounded-lg bg-status-amber/10 border border-status-amber/40 text-status-amber flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-subtle">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-xs font-semibold">No Transactions In Workspace</p>
              <p className="text-xs text-content-muted">
                {source === 'razorpay_test'
                  ? 'No records found for Razorpay Test Store. Click "Sync Razorpay Test Store" to load the test dataset, then execute reconciliation.'
                  : 'No reconciliation cases recorded yet. Click "Run Reconciliation" to ingest and reconcile the active dataset.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {source === 'razorpay_test' && (
              <button
                onClick={handleSyncRazorpay}
                disabled={syncing}
                className="px-3 py-1.5 rounded bg-status-amber/20 hover:bg-status-amber/30 text-xs font-semibold text-status-amber transition-colors"
              >
                Sync Test Store
              </button>
            )}
            <button
              onClick={onOpenReconcileModal}
              className="px-3 py-1.5 rounded bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors"
            >
              Run Pipeline
            </button>
          </div>
        </div>
      )}

      {syncMessage && (
        <div className="p-3 rounded-lg bg-surface border border-brand/40 text-xs text-content-secondary font-mono flex items-center justify-between shadow-subtle">
          <span>{syncMessage}</span>
          <button
            onClick={() => setSyncMessage(null)}
            className="text-content-muted hover:text-content-primary text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Hero Financial Exposure Under Review Card */}
      <div className="p-6 rounded-lg bg-surface border-l-4 border-l-[#FFB454] border border-border shadow-card relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[#D98A26] dark:text-[#FFB454] font-semibold">
                Critical Metric: Financial Exposure Under Review
              </span>
              <span className="w-2 h-2 rounded-full bg-[#FFB454] animate-ping" />
            </div>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#D98A26] dark:text-[#FFB454] tabular-nums tracking-tight">
              {formatINR(unresolvedExposure)}
            </div>
            <p className="text-xs text-content-muted max-w-xl leading-relaxed">
              Cumulative gross transaction amount currently withheld by the Control Gate pending controller sign-off or exception investigation.
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-3">
            <div className="p-3 bg-surface-elevated rounded-md border border-border min-w-[170px]">
              <span className="text-[10px] font-mono uppercase text-content-muted block font-medium">
                High-Value Items (≥₹50k)
              </span>
              <span className="text-base font-bold font-mono text-[#D98A26] dark:text-[#FFB454] tabular-nums">
                {formatINR(highValExposure)}
              </span>
            </div>
            <div className="p-3 bg-surface-elevated rounded-md border border-border min-w-[170px]">
              <span className="text-[10px] font-mono uppercase text-content-muted block font-medium">
                Unresolved Cases
              </span>
              <span className="text-base font-bold font-mono text-content-primary">
                {formatNumber(reviewCount + exceptionCount)} records
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Column KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Processed Volume"
          value={formatINR(totalVolume)}
          subValue={`${formatNumber(totalCount)} total transaction records`}
          accent="blue"
          icon={<Activity className="w-4 h-4 text-brand" />}
        />

        <MetricCard
          label="Confirmed Reconciled"
          value={formatINR(matchedVol)}
          subValue={`${formatNumber(matchedCount)} records • 0 paise delta`}
          meta={`${matchedPercent}% of total volume reconciled`}
          accent="mint"
          icon={<CheckCircle2 className="w-4 h-4 text-status-mint" />}
        />

        <MetricCard
          label="Under Controller Review"
          value={formatINR(reviewVol)}
          subValue={`${formatNumber(reviewCount)} records awaiting human sign-off`}
          meta="Invariant boundary checks pending"
          accent="amber"
          icon={<AlertTriangle className="w-4 h-4 text-status-amber" />}
        />

        <MetricCard
          label="Critical Exceptions"
          value={formatINR(exceptionVol)}
          subValue={`${formatNumber(exceptionCount)} records with delta or anomaly`}
          meta="RFC 4180 export available"
          accent="coral"
          icon={<AlertOctagon className="w-4 h-4 text-status-coral" />}
        />
      </div>

      {/* Top Ranked Exceptions Preview */}
      <div className="p-5 rounded-lg bg-surface border border-border shadow-card space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h3 className="text-sm font-bold text-content-primary">
              High-Exposure Exceptions Requiring Action
            </h3>
            <p className="text-xs text-content-muted">
              Prioritized by monetary exposure. Click any row to inspect complete waterfall and take controller action.
            </p>
          </div>
          <span className="text-xs font-mono text-content-muted">
            Ranked by Exposure DESC
          </span>
        </div>

        {exceptions.length === 0 ? (
          <p className="text-xs text-content-muted py-6 text-center font-mono">
            No active exceptions found for workspace {source}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border text-content-muted text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3">Case ID</th>
                  <th className="py-2.5 px-3">Payment ID</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Exposure</th>
                  <th className="py-2.5 px-3">Control Verdict</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {exceptions.map((ex) => (
                  <tr
                    key={ex.case_id}
                    onClick={() => onOpenCase(ex.case_id)}
                    className="hover:bg-surface-elevated cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-3 font-bold text-content-primary group-hover:text-brand">
                      {ex.case_id}
                    </td>
                    <td className="py-3 px-3 text-content-secondary">
                      {ex.payment_id || '-'}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={ex.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-[#D98A26] dark:text-[#FFB454] tabular-nums">
                      {formatINR(ex.financial_impact)}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={ex.control_result || 'BLOCK'} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="text-[11px] text-brand font-semibold group-hover:underline inline-flex items-center justify-end gap-1">
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
