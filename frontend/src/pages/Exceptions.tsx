import React, { useEffect, useState } from 'react';
import { api, formatINR, formatNumber, formatDate } from '../api';
import {
  AlertTriangle,
  Download,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';

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
    const url = api.exportExceptionsCsvUrl(currentSource === 'all' ? undefined : currentSource);
    window.open(url, '_blank');
  };

  const totalExposure = cases.reduce((acc, c) => acc + (c.financial_impact || 0), 0);
  const highValueCount = cases.filter((c) => (c.financial_impact || 0) >= 5000000).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-tprimary tracking-tight">Exceptions & Discrepancies</h2>
          <p className="text-xs text-tmuted mt-0.5">
            Strictly ranked by monetary exposure. Controller review required under Invariant Policy REC-004.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadExceptions}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 border border-navy-700 text-xs font-semibold text-tprimary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-status-matched hover:bg-emerald-600 text-slate-950 font-semibold text-xs shadow-card transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card space-y-1">
          <span className="text-[10px] font-mono uppercase text-tmuted">Total Financial Exposure</span>
          <p className="text-2xl font-bold font-mono text-status-review tabular-nums">
            {formatINR(totalExposure)}
          </p>
          <span className="text-[11px] text-tmuted block">Across {cases.length} active exceptions</span>
        </div>

        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card space-y-1">
          <span className="text-[10px] font-mono uppercase text-tmuted">High-Value Exceptions (≥₹50,000)</span>
          <p className="text-2xl font-bold font-mono text-status-exception tabular-nums">
            {highValueCount} cases
          </p>
          <span className="text-[11px] text-tmuted block">Mandatory certified sign-off</span>
        </div>

        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card space-y-1">
          <span className="text-[10px] font-mono uppercase text-tmuted">Export Format</span>
          <p className="text-sm font-bold font-mono text-tprimary mt-1">
            RFC 4180 Standard
          </p>
          <span className="text-[11px] text-tmuted block">Ready for ERP / SAP / NetSuite</span>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-status-exception/15 border border-status-exception/30 text-xs text-status-exception">
          {error}
        </div>
      )}

      {/* Exceptions Ranked Table */}
      <div className="rounded-xl bg-navy-850 border border-navy-700/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-navy-700 bg-navy-900/80 text-tmuted text-[10px] uppercase">
                <th className="py-3 px-4">Case ID</th>
                <th className="py-3 px-4">Payment ID</th>
                <th className="py-3 px-4">Discrepancy Reason</th>
                <th className="py-3 px-4 text-right">Monetary Exposure</th>
                <th className="py-3 px-4">Control Gate Verdict</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700/50">
              {loading && cases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-tmuted">
                    Loading ranked exceptions from database...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-status-matched font-medium">
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
                      className={`hover:bg-navy-800/80 cursor-pointer transition-colors group ${
                        isFlagship ? 'bg-status-review/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-tprimary group-hover:text-brand-blue">
                        <div className="flex items-center gap-2">
                          <span>{c.case_id}</span>
                          {isHighVal && (
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-status-exception/15 text-status-exception border border-status-exception/30 font-bold">
                              HIGH VALUE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-tsecondary">
                        {c.payment_id || '—'}
                      </td>
                      <td className="py-3 px-4 text-tmuted">
                        {c.match_method || c.amount_delta > 0 ? `Delta: ${formatINR(c.amount_delta)}` : 'Invariant Block'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-status-review tabular-nums text-sm">
                        {formatINR(c.financial_impact)}
                      </td>
                      <td className="py-3 px-4 text-status-exception font-bold">
                        <div className="flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>{c.control_result || 'BLOCK'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold border ${
                            c.status === 'REVIEW'
                              ? 'bg-status-review/15 text-status-review border-status-review/30'
                              : 'bg-status-exception/15 text-status-exception border-status-exception/30'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[11px] text-brand-blue group-hover:underline flex items-center justify-end gap-1">
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

        <div className="px-4 py-3 border-t border-navy-700 bg-navy-900/60 flex items-center justify-between text-xs font-mono text-tmuted">
          <span>{cases.length} exceptions ranked by monetary exposure</span>
          <span>RFC 4180 Compliant</span>
        </div>
      </div>
    </div>
  );
}
