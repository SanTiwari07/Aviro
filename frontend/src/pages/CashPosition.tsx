import React, { useEffect, useState } from 'react';
import { api, formatINR, formatDate, formatPercent } from '../api';
import {
  TrendingUp,
  Landmark,
  Clock,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { motion } from 'motion/react';

export default function CashPosition() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    api.getCashForecast()
      .then((res) => setData(res))
      .catch((err) => console.error('Cash forecast failed:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const cf = data?.confirmed_cash || 0;
  const es = data?.expected_settlements || 0;
  const inflow7d = data?.seven_day_expected_inflow || 0;
  const projections = data?.projections || [];
  const riskBuffer = data?.unresolved_risk_buffer || 0;
  const netLiquidity = cf + es - riskBuffer;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-tprimary tracking-tight">Cash Position & Liquidity Controller</h2>
          <p className="text-xs text-tmuted mt-0.5">
            Real-time treasury visibility: Confirmed Bank Cash, T+2 Gateway Pipeline, and 7-Day Inflow Modeling.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 border border-navy-700 text-xs font-semibold text-tprimary transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Treasury Data</span>
        </button>
      </div>

      {/* Primary Liquidity Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Confirmed Bank Cash */}
        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card space-y-2">
          <div className="flex items-center justify-between text-tmuted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Confirmed Bank Cash</span>
            <Landmark className="w-4 h-4 text-status-matched" />
          </div>
          <p className="text-2xl font-bold font-mono text-status-matched tabular-nums">
            {formatINR(cf)}
          </p>
          <p className="text-[11px] text-tmuted flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-status-matched" />
            <span>Cleared via Bank UTR verification</span>
          </p>
        </div>

        {/* Card 2: Gateway Pipeline (T+2) */}
        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card space-y-2">
          <div className="flex items-center justify-between text-tmuted">
            <span className="text-[11px] font-mono uppercase tracking-wider">In-Flight Pipeline (T+2)</span>
            <Clock className="w-4 h-4 text-brand-blue" />
          </div>
          <p className="text-2xl font-bold font-mono text-brand-blue tabular-nums">
            {formatINR(es)}
          </p>
          <p className="text-[11px] text-tmuted">
            Captured by gateway, clearing in 24–48h
          </p>
        </div>

        {/* Card 3: Unresolved Risk Deduction */}
        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card space-y-2">
          <div className="flex items-center justify-between text-tmuted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Risk Buffer Deducted</span>
            <ShieldAlert className="w-4 h-4 text-status-review" />
          </div>
          <p className="text-2xl font-bold font-mono text-status-review tabular-nums">
            - {formatINR(riskBuffer)}
          </p>
          <p className="text-[11px] text-tmuted">
            Withheld pending exception resolution
          </p>
        </div>

        {/* Card 4: Net Operable Liquidity */}
        <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card space-y-2">
          <div className="flex items-center justify-between text-tmuted">
            <span className="text-[11px] font-mono uppercase tracking-wider">Net Operable Liquidity</span>
            <TrendingUp className="w-4 h-4 text-tprimary" />
          </div>
          <p className="text-2xl font-bold font-mono text-tprimary tabular-nums">
            {formatINR(netLiquidity)}
          </p>
          <p className="text-[11px] text-tmuted">
            Bank Cash + Gateway - Risk Buffer
          </p>
        </div>
      </div>

      {/* 7-Day Inflow Forecasting Projection */}
      <div className="p-5 rounded-xl bg-navy-850 border border-navy-700/80 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-navy-700">
          <div>
            <h3 className="text-sm font-bold text-tprimary">7-Day Projected Settlement Clearance Curve</h3>
            <p className="text-xs text-tmuted">
              Forecasted net cash arrivals modeled across banking business days and settlement cutoffs.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-tmuted block">7-Day Total Inflow</span>
            <span className="font-mono font-bold text-base text-tprimary tabular-nums">
              {formatINR(inflow7d)}
            </span>
          </div>
        </div>

        {/* Forecast Days Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3 pt-2">
          {projections.map((p: any, idx: number) => {
            const isToday = idx === 0;
            return (
              <div
                key={p.date || idx}
                className={`p-3 rounded-lg border flex flex-col justify-between space-y-3 ${
                  isToday
                    ? 'bg-brand-blue/10 border-brand-blue/30'
                    : 'bg-navy-900 border-navy-700/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-semibold text-tsecondary">
                      {p.day_name || `Day ${idx + 1}`}
                    </span>
                    {isToday && (
                      <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-brand-blue text-white font-bold">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-tmuted block mt-0.5">
                    {p.date || `T+${idx}`}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-bold font-mono text-tprimary tabular-nums">
                    {formatINR(p.expected_amount || p.amount)}
                  </p>
                  <p className="text-[10px] text-tmuted mt-0.5">
                    {p.batch_count || 1} batch{p.batch_count > 1 ? 'es' : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Treasury Policy Notes */}
      <div className="p-4 rounded-xl bg-navy-900 border border-navy-700/80 flex items-start gap-3">
        <Info className="w-5 h-5 text-brand-blue flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-tsecondary">
          <p className="font-semibold text-tprimary">Treasury Settlement Timing Rule (Policy SET-003):</p>
          <p className="leading-relaxed text-tmuted">
            Razorpay and card acquiring networks enforce a strict $T+2$ business day banking clearance window.
            Weekend captures (Saturday & Sunday) accumulate and clear on Tuesday morning. Inflows are net of merchant discount rates (MDR 1.75%–2.00%) and 18% statutory GST.
          </p>
        </div>
      </div>
    </div>
  );
}
