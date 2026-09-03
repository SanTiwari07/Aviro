import React, { useEffect, useState } from 'react';
import { api } from '../api';

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
  const syntheticRuns = runs.filter((r) => r.source === 'synthetic').length;
  const razorpayRuns = runs.filter((r) => r.source === 'razorpay_test').length;
  const avgThroughput =
    runs.length > 0
      ? Math.round(runs.reduce((acc, r) => acc + (r.throughput || 0), 0) / runs.length)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reconciliation Runs History</h2>
          <p className="text-sm text-slate-500">
            Immutable audit trail of all reconciliation cycles executed across synthetic and Razorpay test datasets.
          </p>
        </div>
        <button
          onClick={loadRuns}
          className="px-3 py-1.5 text-xs font-semibold rounded bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm"
        >
          Refresh Runs
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Runs Executed</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalRuns}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Synthetic Benchmark Runs</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{syntheticRuns}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Razorpay Test Mode Runs</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{razorpayRuns}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Avg Throughput</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {avgThroughput} <span className="text-xs font-normal text-slate-500">rec/sec</span>
          </p>
        </div>
      </div>

      {/* Runs Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 font-semibold text-sm text-slate-800 flex justify-between items-center">
          <span>Execution Log</span>
          <span className="text-xs font-normal text-slate-500">Showing last 50 runs</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 animate-pulse text-sm">
            Loading runs history...
          </div>
        ) : runs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No reconciliation runs recorded yet. Execute a run from the Overview page.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Run ID</th>
                  <th className="p-3">Source Dataset</th>
                  <th className="p-3">Sync ID</th>
                  <th className="p-3">Processed</th>
                  <th className="p-3">Matched</th>
                  <th className="p-3">Review</th>
                  <th className="p-3">Exception</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Throughput</th>
                  <th className="p-3">AI Invocations</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {runs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-900">{r.run_id}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          r.source === 'razorpay_test'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {r.source === 'razorpay_test' ? '⚡ Razorpay Test' : '🔬 Synthetic'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-500">{r.sync_id || 'N/A'}</td>
                    <td className="p-3 font-bold text-slate-900">{r.records_processed}</td>
                    <td className="p-3 text-emerald-700 font-semibold">{r.matched}</td>
                    <td className="p-3 text-amber-700 font-semibold">{r.review}</td>
                    <td className="p-3 text-rose-700 font-semibold">{r.exception}</td>
                    <td className="p-3 font-mono text-slate-600">{r.duration_ms} ms</td>
                    <td className="p-3 font-mono text-slate-900 font-medium">
                      {r.throughput} rec/s
                    </td>
                    <td className="p-3 text-slate-600">
                      {r.ai_investigations} {r.ai_failures > 0 ? `(${r.ai_failures} fallback)` : ''}
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-[11px]">
                      {r.timestamp ? new Date(r.timestamp).toLocaleString() : 'N/A'}
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
