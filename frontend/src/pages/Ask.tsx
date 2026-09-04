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
  Sparkles,
} from 'lucide-react';
import { motion } from 'motion/react';
import StatusBadge from '../components/StatusBadge';

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
        'ARIVO INVESTIGATION COPILOT\n\n' +
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
    setExpandedPolicies((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
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
    <div className="flex flex-col h-[calc(100vh-6rem)] space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#8B7CFF]/15 text-[#7462F5] dark:text-[#A79CFF] border border-[#8B7CFF]/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-content-primary tracking-tight">
                Ask Arivo - Grounded Investigation Copilot
              </h2>
            </div>
            <p className="text-xs text-content-muted font-mono mt-0.5">
              Strictly grounded on verified SQLite records + RAG Policy Knowledge Base. No raw hallucinations.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-status-mint">
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
            className="text-xs font-mono px-3 py-1.5 rounded-md bg-surface hover:bg-surface-elevated border border-border text-content-secondary hover:text-content-primary transition-colors text-left disabled:opacity-50 shadow-subtle"
          >
            "{q}"
          </button>
        ))}
      </div>

      {/* Conversation Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 rounded-lg bg-surface border border-border shadow-card">
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
                className={`max-w-3xl rounded-lg p-4 space-y-3 ${
                  isUser
                    ? 'bg-brand text-white shadow-card font-mono text-xs'
                    : 'bg-surface-elevated border border-border text-content-primary shadow-subtle w-full'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center justify-between pb-2 border-b border-border text-[11px] font-mono text-content-muted">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-[#8B7CFF]" />
                      <span className="text-content-primary font-semibold">
                        ARIVO INVESTIGATION COPILOT
                      </span>
                    </div>
                    {m.grounded && (
                      <span className="text-status-mint flex items-center gap-1 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Grounded Proof
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
                  <div className="pt-2 border-t border-border space-y-2">
                    <span className="text-[11px] font-mono uppercase text-content-muted block font-semibold">
                      Referenced Financial Records:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {m.records.map((r, i) => {
                        const recId = r.id || r.case_id || r.payment_id || r.settlement_id;
                        return (
                          <div
                            key={i}
                            onClick={() => recId && onOpenCase(recId)}
                            className="p-2.5 rounded-md bg-surface border border-border hover:border-brand cursor-pointer transition-colors flex items-center justify-between text-xs font-mono group shadow-subtle"
                          >
                            <div>
                              <span className="text-brand font-bold group-hover:underline">{recId}</span>
                              <div className="text-[11px] text-content-muted">
                                {r.amount_formatted || r.gross_formatted || r.impact_formatted || '-'} • {r.status || r.control_result || ''}
                              </div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-content-muted group-hover:text-brand" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Retrieved Policy Excerpts */}
                {hasPolicies && (
                  <div className="pt-2 border-t border-border">
                    <button
                      onClick={() => togglePolicyExpand(m.id)}
                      className="flex items-center justify-between w-full text-xs font-mono text-brand hover:underline py-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Retrieved Policy Rules ({m.policies!.length} Excerpts)</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="space-y-2 mt-2 pt-2 border-t border-border">
                        {m.policies!.map((p, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-md bg-surface border border-border text-xs font-mono space-y-1 shadow-subtle"
                          >
                            <div className="flex items-center justify-between text-[11px] text-content-muted">
                              <span className="font-bold text-content-primary">{p.name} (v{p.version})</span>
                              <span>§ {p.section}</span>
                            </div>
                            <p className="text-content-secondary text-[11px] italic leading-relaxed">
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
                  <div className="pt-2 border-t border-border flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono uppercase text-content-muted font-semibold">
                      Recommended Action:
                    </span>
                    {m.recommended_actions.map((act, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] font-mono px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/25 font-semibold"
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
          <div className="flex items-center gap-2 p-3 text-xs font-mono text-content-muted bg-surface rounded-lg border border-border w-fit shadow-subtle">
            <Loader2 className="w-4 h-4 animate-spin text-brand" />
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
          className="w-full bg-surface border border-border rounded-lg pl-4 pr-12 py-3 text-xs sm:text-sm text-content-primary placeholder-content-muted focus:outline-none focus:border-brand font-sans shadow-card disabled:opacity-50 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="absolute right-2.5 p-2 rounded-md bg-brand hover:bg-brand-hover text-white transition-colors disabled:opacity-30 shadow-subtle"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
