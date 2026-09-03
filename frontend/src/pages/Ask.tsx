import React, { useState, useRef, useEffect } from 'react';
import { api } from '../api';
import EvidenceDrawer from '../components/EvidenceDrawer';

interface ReferencedRecord {
  id: string;
  case_id?: string;
  type?: string;
  status?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  referenced_records?: ReferencedRecord[];
}

const SUGGESTED_QUERIES = [
  'How much money is currently unresolved?',
  'Which settlement has the largest unexplained delta?',
  'How many high-value cases are unresolved?',
  'Show the largest unresolved settlement',
];

export default function Ask() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Hello. I am Arivo, your AI Finance Controller.\n\nI answer queries grounded strictly on verified database records and financial invariants. Ask about current unresolved exposure, specific transactions, or settlement deltas.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendQuestion = async (questionText: string) => {
    const question = questionText.trim();
    if (!question || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);

    try {
      const data = await api.askArivo(question);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          referenced_records: data.referenced_records || [],
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error communicating with controller: ${err.message ?? 'Unknown error.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuestion(input);
  };

  const openEvidence = (rec: ReferencedRecord) => {
    setSelectedCase({
      case_id: rec.case_id || rec.id,
      payment_id: rec.id.startsWith('PAY') || rec.id.startsWith('pay') ? rec.id : undefined,
      settlement_id: rec.id.startsWith('SET') || rec.id.startsWith('setl') ? rec.id : undefined,
      financial_impact: 0,
      status: rec.status || 'REVIEW',
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>🤖</span> Ask Arivo — Grounded Finance Copilot
          </h2>
          <p className="text-xs text-slate-500">
            Grounded strictly in verified database ledgers. Zero hallucinated figures.
          </p>
        </div>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
          Audit Grounded
        </span>
      </div>

      {/* Suggested Prompts Banner */}
      <div className="p-3 bg-indigo-50/50 border-b border-indigo-100 flex flex-wrap gap-2 items-center text-xs">
        <span className="font-semibold text-indigo-900 text-[11px] uppercase tracking-wider">
          Suggested:
        </span>
        {SUGGESTED_QUERIES.map((q, idx) => (
          <button
            key={idx}
            onClick={() => sendQuestion(q)}
            disabled={loading}
            className="px-2.5 py-1 rounded-full bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-800 font-medium transition-colors shadow-2xs text-[11px] disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-xl p-4 leading-relaxed shadow-2xs ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-slate-100 text-slate-900 rounded-bl-none border border-slate-200'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>

              {/* Actionable Clickable Evidence Chips */}
              {m.referenced_records && m.referenced_records.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Referenced Accounting Records:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {m.referenced_records.map((rec, rIdx) => (
                      <button
                        key={rIdx}
                        onClick={() => openEvidence(rec)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-xs font-semibold shadow-2xs transition-colors"
                      >
                        <span>🔍</span>
                        <span>View Evidence:</span>
                        <span className="font-mono text-indigo-600">{rec.id}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-xl rounded-bl-none p-4 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
              <span className="animate-spin text-indigo-600 font-bold">⚙</span>
              <span>Querying verified financial ledgers and assembling audit response…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            placeholder="Ask about a payment, settlement delta, or current exposure..."
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
          >
            Ask
          </button>
        </form>
      </div>

      {selectedCase && (
        <EvidenceDrawer caseData={selectedCase} onClose={() => setSelectedCase(null)} />
      )}
    </div>
  );
}
