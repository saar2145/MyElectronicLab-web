// Version: 1.0
// Title: Chat Panel | Important Data: full UI matching original site's AI Agent
// chat (bubbles, typing indicator, input). Responses are placeholders until
// Step 2 - TODO: wire to /api/chat route calling OpenAI with tool-calling.

'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';

type Message = { role: 'user' | 'agent'; text: string };

export default function ChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'agent',
      text: 'שלום! אני כאן לעזור לך למצוא את הרכיב המתאים לפרויקט שלך 😊\nהשירות עדיין בפיתוח - בקרוב אוכל לחפש עבורך מוצרים אמיתיים!',
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  function send() {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setTyping(true);

    // TODO Step 2: להחליף בקריאה אמיתית ל-/api/chat (OpenAI + tool calling)
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        { role: 'agent', text: 'שירות הצ׳אט החכם יחובר בשלב הבא בפיתוח (Step 2). תודה על הסבלנות!' },
      ]);
    }, 900);
  }

  return (
    <div className="fixed inset-x-4 bottom-24 z-[65] mx-auto flex h-[70vh] max-h-[500px] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-brand-cardbg shadow-2xl sm:inset-x-auto sm:right-6">
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
            {m.text}
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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
          style={{ background: 'linear-gradient(135deg, var(--header-grad-from), var(--header-grad-to))' }}
        >
          <Icon icon="solar:plain-2-bold" width={16} />
        </button>
      </div>
    </div>
  );
}
