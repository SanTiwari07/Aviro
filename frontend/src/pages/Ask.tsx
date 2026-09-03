import React, { useState, useRef, useEffect } from 'react';
import { api, AskResponse, PolicyExcerpt } from '../api';
import {
  Terminal,
  Send,
  Loader2,
  BookOpen,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AskProps {
  onOpenCase: (caseId: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  records?: Array<any>;
  policies?: PolicyExcerpt[];
  classification?: string;
  recommended_actions?: string[];
  grounded?: boolean;
}

const SUGGESTED_QUERIES = [
  'How much money is currently unresolved and what are the largest items?',
  'Why are unexplained deltas in settlement waterfalls routed to exception?',
  'What is our policy on high-value transactions above ₹50,000?',
  'Inspect payment PAY_FLAGSHIP_001 and explain the Control Gate verdict.',
];

export default function Ask({ onOpenCase }: AskProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'ARIVO GROUNDED AI FINANCE COPILOT\n\n' +
        'I answer financial control queries grounded strictly on verified database records and our 6 indexed policy documents.\n\n' +
        'Select a prompt below or type any financial investigation question:',
      recommended_actions: [
        'Query unresolved exposure',
        'Audit settlement waterfall deltas',
        'Verify high-value invariants',
      ],
      grounded: true,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedPolicies, setExpandedPolicies] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const togglePolicyExpand = (msgId: string) => {
    setExpandedPolicies(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleSend = async (textToSend: string) => {
    const q = textToSend.trim();
    if (!q || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const botMsgId = `bot-${Date.now()}`;

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, role: 'user', content: q },
    ]);
    setInput('');
    setLoading(true);

    try {
      const res: AskResponse = await api.askArivo(q);
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          role: 'assistant',
          content: res.answer,
          records: res.records || [],
          policies: res.policies || [],
          classification: res.classification,
          recommended_actions: res.recommended_actions || [],
          grounded: res.grounded,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: botMsgId,
          role: 'assistant',
          content: `Controller Error: ${err.message || 'Unable to retrieve grounded answer.'}`,
          grounded: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-navy-700/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-blue/15 text-brand-blue border border-brand-blue/30">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-tprimary tracking-tight">Ask Arivo — Grounded AI Copilot</h2>
            <p className="text-xs text-tmuted font-mono">
              Strictly grounded on verified SQLite records + RAG Policy Knowledge Base. No raw hallucinations.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-status-matched">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>RAG Policies Indexed (6/6)</span>
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_QUERIES.map((q, idx) => (
          <button
            key={idx}
            disabled={loading}
            onClick={() => handleSend(q)}
            className="text-xs font-mono px-3 py-1.5 rounded-lg bg-navy-850 hover:bg-navy-800 border border-navy-700 text-tsecondary hover:text-tprimary transition-colors text-left disabled:opacity-50"
          >
            "{q}"
          </button>
        ))}
      </div>

      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 rounded-xl bg-navy-900 border border-navy-700/80 shadow-card">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          const hasPolicies = m.policies && m.policies.length > 0;
          const isExpanded = !!expandedPolicies[m.id];

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-3xl rounded-xl p-4 space-y-3 ${
                  isUser
                    ? 'bg-brand-blue text-white shadow-card font-mono text-xs'
                    : 'bg-navy-850 border border-navy-700/80 text-tprimary shadow-card w-full'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between pb-2 border-b border-navy-700/60 text-[11px] font-mono text-tmuted">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-brand-blue" />
                      <span className="text-tsecondary font-semibold">ARIVO CONTROLLER AI</span>
                    </div>
                    {m.grounded && (
                      <span className="text-status-matched flex items-center gap-1 font-semibold">
                        <ShieldCheck className="w-3 h-3" /> Grounded Proof
                      </span>
                    )}
                  </div>
                )}

                {/* Main Markdown / Text Content */}
                <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {m.content}
                </div>

                {/* Referenced Database Records */}
                {m.records && m.records.length > 0 && (
                  <div className="pt-2 border-t border-navy-700/60 space-y-2">
                    <span className="text-[11px] font-mono uppercase text-tmuted block">
                      Referenced Financial Records:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {m.records.map((r, i) => {
                        const recId = r.id || r.case_id || r.payment_id || r.settlement_id;
                        return (
                          <div
                            key={i}
                            onClick={() => recId && onOpenCase(recId)}
                            className="p-2.5 rounded-lg bg-navy-900 border border-navy-700 hover:border-brand-blue/50 cursor-pointer transition-colors flex items-center justify-between text-xs font-mono group"
                          >
                            <div>
                              <span className="text-brand-blue font-bold group-hover:underline">{recId}</span>
                              <div className="text-[11px] text-tmuted">
                                {r.amount_formatted || r.gross_formatted || r.impact_formatted || '—'} • {r.status || r.control_result || ''}
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-tmuted group-hover:text-brand-blue" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Retrieved Policy Excerpts */}
                {hasPolicies && (
                  <div className="pt-2 border-t border-navy-700/60">
                    <button
                      onClick={() => togglePolicyExpand(m.id)}
                      className="flex items-center justify-between w-full text-xs font-mono text-brand-blue hover:underline py-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Retrieved Policy Rules ({m.policies!.length} Excerpts)</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="space-y-2 mt-2 pt-2 border-t border-navy-700/40">
                        {m.policies!.map((p, idx) => (
                          <div key={idx} className="p-2.5 rounded bg-navy-900 border border-navy-700/80 text-xs font-mono space-y-1">
                            <div className="flex items-center justify-between text-[11px] text-tmuted">
                              <span className="font-bold text-tsecondary">{p.name} (v{p.version})</span>
                              <span>§ {p.section}</span>
                            </div>
                            <p className="text-tmuted text-[11px] italic leading-relaxed">
                              "{p.excerpt}"
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Recommended Controller Actions */}
                {m.recommended_actions && m.recommended_actions.length > 0 && (
                  <div className="pt-2 border-t border-navy-700/60 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono uppercase text-tmuted">Recommended Action:</span>
                    {m.recommended_actions.map((act, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-navy-900 text-brand-blue border border-brand-blue/30"
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 p-4 text-xs font-mono text-tmuted bg-navy-850 rounded-xl border border-navy-700 w-fit">
            <Loader2 className="w-4 h-4 animate-spin text-brand-blue" />
            <span>Consulting verified database & policy index...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about exposure, discrepancies, or policy rules..."
          disabled={loading}
          className="w-full bg-navy-850 border border-navy-700 rounded-xl pl-4 pr-12 py-3 text-xs sm:text-sm text-tprimary placeholder-tmuted focus:outline-none focus:border-brand-blue font-sans shadow-card disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="absolute right-2.5 p-2 rounded-lg bg-brand-blue hover:bg-brand-hover text-white transition-colors disabled:opacity-30"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
