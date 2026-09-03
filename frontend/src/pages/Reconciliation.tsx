import React, { useEffect, useState } from 'react';
import { api, formatINR, formatNumber, formatDate } from '../api';
import {
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  ArrowRight,
  RefreshCw,
  Cpu,
  Layers,
  ShieldAlert,
} from 'lucide-react';

interface ReconciliationProps {
  onOpenCase: (caseId: string) => void;
  currentSource: string;
}

export default function Reconciliation({
  onOpenCase,
  currentSource,
}: ReconciliationProps) {
  const [cases, setCases] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCases = () => {
    setLoading(true);
    setError(null);
    api.getReconciliation({
      source: currentSource === 'all' ? undefined : currentSource,
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: search.trim() || undefined,
      limit: 150,
    })
      .then((data) => setCases(data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCases();
  }, [currentSource, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCases();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-tprimary tracking-tight">Reconciliation Ledger</h2>
          <p className="text-xs text-tmuted mt-0.5">
            Full transactional audit trail: Deterministic exact ID matches, AI investigations, and Control Gate invariants.
          </p>
        </div>

        <button
          onClick={loadCases}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 border border-navy-700 text-xs font-semibold text-tprimary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-navy-900 p-1 rounded-lg border border-navy-700/80">
          {['all', 'MATCHED', 'REVIEW', 'EXCEPTION'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-navy-750 text-tprimary shadow-sm border border-navy-600'
                  : 'text-tmuted hover:text-tsecondary'
              }`}
            >
              {st === 'all' ? 'ALL STATUS' : st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-tmuted absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Case, Payment or Settlement ID..."
              className="w-full bg-navy-900 border border-navy-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-tprimary placeholder-tmuted focus:outline-none focus:border-brand-blue font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 border border-navy-700 text-xs font-medium text-tsecondary"
          >
            Search
          </button>
        </form>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-status-exception/15 border border-status-exception/30 text-xs text-status-exception">
          {error}
        </div>
      )}

      {/* Ledger Table */}
      <div className="rounded-xl bg-navy-850 border border-navy-700/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-navy-700 bg-navy-900/80 text-tmuted text-[10px] uppercase">
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Settlement ID</th>
                <th className="py-3 px-4 text-right">Gross Amount</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">AI Investigation</th>
                <th className="py-3 px-4">Control Gate</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700/50">
              {loading && cases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-tmuted">
                    Loading reconciliation records from authoritative database...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-tmuted">
                    No matching records located for selected filters.
                  </td>
                </tr>
              ) : (
                cases.map((c) => {
                  const isFlagship = c.case_id === 'CASE_PAY_FLAGSHIP_001';
                  return (
                    <tr
                      key={c.case_id}
                      onClick={() => onOpenCase(c.case_id)}
                      className={`hover:bg-navy-800/80 cursor-pointer transition-colors group ${
                        isFlagship ? 'bg-status-review/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-tprimary group-hover:text-brand-blue">
                        <div className="flex items-center gap-1.5">
                          {c.case_id}
                          {isFlagship && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-status-review/20 text-status-review border border-status-review/30 font-bold">
                              FLAGSHIP
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-tsecondary">
                        {c.payment_id || '—'}
                      </td>
                      <td className="py-3 px-4 text-tmuted">
                        {c.settlement_id || 'Unallocated'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-tprimary tabular-nums">
                        {formatINR(c.financial_impact)}
                      </td>
                      <td className="py-3 px-4 text-tsecondary">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-navy-900 border border-navy-700">
                          {c.match_method || 'PENDING'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-tsecondary">
                        {c.ai_recommendation ? (
                          <div className="flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-brand-blue" />
                            <span className="text-brand-blue font-semibold">
                              {c.ai_recommendation} ({c.ai_confidence ? `${(c.ai_confidence * 100).toFixed(0)}%` : '—'})
                            </span>
                          </div>
                        ) : (
                          <span className="text-tmuted text-[11px]">Deterministic</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] uppercase font-bold ${
                            c.control_result === 'BLOCK'
                              ? 'text-status-exception flex items-center gap-1'
                              : 'text-status-matched'
                          }`}
                        >
                          {c.control_result === 'BLOCK' && <ShieldAlert className="w-3 h-3" />}
                          {c.control_result || 'PASS'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold border ${
                            c.status === 'MATCHED'
                              ? 'bg-status-matched/15 text-status-matched border-status-matched/30'
                              : c.status === 'REVIEW'
                              ? 'bg-status-review/15 text-status-review border-status-review/30'
                              : 'bg-status-exception/15 text-status-exception border-status-exception/30'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[11px] text-brand-blue group-hover:underline flex items-center justify-end gap-1">
                          Inspect <ArrowRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="px-4 py-3 border-t border-navy-700 bg-navy-900/60 flex items-center justify-between text-xs font-mono text-tmuted">
          <span>Showing up to {formatNumber(cases.length)} records</span>
          <span>Workspace: {currentSource.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
