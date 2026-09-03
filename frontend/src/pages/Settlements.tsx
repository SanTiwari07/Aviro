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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-tprimary tracking-tight">Settlement Batches & Waterfall</h2>
          <p className="text-xs text-tmuted mt-0.5">
            Audit gateway settlement batches, fee deductions, tax withholdings, and bank UTR credit advices.
          </p>
        </div>

        <button
          onClick={loadSettlements}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 border border-navy-700 text-xs font-semibold text-tprimary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Batches</span>
        </button>
      </div>

      {/* Waterfall KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card space-y-1">
          <span className="text-[10px] font-mono uppercase text-tmuted">Gross Settled Volume</span>
          <p className="text-2xl font-bold font-mono text-tprimary tabular-nums">
            {formatINR(totalGross)}
          </p>
          <span className="text-[11px] text-tmuted block">{settlements.length} settlement batches</span>
        </div>

        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card space-y-1">
          <span className="text-[10px] font-mono uppercase text-tmuted">Total Fees & Tax Withheld</span>
          <p className="text-2xl font-bold font-mono text-status-exception tabular-nums">
            - {formatINR(totalFees + totalTax)}
          </p>
          <span className="text-[11px] text-tmuted block">MDR + 18% Statutory GST</span>
        </div>

        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card space-y-1">
          <span className="text-[10px] font-mono uppercase text-tmuted">Net Bank Deposited</span>
          <p className="text-2xl font-bold font-mono text-status-matched tabular-nums">
            {formatINR(totalNet)}
          </p>
          <span className="text-[11px] text-tmuted block">Cleared via RBI NEFT / RTGS</span>
        </div>

        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card space-y-1">
          <span className="text-[10px] font-mono uppercase text-tmuted">Waterfall Delta Anomalies</span>
          <p className={`text-2xl font-bold font-mono tabular-nums ${deltaCount > 0 ? 'text-status-exception' : 'text-status-matched'}`}>
            {formatINR(totalDelta)}
          </p>
          <span className="text-[11px] text-tmuted block">
            {deltaCount} anomalous batch{deltaCount === 1 ? '' : 'es'} detected
          </span>
        </div>
      </div>

      {/* Settlements Table */}
      <div className="rounded-xl bg-navy-850 border border-navy-700/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-navy-700 bg-navy-900/80 text-tmuted text-[10px] uppercase">
                <th className="py-3 px-4">Settlement ID</th>
                <th className="py-3 px-4 text-right">Gross</th>
                <th className="py-3 px-4 text-right">Fees</th>
                <th className="py-3 px-4 text-right">Tax (GST)</th>
                <th className="py-3 px-4 text-right">Net Deposited</th>
                <th className="py-3 px-4 text-right">Delta</th>
                <th className="py-3 px-4">Bank UTR</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700/50">
              {loading && settlements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-tmuted">
                    Loading settlement batches from database...
                  </td>
                </tr>
              ) : settlements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-tmuted">
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
                      className={`hover:bg-navy-800/80 cursor-pointer transition-colors group ${
                        hasDelta ? 'bg-status-exception/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-tprimary group-hover:text-brand-blue">
                        {s.settlement_id}
                      </td>
                      <td className="py-3 px-4 text-right text-tprimary tabular-nums">
                        {formatINR(s.gross_amount)}
                      </td>
                      <td className="py-3 px-4 text-right text-status-exception tabular-nums">
                        - {formatINR(s.fees)}
                      </td>
                      <td className="py-3 px-4 text-right text-status-exception tabular-nums">
                        - {formatINR(s.tax)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-status-matched tabular-nums">
                        {formatINR(s.net_amount)}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums">
                        {hasDelta ? (
                          <span className="font-bold text-status-exception px-1.5 py-0.5 rounded bg-status-exception/15 border border-status-exception/30">
                            {formatINR(s.unexplained_delta)}
                          </span>
                        ) : (
                          <span className="text-tmuted">₹0.00</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-tsecondary">
                        {s.utr || 'Pending'}
                      </td>
                      <td className="py-3 px-4 text-tmuted">
                        {formatDate(s.created_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[11px] text-brand-blue group-hover:underline flex items-center justify-end gap-1">
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
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setSelectedSettlement(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-navy-850 border border-navy-700 rounded-xl shadow-elevated p-6 z-10 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-navy-700">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-blue" />
                  <span className="font-mono font-bold text-sm text-tprimary">
                    Waterfall: {selectedSettlement.settlement_id}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedSettlement(null)}
                  className="p-1 rounded text-tmuted hover:text-tprimary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-navy-800">
                  <span className="text-tsecondary">Gross Captured Volume:</span>
                  <span className="font-bold text-tprimary tabular-nums">
                    + {formatINR(selectedSettlement.gross_amount)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-navy-800">
                  <span className="text-tmuted">MDR Gateway Fees:</span>
                  <span className="text-status-exception tabular-nums">
                    - {formatINR(selectedSettlement.fees)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-navy-800">
                  <span className="text-tmuted">Statutory GST (18%):</span>
                  <span className="text-status-exception tabular-nums">
                    - {formatINR(selectedSettlement.tax)}
                  </span>
                </div>
                {selectedSettlement.refunds > 0 && (
                  <div className="flex justify-between py-1 border-b border-navy-800">
                    <span className="text-tmuted">Net Refund Deductions:</span>
                    <span className="text-status-exception tabular-nums">
                      - {formatINR(selectedSettlement.refunds)}
                    </span>
                  </div>
                )}
                {selectedSettlement.chargebacks > 0 && (
                  <div className="flex justify-between py-1 border-b border-navy-800">
                    <span className="text-tmuted">Chargeback Deductions:</span>
                    <span className="text-status-exception tabular-nums">
                      - {formatINR(selectedSettlement.chargebacks)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between py-2 border-t border-navy-700 font-bold text-sm">
                  <span className="text-tprimary">Actual Bank Deposited:</span>
                  <span className="text-status-matched tabular-nums">
                    = {formatINR(selectedSettlement.net_amount)}
                  </span>
                </div>

                {selectedSettlement.unexplained_delta > 0 && (
                  <div className="p-3 rounded-lg bg-status-exception/15 border border-status-exception/30 flex items-center justify-between text-status-exception font-bold">
                    <span>UNEXPLAINED ARITHMETIC DELTA:</span>
                    <span className="tabular-nums">{formatINR(selectedSettlement.unexplained_delta)}</span>
                  </div>
                )}

                <div className="pt-2 text-[11px] text-tmuted space-y-1">
                  <p>Bank Reference (UTR): {selectedSettlement.utr || 'Pending NEFT clearance'}</p>
                  <p>Settlement Date: {formatDate(selectedSettlement.created_at)}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
