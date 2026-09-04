import React, { useEffect, useState } from 'react';
import { api, formatINR, formatDate, formatNumber } from '../api';
import {
  Layers,
  RefreshCw,
  AlertOctagon,
  CheckCircle2,
  Landmark,
  ArrowRight,
  X,
  FileText,
  Calculator,
  Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';

interface SettlementsProps {
  currentSource: string;
}

export default function Settlements({ currentSource }: SettlementsProps) {
  const [settlements, setSettlements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSettlement, setSelectedSettlement] = useState<any | null>(null);

  const loadSettlements = () => {
    setLoading(true);
    api.getSettlements({
      source: currentSource === 'all' ? undefined : currentSource,
      limit: 100,
    })
      .then((data) => setSettlements(data || []))
      .catch((err) => console.error('Failed to load settlements:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSettlements();
  }, [currentSource]);

  const totalGross = settlements.reduce((acc, s) => acc + (s.gross_amount || 0), 0);
  const totalNet = settlements.reduce((acc, s) => acc + (s.net_amount || 0), 0);
  const totalFees = settlements.reduce((acc, s) => acc + (s.fees || 0), 0);
  const totalTax = settlements.reduce((acc, s) => acc + (s.tax || 0), 0);
  const deltaCount = settlements.filter((s) => (s.unexplained_delta || 0) > 0).length;
  const totalDelta = settlements.reduce((acc, s) => acc + (s.unexplained_delta || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-content-primary tracking-tight">
            Settlement Batches & Waterfall
          </h2>
          <p className="text-xs text-content-muted mt-0.5 font-mono">
            Audit gateway settlement batches, fee deductions, tax withholdings, and bank UTR credit advices.
          </p>
        </div>

        <button
          onClick={loadSettlements}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-content-secondary hover:text-content-primary shadow-subtle transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand' : ''}`} />
          <span>Refresh Batches</span>
        </button>
      </div>

      {/* Waterfall KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Gross Settled Volume"
          value={formatINR(totalGross)}
          subValue={`${settlements.length} settlement batches`}
          accent="blue"
        />

        <MetricCard
          label="Total Fees & Tax Withheld"
          value={`- ${formatINR(totalFees + totalTax)}`}
          subValue="MDR + 18% Statutory GST"
          accent="coral"
        />

        <MetricCard
          label="Net Bank Deposited"
          value={formatINR(totalNet)}
          subValue="Cleared via RBI NEFT / RTGS"
          accent="mint"
        />

        <MetricCard
          label="Waterfall Delta Anomalies"
          value={formatINR(totalDelta)}
          subValue={`${deltaCount} anomalous batch${deltaCount === 1 ? '' : 'es'} detected`}
          accent={deltaCount > 0 ? 'coral' : 'mint'}
        />
      </div>

      {/* Formula Explanation Banner */}
      <div className="p-3.5 rounded-lg bg-surface border border-border shadow-card flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-2.5 text-content-secondary">
          <Calculator className="w-4 h-4 text-brand flex-shrink-0" />
          <span>
            <strong className="text-content-primary">Waterfall Invariant Formula:</strong> Net Amount = Gross Captured − MDR Fees − 18% GST − Refunds − Chargebacks ± Adjustments
          </span>
        </div>
        <span className="text-[11px] text-content-muted hidden md:inline">
          Precision: 0 Paise Tolerance
        </span>
      </div>

      {/* Settlements Table */}
      <div className="rounded-lg bg-surface border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-border bg-surface-sunken text-content-muted text-[10px] uppercase tracking-wider sticky top-0">
                <th className="py-3 px-4">Settlement ID</th>
                <th className="py-3 px-4 text-right">Gross</th>
                <th className="py-3 px-4 text-right">Fees</th>
                <th className="py-3 px-4 text-right">Tax (GST)</th>
                <th className="py-3 px-4 text-right">Net Deposited</th>
                <th className="py-3 px-4 text-right">Delta</th>
                <th className="py-3 px-4">Bank UTR</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && settlements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-content-muted">
                    Loading settlement batches from database...
                  </td>
                </tr>
              ) : settlements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-content-muted">
                    No settlement records found.
                  </td>
                </tr>
              ) : (
                settlements.map((s) => {
                  const hasDelta = (s.unexplained_delta || 0) > 0;
                  return (
                    <tr
                      key={s.settlement_id}
                      onClick={() => setSelectedSettlement(s)}
                      className={`hover:bg-surface-elevated cursor-pointer transition-colors group ${
                        hasDelta ? 'bg-[#FF647C]/5 dark:bg-[#FF647C]/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-content-primary group-hover:text-brand">
                        {s.settlement_id}
                      </td>
                      <td className="py-3 px-4 text-right text-content-primary tabular-nums">
                        {formatINR(s.gross_amount)}
                      </td>
                      <td className="py-3 px-4 text-right text-[#E03A53] dark:text-[#FF647C] tabular-nums">
                        - {formatINR(s.fees)}
                      </td>
                      <td className="py-3 px-4 text-right text-[#E03A53] dark:text-[#FF647C] tabular-nums">
                        - {formatINR(s.tax)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-status-mint tabular-nums">
                        {formatINR(s.net_amount)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        {hasDelta ? (
                          <StatusBadge status="EXCEPTION" label={formatINR(s.unexplained_delta)} size="sm" />
                        ) : (
                          <span className="text-content-muted text-[11px]">₹0.00</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-content-secondary">
                        {s.utr || 'Pending'}
                      </td>
                      <td className="py-3 px-4 text-content-muted">
                        {formatDate(s.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[11px] text-brand font-semibold group-hover:underline inline-flex items-center justify-end gap-1">
                          Waterfall <ArrowRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Waterfall Detail Modal */}
      <AnimatePresence>
        {selectedSettlement && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedSettlement(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-elevated p-6 z-10 space-y-4"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand" />
                  <span className="font-mono font-bold text-sm text-content-primary">
                    Settlement Waterfall: {selectedSettlement.settlement_id}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSettlement(null)}
                  className="p-1 rounded-md text-content-muted hover:text-content-primary hover:bg-surface-elevated transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Arithmetic Waterfall Breakdown */}
              <div className="space-y-2.5 text-xs font-mono bg-surface-sunken p-4 rounded-lg border border-border">
                <div className="flex justify-between py-1.5 border-b border-border/80">
                  <span className="text-content-secondary flex items-center gap-2">
                    <span className="w-4 text-center font-bold text-status-mint">+</span>
                    <span>Gross Captured Volume</span>
                  </span>
                  <span className="font-bold text-content-primary tabular-nums">
                    {formatINR(selectedSettlement.gross_amount)}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-border/80">
                  <span className="text-content-muted flex items-center gap-2">
                    <span className="w-4 text-center font-bold text-[#E03A53] dark:text-[#FF647C]">−</span>
                    <span>MDR Gateway Processing Fees</span>
                  </span>
                  <span className="text-[#E03A53] dark:text-[#FF647C] tabular-nums font-medium">
                    {formatINR(selectedSettlement.fees)}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-border/80">
                  <span className="text-content-muted flex items-center gap-2">
                    <span className="w-4 text-center font-bold text-[#E03A53] dark:text-[#FF647C]">−</span>
                    <span>Statutory GST on Fees (18%)</span>
                  </span>
                  <span className="text-[#E03A53] dark:text-[#FF647C] tabular-nums font-medium">
                    {formatINR(selectedSettlement.tax)}
                  </span>
                </div>

                {selectedSettlement.refunds > 0 && (
                  <div className="flex justify-between py-1.5 border-b border-border/80">
                    <span className="text-content-muted flex items-center gap-2">
                      <span className="w-4 text-center font-bold text-[#E03A53] dark:text-[#FF647C]">−</span>
                      <span>Net Refund Deductions</span>
                    </span>
                    <span className="text-[#E03A53] dark:text-[#FF647C] tabular-nums font-medium">
                      {formatINR(selectedSettlement.refunds)}
                    </span>
                  </div>
                )}

                {selectedSettlement.chargebacks > 0 && (
                  <div className="flex justify-between py-1.5 border-b border-border/80">
                    <span className="text-content-muted flex items-center gap-2">
                      <span className="w-4 text-center font-bold text-[#E03A53] dark:text-[#FF647C]">−</span>
                      <span>Chargeback Deductions</span>
                    </span>
                    <span className="text-[#E03A53] dark:text-[#FF647C] tabular-nums font-medium">
                      {formatINR(selectedSettlement.chargebacks)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between py-2.5 border-t-2 border-border font-bold text-sm bg-surface p-2 rounded">
                  <span className="text-content-primary flex items-center gap-2">
                    <span className="w-4 text-center font-bold text-brand">=</span>
                    <span>Actual Bank Credit (Net)</span>
                  </span>
                  <span className="text-status-mint tabular-nums text-base">
                    {formatINR(selectedSettlement.net_amount)}
                  </span>
                </div>

                {/* Delta Verdict */}
                <div className="pt-2">
                  {selectedSettlement.unexplained_delta > 0 ? (
                    <div className="p-3 rounded-lg bg-[#FF647C]/12 border border-[#FF647C]/30 flex items-center justify-between text-[#E03A53] dark:text-[#FF647C] font-bold">
                      <span>UNEXPLAINED ARITHMETIC DELTA:</span>
                      <span className="tabular-nums text-sm">{formatINR(selectedSettlement.unexplained_delta)}</span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-[#04DB7C]/10 border border-[#04DB7C]/25 flex items-center justify-between text-[#04DB7C] font-semibold text-xs">
                      <span>Unexplained Delta: ₹0.00</span>
                      <StatusBadge status="PASS" label="WATERFALL PASS" size="sm" />
                    </div>
                  )}
                </div>

                {/* Bank metadata */}
                <div className="pt-2 text-[11px] text-content-muted space-y-1 border-t border-border/60">
                  <p>Bank Reference (UTR): <span className="text-content-secondary font-bold">{selectedSettlement.utr || 'Pending NEFT clearance'}</span></p>
                  <p>Settlement Date: <span className="text-content-secondary">{formatDate(selectedSettlement.created_at)}</span></p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
