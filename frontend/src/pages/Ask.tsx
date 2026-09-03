import { useState, useRef, useEffect } from 'react';
import { apiFetch } from '../api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Ask() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello. I am Arivo. How can I help you investigate today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);

    try {
      const data = await apiFetch('/api/ask', {
        method: 'POST',
        body: JSON.stringify({ question }),
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message ?? 'Could not connect to Arivo.'}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-3xl mx-auto bg-white border border-border rounded-lg shadow-sm">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-4 ${
              m.role === 'user' ? 'bg-accent text-white' : 'bg-gray-100 text-foreground'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-sm text-muted italic">Arivo is thinking…</p>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="p-4 border-t border-border">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 border border-border rounded px-4 py-2 text-sm focus:outline-none focus:border-accent"
            placeholder="Ask about a case, policy, or anomaly…"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-accent text-white px-6 py-2 rounded text-sm font-bold hover:opacity-90 disabled:opacity-50 transition"
          >
            Ask
          </button>
        </form>
      </div>
    </div>
  );
}
