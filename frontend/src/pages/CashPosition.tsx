import React, { useEffect, useState } from 'react';
import { api, formatINR, formatDate, formatPercent } from '../api';
import {
  TrendingUp,
  Landmark,
  Clock,
  ShieldAlert,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Info,
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import StatusBadge from '../components/StatusBadge';

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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-content-primary tracking-tight">
            Cash Position & Liquidity Controller
          </h2>
          <p className="text-xs text-content-muted mt-0.5 font-mono">
            Real-time treasury visibility: Confirmed Bank Cash, T+2 Gateway Pipeline, and 7-Day Inflow Modeling.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-content-secondary hover:text-content-primary shadow-subtle transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-brand' : ''}`} />
          <span>Refresh Treasury</span>
        </button>
      </div>

      {/* Primary Liquidity Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Confirmed Bank Cash"
          value={formatINR(cf)}
          subValue="Cleared via Bank UTR verification"
          accent="mint"
          icon={<Landmark className="w-4 h-4 text-status-mint" />}
        />

        <MetricCard
          label="In-Flight Pipeline (T+2)"
          value={formatINR(es)}
          subValue="Captured by gateway, clearing in 24–48h"
          accent="blue"
          icon={<Clock className="w-4 h-4 text-brand" />}
        />

        <MetricCard
          label="Risk Buffer Deducted"
          value={`- ${formatINR(riskBuffer)}`}
          subValue="Withheld pending exception resolution"
          accent="amber"
          icon={<ShieldAlert className="w-4 h-4 text-status-amber" />}
        />

        <MetricCard
          label="Net Operable Liquidity"
          value={formatINR(netLiquidity)}
          subValue="Bank Cash + Gateway − Risk Buffer"
          accent="neutral"
          icon={<TrendingUp className="w-4 h-4 text-brand" />}
        />
      </div>

      {/* 7-Day Inflow Forecasting Projection */}
      <div className="p-5 rounded-lg bg-surface border border-border shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-sm font-bold text-content-primary">
              7-Day Projected Settlement Clearance Curve
            </h3>
            <p className="text-xs text-content-muted">
              Forecasted net cash arrivals modeled across banking business days and settlement cutoffs.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-content-muted block">
              7-Day Total Inflow
            </span>
            <span className="font-mono font-bold text-base text-content-primary tabular-nums">
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
                className={`p-3.5 rounded-lg border flex flex-col justify-between space-y-3 transition-colors ${
                  isToday
                    ? 'bg-brand/10 border-brand/40 shadow-subtle'
                    : 'bg-surface-elevated border-border'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold text-content-primary">
                      {p.day_name || `Day ${idx + 1}`}
                    </span>
                    {isToday && (
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-brand text-white font-bold">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-content-muted block mt-0.5">
                    {p.date || `T+${idx}`}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-bold font-mono text-content-primary tabular-nums">
                    {formatINR(p.expected_amount || p.amount)}
                  </p>
                  <p className="text-[10px] font-mono text-content-muted mt-0.5">
                    {p.batch_count || 1} batch{p.batch_count > 1 ? 'es' : ''}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Treasury Policy Notes */}
      <div className="p-4 rounded-lg bg-surface border border-border shadow-card flex items-start gap-3">
        <Info className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs">
          <p className="font-semibold text-content-primary font-mono">
            Treasury Settlement Timing Rule (Policy SET-003):
          </p>
          <p className="leading-relaxed text-content-muted">
            Razorpay and card acquiring networks enforce a strict T+2 business day banking clearance window.
            Weekend captures (Saturday & Sunday) accumulate and clear on Tuesday morning. Inflows are net of merchant discount rates (MDR 1.75%–2.00%) and 18% statutory GST.
          </p>
        </div>
      </div>
    </div>
  );
}
