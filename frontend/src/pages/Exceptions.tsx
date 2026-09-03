import { useEffect, useState } from 'react';
import EvidenceDrawer from '../components/EvidenceDrawer';
import { apiFetch } from '../api';

interface Case {
  case_id: string;
  payment_id: string;
  settlement_id: string | null;
  status: string;
  match_method: string | null;
  ai_confidence: number | null;
  ai_recommendation: string | null;
  control_result: string;
  financial_impact: number;
}

function formatINR(paise: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(paise / 100);
}

export default function Exceptions() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/reconciliation?limit=200')
      .then((data: Case[]) => {
        setCases(data.filter(c => c.status === 'EXCEPTION'));
        setLoading(false);
      })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden flex relative h-[calc(100vh-12rem)]">
      <div className={`flex-1 overflow-y-auto transition-all ${selectedCase ? 'w-2/3' : 'w-full'}`}>
        {loading && <p className="p-8 text-muted text-sm">Loading exceptions…</p>}
        {error && <p className="p-8 text-red-500 text-sm">Error: {error}</p>}

        {!loading && cases.length === 0 && !error && (
          <div className="p-8 text-center text-muted">
            <p className="font-bold mb-1">No exceptions found.</p>
            <p className="text-sm">Run reconciliation to populate this view.</p>
          </div>
        )}

        {cases.length > 0 && (
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-50 border-b border-border text-muted sticky top-0">
              <tr>
                <th className="p-4 font-semibold">Case ID</th>
                <th className="p-4 font-semibold">Payment ID</th>
                <th className="p-4 font-semibold">Match Method</th>
                <th className="p-4 font-semibold text-right">Financial Impact</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cases.map(c => (
                <tr
                  key={c.case_id}
                  className="hover:bg-red-50 cursor-pointer"
                  onClick={() => setSelectedCase(c)}
                >
                  <td className="p-4 font-mono text-xs text-red-600">{c.case_id}</td>
                  <td className="p-4 font-mono text-xs">{c.payment_id}</td>
                  <td className="p-4 text-xs">{c.match_method || '—'}</td>
                  <td className="p-4 text-right font-mono text-xs">{formatINR(c.financial_impact)}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedCase && (
        <EvidenceDrawer
          caseData={selectedCase}
          onClose={() => setSelectedCase(null)}
        />
      )}
    </div>
  );
}
