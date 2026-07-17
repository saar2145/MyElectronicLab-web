// Version: 1.0
// Title: Ticket Modal | Important Data: full form UI matching original site
// (name, subject dropdown, description, contact). Submit currently shows a
// "coming soon" message - TODO Step 2: wire to /api/tickets route + Supabase.

'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';

export default function TicketModal({ onClose }: { onClose: () => void }) {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [fullName, setFullName] = useState('');
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success' | 'info'; msg: string } | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit() {
    if (!subject) {
      setStatus({ type: 'error', msg: 'יש לבחור נושא לפנייה.' });
      return;
    }
    if (!description.trim()) {
      setStatus({ type: 'error', msg: 'יש להזין תיאור / פירוט לפנייה.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);

    // TODO Step 2: להחליף בקריאה אמיתית ל-API route שכותב ל-Supabase
    setTimeout(() => {
      setSubmitting(false);
      setStatus({
        type: 'info',
        msg: 'שירות שליחת הפניות יחובר בקרוב (שלב הבא בפיתוח). בינתיים אפשר לפנות ישירות.',
      });
    }, 600);
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-brand-cardbg p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-center text-lg font-bold text-brand-text">
          <Icon icon="solar:letter-bold" width={22} className="inline" /> פנייה / בעיה / הצעת שיפור
        </h2>

        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block text-xs font-bold text-brand-textsoft">שם מלא</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="הכנס שם..."
              className="w-full rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-name"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-brand-textsoft">נושא</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-name"
            >
              <option value="">בחר נושא...</option>
              <option value="בעיה / תקלה">🔧 בעיה / תקלה</option>
              <option value="הצעת שיפור">💡 הצעת שיפור</option>
              <option value="שאלה">❓ שאלה</option>
              <option value="יצירת קשר">📞 יצירת קשר</option>
              <option value="אחר">📝 אחר</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-brand-textsoft">תיאור / פירוט</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תאר את הבעיה, הרעיון, או הפנייה..."
              rows={4}
              className="w-full resize-none rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-name"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-brand-textsoft">
              פרטי קשר (אופציונלי - טלפון / מייל)
            </label>
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="כדי שנוכל לחזור אליך..."
              className="w-full rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-name"
            />
          </div>

          {status && (
            <p
              className={`text-center text-xs ${
                status.type === 'error'
                  ? 'text-red-500'
                  : status.type === 'success'
                    ? 'text-green-600'
                    : 'text-brand-textsoft'
              }`}
            >
              {status.msg}
            </p>
          )}

          <div className="mt-1 flex gap-2.5">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-brand-category py-2.5 text-sm text-brand-textsoft"
            >
              ביטול
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 rounded-xl bg-brand-name py-2.5 text-sm font-bold text-brand-text disabled:opacity-60"
            >
              {submitting ? 'שולח...' : 'שלח פנייה ✉️'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
