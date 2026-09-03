import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

interface Metrics {
  processed: number;
  matched: number;
  review: number;
  exceptions: number;
  cash_position: {
    expected: number;
    settled: number;
    unexplained: number;
  };
}

function formatINR(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(paise / 100);
}

export default function Overview() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);

  const loadMetrics = () => {
    apiFetch('/api/dashboard')
      .then(setMetrics)
      .catch(e => setError(e.message));
  };

  useEffect(() => { loadMetrics(); }, []);

  const handleRun = async () => {
    setRunning(true);
    setRunResult(null);
    try {
      const result = await apiFetch('/api/reconciliation/run', { method: 'POST' });
      setRunResult(`✓ Processed ${result.cases_processed} cases, saved ${result.cases_saved} new.`);
      loadMetrics();
    } catch (e: any) {
      setRunResult(`✗ Error: ${e.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-border shadow-sm">
          <p className="text-sm font-medium text-muted">Processed</p>
          <p className="text-3xl font-bold mt-2">{metrics?.processed ?? '—'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border shadow-sm border-l-4 border-l-success">
          <p className="text-sm font-medium text-muted">Matched</p>
          <p className="text-3xl font-bold mt-2 text-green-600">{metrics?.matched ?? '—'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border shadow-sm border-l-4 border-l-orange-400">
          <p className="text-sm font-medium text-muted">Review</p>
          <p className="text-3xl font-bold mt-2 text-orange-500">{metrics?.review ?? '—'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-border shadow-sm border-l-4 border-l-red-500">
          <p className="text-sm font-medium text-muted">Exceptions</p>
          <p className="text-3xl font-bold mt-2 text-red-600">{metrics?.exceptions ?? '—'}</p>
        </div>
      </div>

      {/* Cash Position — now from real DB data */}
      <div className="bg-white border border-border rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold mb-4">Cash Position</h3>
        <p className="text-sm text-muted mb-4">
          Live reconciliation totals. Financial impact stored in minor currency units (paise).
        </p>
        {metrics?.cash_position ? (
          <div className="flex space-x-12">
            <div>
              <p className="text-xs text-muted">Expected</p>
              <p className="text-xl font-mono">{formatINR(metrics.cash_position.expected)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Settled</p>
              <p className="text-xl font-mono text-green-600">{formatINR(metrics.cash_position.settled)}</p>
            </div>
            <div>
              <p className="text-xs text-muted text-red-500">Unexplained</p>
              <p className="text-xl font-mono text-red-500">{formatINR(metrics.cash_position.unexplained)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted italic">No data yet — run reconciliation below.</p>
        )}
      </div>

      {/* Run reconciliation */}
      <div className="bg-white border border-border rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-bold mb-2">Run Reconciliation</h3>
        <p className="text-sm text-muted mb-4">
          Triggers the deterministic engine + Gemini AI on the current dataset.
        </p>
        <button
          onClick={handleRun}
          disabled={running}
          className="bg-accent text-white px-6 py-2 rounded font-bold text-sm hover:opacity-90 disabled:opacity-50 transition"
        >
          {running ? 'Running…' : 'Run Now'}
        </button>
        {runResult && (
          <p className={`mt-3 text-sm font-mono ${runResult.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
            {runResult}
          </p>
        )}
        {error && <p className="mt-3 text-sm text-red-500">Dashboard error: {error}</p>}
      </div>
    </div>
  );
}
