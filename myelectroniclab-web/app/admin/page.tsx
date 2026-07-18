// Version: 1.0
// Title: Admin Page | Important Data: client component - checks auth by attempting
// a GET to /api/admin/tickets (401 → show login form). Session persists via
// httpOnly cookie (not readable/manageable from JS - server decides validity).

'use client';

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';

type Ticket = {
  id: string;
  created_at: string;
  full_name: string | null;
  subject: string | null;
  description: string | null;
  contact: string | null;
  status: 'פתוח' | 'בטיפול' | 'טופל';
  notes: string | null;
};

const STATUS_COLORS: Record<string, string> = {
  פתוח: 'bg-red-100 text-red-800',
  בטיפול: 'bg-amber-100 text-amber-800',
  טופל: 'bg-green-100 text-green-800',
};

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        onSuccess();
      } else {
        const json = await res.json();
        setError(json.error || 'סיסמה שגויה.');
      }
    } catch {
      setError('שגיאת רשת.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4" dir="rtl">
      <div className="w-full max-w-sm rounded-2xl bg-brand-cardbg p-8 text-center shadow-lg">
        <Icon icon="solar:lock-keyhole-bold" width={44} className="mx-auto mb-3 text-brand-link" />
        <h1 className="mb-1 text-lg font-bold text-brand-text">כניסת מנהל</h1>
        <p className="mb-5 text-sm text-brand-textsoft">עמוד ניהול פניות קטלוג הרכיבים</p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="סיסמה..."
          className="mb-3 w-full rounded-xl border border-brand-category bg-brand-bg px-4 py-2.5 text-center text-brand-text outline-none focus:border-brand-name"
          autoFocus
        />

        <button
          onClick={submit}
          disabled={loading}
          className="w-full rounded-xl py-2.5 font-bold text-white disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg, var(--header-grad-from), var(--header-grad-to))' }}
        >
          {loading ? 'מתחבר...' : 'כניסה ←'}
        </button>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}

function TicketsTable() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/tickets');
    if (res.ok) {
      const json = await res.json();
      setTickets(json.tickets ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- טעינת נתונים סטנדרטית ב-mount (fetch async, לא לולאת רינדור)
    load();
  }, []);

  async function save(ticket: Ticket, status: string, notes: string) {
    setSavingId(ticket.id);
    await fetch('/api/admin/tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ticket.id, status, notes }),
    });
    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, status: status as Ticket['status'], notes } : t))
    );
    setTimeout(() => setSavingId(null), 800);
  }

  return (
    <div className="min-h-screen bg-brand-bg p-5" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-lg font-bold text-brand-text">
            <Icon icon="solar:ticket-bold" width={22} /> ניהול פניות
          </h1>
          <button
            onClick={load}
            className="flex items-center gap-1 rounded-full bg-brand-cardbg px-4 py-2 text-sm font-bold text-brand-text shadow-sm"
          >
            <Icon icon="solar:restart-bold" width={14} /> רענון
          </button>
        </div>

        {loading ? (
          <p className="text-center text-brand-textsoft">טוען...</p>
        ) : tickets.length === 0 ? (
          <p className="py-16 text-center text-brand-textsoft">אין פניות עדיין 📭</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl bg-brand-cardbg shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-category text-right text-brand-textsoft">
                  <th className="px-3 py-3">תאריך</th>
                  <th className="px-3 py-3">שם מלא</th>
                  <th className="px-3 py-3">נושא</th>
                  <th className="px-3 py-3">תיאור</th>
                  <th className="px-3 py-3">פרטי קשר</th>
                  <th className="px-3 py-3">סטטוס</th>
                  <th className="px-3 py-3">הערות</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((t) => (
                  <TicketRow key={t.id} ticket={t} onSave={save} saving={savingId === t.id} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function TicketRow({
  ticket,
  onSave,
  saving,
}: {
  ticket: Ticket;
  onSave: (t: Ticket, status: string, notes: string) => void;
  saving: boolean;
}) {
  const [status, setStatus] = useState(ticket.status);
  const [notes, setNotes] = useState(ticket.notes ?? '');

  return (
    <tr className="border-b border-brand-category/50 text-brand-text">
      <td className="px-3 py-3 whitespace-nowrap text-xs">
        {new Date(ticket.created_at).toLocaleString('he-IL')}
      </td>
      <td className="px-3 py-3">{ticket.full_name || '—'}</td>
      <td className="px-3 py-3">{ticket.subject}</td>
      <td className="max-w-[220px] px-3 py-3 text-xs text-brand-textsoft">{ticket.description}</td>
      <td className="px-3 py-3 text-xs">{ticket.contact || '—'}</td>
      <td className="px-3 py-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as Ticket['status'])}
          className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_COLORS[status]}`}
        >
          <option value="פתוח">פתוח</option>
          <option value="בטיפול">בטיפול</option>
          <option value="טופל">טופל</option>
        </select>
      </td>
      <td className="px-3 py-3">
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-32 rounded-lg border border-brand-category bg-brand-bg px-2 py-1 text-xs text-brand-text outline-none"
        />
      </td>
      <td className="px-3 py-3">
        <button
          onClick={() => onSave(ticket, status, notes)}
          className="rounded-lg bg-brand-name px-3 py-1.5 text-xs font-bold text-brand-text"
        >
          {saving ? '✓' : 'שמור'}
        </button>
      </td>
    </tr>
  );
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/admin/tickets')
      .then((res) => setAuthed(res.ok))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) return null;
  if (!authed) return <LoginForm onSuccess={() => setAuthed(true)} />;
  return <TicketsTable />;
}
