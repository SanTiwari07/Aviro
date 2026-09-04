import React, { useEffect, useState } from 'react';
import { api, formatDate, formatNumber } from '../api';
import {
  History,
  RefreshCw,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  ArrowRight,
  Zap,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';

interface RunRecord {
  id: number;
  run_id: string;
  source: string;
  sync_id?: string;
  timestamp: string;
  records_processed: number;
  matched: number;
  review: number;
  exception: number;
  duration_ms: number;
  throughput: number;
  ai_investigations: number;
  ai_failures: number;
}

export default function Runs() {
  const [runs, setRuns] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRuns = () => {
    setLoading(true);
    api.getRuns(50)
      .then((data) => setRuns(data || []))
      .catch((err) => console.error('Failed to load runs:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRuns();
  }, []);

  const totalRuns = runs.length;
  const avgThroughput =
    runs.length > 0
      ? Math.round(runs.reduce((acc, r) => acc + (r.throughput || 0), 0) / runs.length)
      : 0;
  const avgDuration =
    runs.length > 0
      ? Math.round(runs.reduce((acc, r) => acc + (r.duration_ms || 0), 0) / runs.length)
      : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-content-primary tracking-tight">
            Reconciliation Runs History
          </h2>
          <p className="text-xs text-content-muted mt-0.5 font-mono">
            Immutable execution ledger recording every reconciliation pipeline cycle with timing and telemetry.
          </p>
        </div>

        <button
          onClick={loadRuns}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-content-secondary hover:text-content-primary shadow-subtle transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand' : ''}`} />
          <span>Refresh Run Logs</span>
        </button>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Execution Cycles"
          value={formatNumber(totalRuns)}
          subValue="Audit-logged pipeline runs"
          accent="blue"
          icon={<History className="w-4 h-4 text-brand" />}
        />

        <MetricCard
          label="Average Processing Speed"
          value={`${formatNumber(avgThroughput)} txns/s`}
          subValue="Deterministic batch engine"
          accent="mint"
          icon={<Zap className="w-4 h-4 text-status-mint" />}
        />

        <MetricCard
          label="Average Execution Time"
          value={`${avgDuration} ms`}
          subValue="Bounded latency per cycle"
          accent="neutral"
          icon={<Clock className="w-4 h-4 text-content-muted" />}
        />
      </div>

      {/* Runs Table */}
      <div className="rounded-lg bg-surface border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-content-muted text-[10px] uppercase tracking-wider sticky top-0">
                <th className="py-3 px-4">Run ID</th>
                <th className="py-3 px-4">Workspace</th>
                <th className="py-3 px-4 text-right">Processed</th>
                <th className="py-3 px-4 text-right">Matched</th>
                <th className="py-3 px-4 text-right">Review</th>
                <th className="py-3 px-4 text-right">Exception</th>
                <th className="py-3 px-4 text-right">Duration</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && runs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-content-muted">
                    Loading execution history...
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-content-muted">
                    No run logs found in database.
                  </td>
                </tr>
              ) : (
                runs.map((r) => (
                  <tr key={r.run_id || r.id} className="hover:bg-surface-elevated transition-colors">
                    <td className="py-3 px-4 font-bold text-content-primary">
                      {r.run_id}
                    </td>
                    <td className="py-3 px-4 text-content-secondary">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-surface-sunken border border-border">
                        {r.source}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-content-primary font-bold tabular-nums">
                      {formatNumber(r.records_processed)}
                    </td>
                    <td className="py-3 px-4 text-right text-status-mint font-bold tabular-nums">
                      {formatNumber(r.matched)}
                    </td>
                    <td className="py-3 px-4 text-right text-[#D98A26] dark:text-[#FFB454] font-semibold tabular-nums">
                      {formatNumber(r.review)}
                    </td>
                    <td className="py-3 px-4 text-right text-[#E03A53] dark:text-[#FF647C] font-semibold tabular-nums">
                      {formatNumber(r.exception)}
                    </td>
                    <td className="py-3 px-4 text-right text-content-muted tabular-nums">
                      {r.duration_ms} ms
                    </td>
                    <td className="py-3 px-4 text-content-muted">
                      {formatDate(r.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
