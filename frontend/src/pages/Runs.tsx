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
} from 'lucide-react';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-tprimary tracking-tight">Reconciliation Runs History</h2>
          <p className="text-xs text-tmuted mt-0.5">
            Immutable execution ledger recording every reconciliation pipeline cycle with timing and telemetry.
          </p>
        </div>

        <button
          onClick={loadRuns}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 border border-navy-700 text-xs font-semibold text-tprimary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Run Logs</span>
        </button>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card space-y-1">
          <span className="text-[10px] font-mono uppercase text-tmuted">Total Execution Cycles</span>
          <p className="text-2xl font-bold font-mono text-tprimary tabular-nums">
            {formatNumber(totalRuns)}
          </p>
          <span className="text-[11px] text-tmuted block">Audit-logged pipeline runs</span>
        </div>

        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card space-y-1">
          <span className="text-[10px] font-mono uppercase text-tmuted">Average Processing Speed</span>
          <p className="text-2xl font-bold font-mono text-brand-blue tabular-nums">
            {formatNumber(avgThroughput)} txns/sec
          </p>
          <span className="text-[11px] text-tmuted block">High throughput batch engine</span>
        </div>

        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card space-y-1">
          <span className="text-[10px] font-mono uppercase text-tmuted">Average Execution Time</span>
          <p className="text-2xl font-bold font-mono text-status-matched tabular-nums">
            {avgDuration} ms
          </p>
          <span className="text-[11px] text-tmuted block">Bounded latency per cycle</span>
        </div>
      </div>

      {/* Runs Table */}
      <div className="rounded-xl bg-navy-850 border border-navy-700/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-navy-700 bg-navy-900/80 text-tmuted text-[10px] uppercase">
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
            <tbody className="divide-y divide-navy-700/50">
              {loading && runs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-tmuted">
                    Loading execution history...
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-tmuted">
                    No run logs found in database.
                  </td>
                </tr>
              ) : (
                runs.map((r) => (
                  <tr key={r.run_id || r.id} className="hover:bg-navy-800/80 transition-colors">
                    <td className="py-3 px-4 font-bold text-tprimary">
                      {r.run_id}
                    </td>
                    <td className="py-3 px-4 text-tsecondary">
                      <span className="text-[11px] px-2 py-0.5 rounded bg-navy-900 border border-navy-700">
                        {r.source}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-tprimary font-bold tabular-nums">
                      {formatNumber(r.records_processed)}
                    </td>
                    <td className="py-3 px-4 text-right text-status-matched font-bold tabular-nums">
                      {formatNumber(r.matched)}
                    </td>
                    <td className="py-3 px-4 text-right text-status-review font-semibold tabular-nums">
                      {formatNumber(r.review)}
                    </td>
                    <td className="py-3 px-4 text-right text-status-exception font-semibold tabular-nums">
                      {formatNumber(r.exception)}
                    </td>
                    <td className="py-3 px-4 text-right text-tmuted tabular-nums">
                      {r.duration_ms} ms
                    </td>
                    <td className="py-3 px-4 text-tmuted">
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
