// Version: 2.0
// Title: Chat Panel | Important Data: wired to real /api/chat route (OpenAI +
// tool calling against Supabase). Maintains conversation history in the
// {role, content} shape expected by the API, mirroring the original site's
// chatHistory array.

'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';

type Message = { role: 'user' | 'assistant'; content: string };

export default function ChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'שלום! אני כאן לעזור לך למצוא את הרכיב המתאים לפרויקט שלך 😊\nשאל אותי על כל מוצר, מפרט טכני, או פרוטוקול תקשורת.',
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || typing) return;

    const userMsg: Message = { role: 'user', content: text };
    const historyForApi = messages.slice(-10); // ללא ההודעה הנוכחית

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: historyForApi }),
      });
      const json = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: json.reply ?? json.error ?? 'מצטער, אירעה שגיאה.' },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'שגיאת רשת. בדוק חיבור ונסה שוב.' },
      ]);
    } finally {
      setTyping(false);
    }
  }

  return (
    <div className="fixed inset-x-4 bottom-24 z-[65] mx-auto flex h-[70vh] max-h-[500px] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-brand-cardbg shadow-2xl sm:inset-x-auto sm:left-6">
      <div
        className="flex items-center justify-between px-4 py-3.5"
        style={{ background: 'linear-gradient(135deg, var(--header-grad-from), var(--header-grad-to))' }}
      >
        <div>
          <div className="flex items-center gap-1.5 text-sm font-bold text-white">
            <Icon icon="mdi:robot-excited" width={18} /> עוזר MyElectronicLab
          </div>
          <div className="text-[11px] text-white/70">שאל על מוצרים, מפרטים, פרוטוקולים...</div>
        </div>
        <button
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'self-end rounded-br-sm bg-brand-name text-brand-text'
                : 'self-start rounded-bl-sm bg-brand-bg text-brand-text'
            }`}
          >
            {m.content}
          </div>
        ))}
        {typing && (
          <div className="flex gap-1 self-start rounded-2xl bg-brand-bg px-4 py-2.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-textsoft [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-textsoft [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-textsoft" />
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-brand-category p-2.5">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="מה אתה מחפש?"
          className="max-h-28 flex-1 resize-none rounded-2xl border border-brand-category bg-brand-bg px-3.5 py-2 text-sm text-brand-text outline-none focus:border-brand-name"
        />
        <button
          onClick={send}
          disabled={typing}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, var(--header-grad-from), var(--header-grad-to))' }}
        >
          <Icon icon="solar:plain-2-bold" width={16} />
        </button>
      </div>
    </div>
  );
}
