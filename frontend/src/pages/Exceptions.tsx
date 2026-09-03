import React, { useEffect, useState } from 'react';
import EvidenceDrawer from '../components/EvidenceDrawer';
import { api, formatINR } from '../api';

export default function Exceptions() {
  const [cases, setCases] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExceptions = () => {
    setLoading(true);
    setError(null);
    api.getExceptions({ source: sourceFilter, limit: 150 })
      .then((data) => {
        setCases(data || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadExceptions();
  }, [sourceFilter]);

  const handleExportCsv = () => {
    const url = api.exportExceptionsCsvUrl(sourceFilter);
    window.open(url, '_blank');
  };

  const totalExposure = cases.reduce((acc, c) => acc + (c.financial_impact || 0), 0);
  const highValueCount = cases.filter((c) => (c.financial_impact || 0) >= 5000000).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Unresolved Financial Exceptions</h2>
          <p className="text-sm text-slate-500">
            Cases requiring manual controller investigation, ranked by monetary exposure.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded px-2.5 py-1.5 bg-white text-slate-700 shadow-sm"
          >
            <option value="all">All Sources</option>
            <option value="synthetic">Synthetic Benchmark</option>
            <option value="razorpay_test">Razorpay Test Mode</option>
          </select>
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5"
          >
            <span>📥</span> Export Exceptions CSV
          </button>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Exception Cases</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{cases.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Monetary Exposure</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{formatINR(totalExposure)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">High-Value Exceptions (≥ ₹50,000)</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{highValueCount}</p>
        </div>
      </div>

      {/* Exceptions Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 font-semibold text-sm text-slate-800 flex justify-between items-center">
          <span>Ranked Exception Ledger</span>
          <span className="text-xs text-slate-500 font-normal">Click any row to open the complete Evidence Drawer</span>
        </div>

        {loading && <p className="p-8 text-center text-slate-400 text-sm animate-pulse">Loading exceptions…</p>}
        {error && <p className="p-8 text-center text-rose-600 text-sm">Error: {error}</p>}

        {!loading && cases.length === 0 && !error && (
          <div className="p-12 text-center text-slate-500">
            <p className="font-bold text-base mb-1">Zero unresolved exceptions.</p>
            <p className="text-xs text-slate-400">All transactions are reconciled or no data has been ingested.</p>
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
                  <th className="p-3">Discrepancy Method</th>
                  <th className="p-3 text-right">Financial Exposure</th>
                  <th className="p-3">Control Gate</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.map((c) => (
                  <tr
                    key={c.case_id}
                    className="hover:bg-rose-50/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedCase(c)}
                  >
                    <td className="p-3 font-mono font-bold text-rose-700">{c.case_id}</td>
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
                    <td className="p-3 font-mono">{c.payment_id || 'N/A'}</td>
                    <td className="p-3 font-mono">{c.settlement_id || 'Unsettled'}</td>
                    <td className="p-3">{c.match_method || 'ANOMALY'}</td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {formatINR(c.financial_impact)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.control_result === 'BLOCK'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {c.control_result || 'BLOCK'}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.status === 'REVIEW'
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
