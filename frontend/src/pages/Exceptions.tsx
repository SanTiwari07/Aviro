import React, { useEffect, useState } from 'react';
import { api, formatINR, formatNumber } from '../api';
import {
  Download,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';

interface ExceptionsProps {
  onOpenCase: (caseId: string) => void;
  currentSource: string;
}

export default function Exceptions({
  onOpenCase,
  currentSource,
}: ExceptionsProps) {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExceptions = () => {
    setLoading(true);
    setError(null);
    api.getExceptions({
      source: currentSource === 'all' ? undefined : currentSource,
      limit: 150,
    })
      .then((data) => setCases(data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadExceptions();
  }, [currentSource]);

  const handleExportCsv = () => {
    const url = api.exportExceptionsCsvUrl(
      currentSource === 'all' ? undefined : currentSource
    );
    window.open(url, '_blank');
  };

  const totalExposure = cases.reduce(
    (acc, c) => acc + (c.financial_impact || 0),
    0
  );
  const highValueCount = cases.filter(
    (c) => (c.financial_impact || 0) >= 5000000
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-content-primary tracking-tight">
            Exceptions & Discrepancies
          </h2>
          <p className="text-xs text-content-muted mt-0.5 font-mono">
            Strictly ranked by monetary exposure. Controller review required under Invariant Policy REC-004.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadExceptions}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-content-secondary hover:text-content-primary shadow-subtle transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand' : ''}`}
            />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-md bg-status-mint hover:bg-emerald-500 text-slate-950 font-semibold text-xs shadow-card transition-all active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Financial Exposure"
          value={formatINR(totalExposure)}
          subValue={`Across ${formatNumber(cases.length)} active exceptions`}
          accent="amber"
        />

        <MetricCard
          label="High-Value Exceptions (≥₹50,000)"
          value={`${formatNumber(highValueCount)} cases`}
          subValue="Mandatory certified sign-off"
          meta="Invariant 6 Safeguard Active"
          accent="coral"
        />

        <MetricCard
          label="Export Format"
          value="RFC 4180"
          subValue="Standard CSV Format"
          meta="Ready for ERP / SAP / NetSuite"
          accent="mint"
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-lg bg-[#FF647C]/10 border border-[#FF647C]/30 text-xs text-[#E03A53] dark:text-[#FF647C] font-mono">
          {error}
        </div>
      )}

      {/* Exceptions Ranked Table */}
      <div className="rounded-lg bg-surface border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-content-muted text-[10px] uppercase tracking-wider sticky top-0">
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Discrepancy Reason</th>
                <th className="py-3 px-4 text-right">Monetary Exposure</th>
                <th className="py-3 px-4">Control Gate Verdict</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && cases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-content-muted">
                    Loading ranked exceptions from database...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-status-mint font-medium"
                  >
                    Zero unresolved exceptions detected. All ledger transactions reconciled.
                  </td>
                </tr>
              ) : (
                cases.map((c) => {
                  const isHighVal = (c.financial_impact || 0) >= 5000000;
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
                        <div className="flex items-center gap-2">
                          <span>{c.case_id}</span>
                          {isHighVal && (
                            <span className="text-[10px] font-mono text-[#FF647C] font-bold">
                              HIGH VALUE
                            </span>
                          )}
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
                        {c.match_method ||
                          (c.amount_delta > 0
                            ? `Delta: ${formatINR(c.amount_delta)}`
                            : 'Invariant Block')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-[#D98A26] dark:text-[#FFB454] tabular-nums text-sm">
                        {formatINR(c.financial_impact)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          status={c.control_result || 'BLOCK'}
                          size="sm"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[11px] text-brand font-semibold group-hover:underline inline-flex items-center justify-end gap-1">
                          Resolve <ArrowRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-border bg-surface-sunken flex items-center justify-between text-xs font-mono text-content-muted">
          <span>{cases.length} exceptions ranked by monetary exposure</span>
          <span>RFC 4180 Compliant</span>
        </div>
      </div>
    </div>
  );
}
