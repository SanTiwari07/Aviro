import React, { useEffect, useState } from 'react';
import { api, formatINR } from '../api';
import EvidenceDrawer from '../components/EvidenceDrawer';

export default function Settlements() {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedCase, setSelectedCase] = useState<any>(null);

  const loadSettlements = () => {
    setLoading(true);
    api.getSettlements({ source: sourceFilter, limit: 100 })
      .then((data) => setSettlements(data || []))
      .catch((err) => console.error('Failed to load settlements:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSettlements();
  }, [sourceFilter]);

  const totalGross = settlements.reduce((acc, s) => acc + (s.gross_amount || 0), 0);
  const totalNet = settlements.reduce((acc, s) => acc + (s.net_amount || 0), 0);
  const totalFees = settlements.reduce((acc, s) => acc + (s.fees || 0), 0);
  const deltaCount = settlements.filter((s) => (s.unexplained_delta || 0) > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Settlement Batches & Waterfall</h2>
          <p className="text-sm text-slate-500">
            Audit payment gateway settlement batches, fee deductions, tax withholdings, and bank UTRs.
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
            onClick={loadSettlements}
            className="px-3 py-1.5 text-xs font-semibold rounded bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Waterfall Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Gross Volume</p>
          <p className="text-xl font-bold text-slate-900 mt-1">{formatINR(totalGross)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Gateway Deductions (Fees + Tax)</p>
          <p className="text-xl font-bold text-slate-700 mt-1">{formatINR(totalFees)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Net Deposited</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{formatINR(totalNet)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500 uppercase">Waterfall Discrepancies</p>
          <p className={`text-xl font-bold mt-1 ${deltaCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {deltaCount} {deltaCount > 0 ? 'anomalies' : 'clean'}
          </p>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 font-semibold text-sm text-slate-800 flex justify-between items-center">
          <span>Settlement Records</span>
          <span className="text-xs text-slate-500 font-normal">Click any row to inspect evidentiary waterfall</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 animate-pulse text-sm">
            Loading settlements...
          </div>
        ) : settlements.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No settlement records found for selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="p-3">Settlement ID</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Gross (₹)</th>
                  <th className="p-3">Fees (₹)</th>
                  <th className="p-3">Tax (₹)</th>
                  <th className="p-3">Net (₹)</th>
                  <th className="p-3">UTR / Bank Ref</th>
                  <th className="p-3">Waterfall Delta</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {settlements.map((s) => (
                  <tr
                    key={s.settlement_id}
                    onClick={() =>
                      setSelectedCase({
                        case_id: `CASE_SETL_${s.settlement_id.replace(/^setl_|^SET_/, '')}`,
                        settlement_id: s.settlement_id,
                        financial_impact: s.gross_amount,
                        amount_delta: s.unexplained_delta || 0,
                        source: s.source,
                        status: s.unexplained_delta > 0 ? 'EXCEPTION' : 'MATCHED',
                      })
                    }
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-mono font-bold text-slate-900">{s.settlement_id}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          s.source === 'razorpay_test'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {s.source === 'razorpay_test' ? '⚡ Razorpay' : '🔬 Synthetic'}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-medium text-slate-900">
                      {formatINR(s.gross_amount)}
                    </td>
                    <td className="p-3 font-mono text-slate-600">{formatINR(s.fees)}</td>
                    <td className="p-3 font-mono text-slate-600">{formatINR(s.tax)}</td>
                    <td className="p-3 font-mono font-semibold text-emerald-700">
                      {formatINR(s.net_amount)}
                    </td>
                    <td className="p-3 font-mono text-slate-600">{s.utr || 'Pending'}</td>
                    <td className="p-3">
                      {s.unexplained_delta > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-mono font-bold">
                          {formatINR(s.unexplained_delta)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium">✓ Clean (₹0)</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-semibold uppercase text-[10px]">
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-400 text-[11px]">
                      {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCase && (
        <EvidenceDrawer caseData={selectedCase} onClose={() => setSelectedCase(null)} />
      )}
    </div>
  );
}
