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

export default function Reconciliation() {
  const [cases, setCases] = useState<Case[]>([]);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/api/reconciliation?limit=200')
      .then(data => { setCases(data); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden flex relative h-[calc(100vh-12rem)]">
      <div className={`flex-1 overflow-y-auto transition-all ${selectedCase ? 'w-2/3' : 'w-full'}`}>
        {loading && <p className="p-8 text-muted text-sm">Loading cases…</p>}
        {error && <p className="p-8 text-red-500 text-sm">Error: {error}</p>}
        {!loading && !error && cases.length === 0 && (
          <p className="p-8 text-muted text-sm">No cases yet. Run reconciliation from the Overview page.</p>
        )}
        {cases.length > 0 && (
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-gray-50 border-b border-border text-muted sticky top-0">
              <tr>
                <th className="p-4 font-semibold">Case ID</th>
                <th className="p-4 font-semibold">Payment ID</th>
                <th className="p-4 font-semibold">Method</th>
                <th className="p-4 font-semibold text-right">AI Confidence</th>
                <th className="p-4 font-semibold">Control</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cases.map(c => (
                <tr
                  key={c.case_id}
                  className="hover:bg-blue-50 cursor-pointer"
                  onClick={() => setSelectedCase(c)}
                >
                  <td className="p-4 font-mono text-xs">{c.case_id}</td>
                  <td className="p-4 font-mono text-xs">{c.payment_id}</td>
                  <td className="p-4 text-xs">{c.match_method || '—'}</td>
                  <td className="p-4 text-right text-xs">
                    {c.ai_confidence != null ? (c.ai_confidence * 100).toFixed(0) + '%' : '—'}
                  </td>
                  <td className="p-4 text-xs">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      c.control_result === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {c.control_result || '—'}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      c.status === 'MATCHED' ? 'bg-green-100 text-green-800' :
                      c.status === 'REVIEW'  ? 'bg-orange-100 text-orange-800' :
                                               'bg-red-100 text-red-800'
                    }`}>
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
