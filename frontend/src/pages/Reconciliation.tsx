import React, { useEffect, useState } from 'react';
import EvidenceDrawer from '../components/EvidenceDrawer';
import { api, formatINR } from '../api';

export default function Reconciliation() {
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCases = () => {
    setLoading(true);
    setError(null);
    api.getReconciliation({
      source: sourceFilter,
      status: statusFilter,
      search: search.trim() || undefined,
      limit: 100,
    })
      .then((data) => setCases(data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCases();
  }, [sourceFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCases();
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Reconciliation Records</h2>
          <p className="text-sm text-slate-500">
            Ledger of matched, reviewed, and exception cases with full evidentiary provenance.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <input
              type="text"
              placeholder="Search ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs border border-slate-300 rounded-l px-2.5 py-1.5 bg-white text-slate-700 w-36 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="text-xs bg-slate-100 hover:bg-slate-200 border-t border-b border-r border-slate-300 text-slate-700 rounded-r px-2.5 py-1.5"
            >
              🔍
            </button>
          </form>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 shadow-sm"
          >
            <option value="all">All Sources</option>
            <option value="synthetic">Synthetic Benchmark</option>
            <option value="razorpay_test">Razorpay Test Mode</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 shadow-sm"
          >
            <option value="all">All Statuses</option>
            <option value="MATCHED">MATCHED</option>
            <option value="REVIEW">REVIEW</option>
            <option value="EXCEPTION">EXCEPTION</option>
          </select>

          <button
            onClick={loadCases}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 font-semibold text-sm text-slate-800 flex justify-between items-center">
          <span>Reconciliation Ledger ({cases.length} records shown)</span>
          <span className="text-xs text-slate-500 font-normal">Click any row to open the full Evidence Drawer</span>
        </div>

        {loading && <p className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading cases…</p>}
        {error && <p className="p-8 text-center text-rose-600 text-sm">Error: {error}</p>}

        {!loading && cases.length === 0 && !error && (
          <div className="p-12 text-center text-slate-500">
            <p className="font-bold text-base mb-1">No cases match your filters.</p>
            <p className="text-xs text-slate-400">Run reconciliation from the Overview page or clear filters.</p>
          </div>
        )}

        {cases.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Case ID</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Payment ID</th>
                  <th className="p-3">Settlement ID</th>
                  <th className="p-3">Method</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3">AI Recommendation</th>
                  <th className="p-3">Control Gate</th>
                  <th className="p-3">Final Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.map((c) => (
                  <tr
                    key={c.case_id}
                    className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                    onClick={() => setSelectedCase(c)}
                  >
                    <td className="p-3 font-mono font-bold text-slate-900">{c.case_id}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          c.source === 'razorpay_test'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {c.source === 'razorpay_test' ? '⚡ Razorpay' : '🔬 Synthetic'}
                      </span>
                    </td>
                    <td className="p-3 font-mono">{c.payment_id || '—'}</td>
                    <td className="p-3 font-mono">{c.settlement_id || '—'}</td>
                    <td className="p-3">{c.match_method || '—'}</td>
                    <td className="p-3 text-right font-mono font-medium text-slate-900">
                      {formatINR(c.financial_impact)}
                    </td>
                    <td className="p-3">
                      {c.ai_recommendation ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                          <span
                            className={`font-semibold ${
                              c.ai_recommendation === 'MATCHED'
                                ? 'text-emerald-700'
                                : c.ai_recommendation === 'REVIEW'
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {c.ai_recommendation}
                          </span>
                          <span className="text-slate-400">
                            ({((c.ai_confidence || 0) * 100).toFixed(0)}%)
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Deterministic (Rule)</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.control_result === 'PASS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {c.control_result || 'PASS'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.status === 'MATCHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'REVIEW'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCase && (
        <EvidenceDrawer
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
        />
      )}
    </div>
  );
}
