import React, { useEffect, useState } from 'react';
import { api, formatINR, formatNumber } from '../api';
import {
  Search,
  RefreshCw,
  Cpu,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-content-primary tracking-tight">
            Reconciliation Ledger
          </h2>
          <p className="text-xs text-content-muted mt-0.5 font-mono">
            Full transactional audit trail: Deterministic exact ID matches, AI investigations, and Control Gate invariants.
          </p>
        </div>

        <button
          onClick={loadCases}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-content-secondary hover:text-content-primary shadow-subtle transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-lg bg-surface border border-border shadow-card flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-surface-sunken p-1 rounded-md border border-border">
          {['all', 'MATCHED', 'REVIEW', 'EXCEPTION'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-surface text-content-primary shadow-subtle font-semibold border border-border'
                  : 'text-content-muted hover:text-content-primary'
              }`}
            >
              {st === 'all' ? 'ALL STATUS' : st}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-content-muted absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Case, Payment or Settlement ID..."
              className="w-full bg-surface-sunken border border-border rounded-md pl-8 pr-3 py-1.5 text-xs text-content-primary placeholder-content-muted focus:outline-none focus:border-brand font-mono transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-md bg-surface-elevated hover:bg-surface border border-border text-xs font-medium text-content-secondary shadow-subtle"
          >
            Search
          </button>
        </form>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-lg bg-[#FF647C]/10 border border-[#FF647C]/30 text-xs text-[#E03A53] dark:text-[#FF647C] font-mono">
          {error}
        </div>
      )}

      {/* Ledger Table */}
      <div className="rounded-lg bg-surface border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-content-muted text-[10px] uppercase tracking-wider sticky top-0">
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
            <tbody className="divide-y divide-border/60">
              {loading && cases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-content-muted">
                    Loading reconciliation records from authoritative database...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-content-muted">
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
                      className={`hover:bg-surface-elevated cursor-pointer transition-colors group ${
                        isFlagship
                          ? 'bg-[#8B7CFF]/5 dark:bg-[#8B7CFF]/10 border-l-2 border-l-[#8B7CFF]'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-content-primary group-hover:text-brand">
                        <div className="flex items-center gap-1.5">
                          <span>{c.case_id}</span>
                          {isFlagship && (
                            <span className="text-[10px] font-mono text-[#8B7CFF] font-bold">
                              FLAGSHIP
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-content-secondary">
                        {c.payment_id || '-'}
                      </td>
                      <td className="py-3 px-4 text-content-muted">
                        {c.settlement_id || 'Unallocated'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-content-primary tabular-nums">
                        {formatINR(c.financial_impact)}
                      </td>
                      <td className="py-3 px-4 text-content-secondary">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-surface-sunken border border-border">
                          {c.match_method || 'PENDING'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {c.ai_recommendation ? (
                          <div className="flex items-center gap-1.5 text-[#7462F5] dark:text-[#A79CFF]">
                            <Cpu className="w-3.5 h-3.5" />
                            <span className="font-semibold text-[11px]">
                              {c.ai_recommendation} ({c.ai_confidence ? `${(c.ai_confidence * 100).toFixed(0)}%` : '-'})
                            </span>
                          </div>
                        ) : (
                          <span className="text-content-muted text-[11px]">Deterministic</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          status={c.control_result || 'PASS'}
                          size="sm"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[11px] text-brand font-semibold group-hover:underline inline-flex items-center justify-end gap-1">
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
        <div className="px-4 py-3 border-t border-border bg-surface-sunken flex items-center justify-between text-xs font-mono text-content-muted">
          <span>Showing up to {formatNumber(cases.length)} records</span>
          <span>Workspace: {currentSource.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
