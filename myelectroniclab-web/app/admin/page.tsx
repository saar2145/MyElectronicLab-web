// Version: 2.1
// Title: Admin Dashboard | Change from v2.0: added a "בדיקת אפיליאט" section -
// checks every product's link for two failure modes (broken link, or resolves
// fine but lost the affiliate tracking) plus, via the AliExpress Affiliate
// API, the live commission rate - see lib/aliexpress-affiliate.ts and
// app/api/admin/affiliate-check/route.ts for the full mechanism. Important
// Data: client component - checks auth by attempting a GET to
// /api/admin/tickets (401 → show login form). Session persists via httpOnly
// cookie. "הוספת מוצרים" requires picking an EXISTING category - see the long
// comment in app/api/admin/products/route.ts for why (the catalog's grouping
// is order-based, not a relational category_id).

'use client';

import { Fragment, useEffect, useState } from 'react';
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

type PendingMentor = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  college: string;
  created_at: string;
};

type AdminUser = {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  role: 'student' | 'mentor';
  college: string;
  mentor_approved: boolean;
  created_at: string;
};

type CategoryOption = { sheet_row: number; title: string | null };
type AdminProduct = {
  id: number;
  name: string | null;
  model: string | null;
  price: number | null;
  image_url: string | null;
  link: string | null;
  category_title: string | null;
};

type OverviewStats = { openTickets: number; pendingMentors: number; totalUsers: number; totalProducts: number };
type Tab = 'overview' | 'tickets' | 'mentors' | 'users' | 'add-product' | 'affiliate-check';

const STATUS_COLORS: Record<string, string> = {
  פתוח: 'bg-red-100 text-red-800',
  בטיפול: 'bg-amber-100 text-amber-800',
  טופל: 'bg-green-100 text-green-800',
};

const cardClass = 'rounded-2xl bg-brand-cardbg p-5 shadow-sm';
const sectionTitleClass = 'mb-5 flex items-center gap-2 text-lg font-bold text-brand-text';

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
        <p className="mb-5 text-sm text-brand-textsoft">לוח בקרה - MyElectronicLab</p>

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

function StatCard({ icon, label, value, onClick }: { icon: string; label: string; value: number; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`${cardClass} flex items-center gap-4 text-right transition hover:brightness-95`}>
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-picture">
        <Icon icon={icon} width={24} className="text-brand-text" />
      </div>
      <div>
        <div className="text-2xl font-bold text-brand-text">{value}</div>
        <div className="text-xs text-brand-textsoft">{label}</div>
      </div>
    </button>
  );
}

function OverviewSection({ setTab }: { setTab: (t: Tab) => void }) {
  const [stats, setStats] = useState<OverviewStats | null>(null);

  useEffect(() => {
    fetch('/api/admin/overview')
      .then((r) => r.json())
      .then(setStats);
  }, []);

  return (
    <div>
      <h1 className={sectionTitleClass}>
        <Icon icon="solar:widget-5-bold" width={22} /> סקירה כללית
      </h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon="solar:ticket-bold" label="פניות פתוחות" value={stats?.openTickets ?? 0} onClick={() => setTab('tickets')} />
        <StatCard icon="solar:user-check-rounded-bold" label="מנחים ממתינים" value={stats?.pendingMentors ?? 0} onClick={() => setTab('mentors')} />
        <StatCard icon="solar:users-group-rounded-bold" label='סה"כ משתמשים' value={stats?.totalUsers ?? 0} onClick={() => setTab('users')} />
        <StatCard icon="solar:box-bold" label='סה"כ מוצרים' value={stats?.totalProducts ?? 0} onClick={() => setTab('add-product')} />
      </div>
    </div>
  );
}

function TicketsSection() {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- טעינת נתונים סטנדרטית ב-mount
    load();
  }, []);

  async function save(ticket: Ticket, status: string, notes: string) {
    setSavingId(ticket.id);
    await fetch('/api/admin/tickets', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ticket.id, status, notes }),
    });
    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, status: status as Ticket['status'], notes } : t)));
    setTimeout(() => setSavingId(null), 800);
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className={sectionTitleClass}>
          <Icon icon="solar:ticket-bold" width={22} /> ניהול פניות
        </h1>
        <button onClick={load} className="flex items-center gap-1 rounded-full bg-brand-cardbg px-4 py-2 text-sm font-bold text-brand-text shadow-sm">
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
  );
}

function TicketRow({ ticket, onSave, saving }: { ticket: Ticket; onSave: (t: Ticket, status: string, notes: string) => void; saving: boolean }) {
  const [status, setStatus] = useState(ticket.status);
  const [notes, setNotes] = useState(ticket.notes ?? '');

  return (
    <tr className="border-b border-brand-category/50 text-brand-text">
      <td className="px-3 py-3 whitespace-nowrap text-xs">{new Date(ticket.created_at).toLocaleString('he-IL')}</td>
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
        <button onClick={() => onSave(ticket, status, notes)} className="rounded-lg bg-brand-name px-3 py-1.5 text-xs font-bold text-brand-text">
          {saving ? '✓' : 'שמור'}
        </button>
      </td>
    </tr>
  );
}

function MentorsSection() {
  const [mentors, setMentors] = useState<PendingMentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/mentors');
    if (res.ok) {
      const json = await res.json();
      setMentors(json.mentors ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- טעינת נתונים סטנדרטית ב-mount
    load();
  }, []);

  async function act(id: string, action: 'approve' | 'reject') {
    if (action === 'reject' && !confirm('לדחות ולמחוק את בקשת ההרשמה של המנחה הזה?')) return;
    setBusyId(id);
    const res = await fetch('/api/admin/mentors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    if (res.ok) setMentors((prev) => prev.filter((m) => m.id !== id));
    setBusyId(null);
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className={sectionTitleClass}>
          <Icon icon="solar:user-check-rounded-bold" width={22} /> אישור מנחים
        </h1>
        <button onClick={load} className="flex items-center gap-1 rounded-full bg-brand-cardbg px-4 py-2 text-sm font-bold text-brand-text shadow-sm">
          <Icon icon="solar:restart-bold" width={14} /> רענון
        </button>
      </div>

      {loading ? (
        <p className="text-center text-brand-textsoft">טוען...</p>
      ) : mentors.length === 0 ? (
        <p className="py-16 text-center text-brand-textsoft">אין מנחים הממתינים לאישור 🎉</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-brand-cardbg shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-category text-right text-brand-textsoft">
                <th className="px-3 py-3">נרשם בתאריך</th>
                <th className="px-3 py-3">שם מלא</th>
                <th className="px-3 py-3">מייל</th>
                <th className="px-3 py-3">טלפון</th>
                <th className="px-3 py-3">מכללה</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {mentors.map((m) => (
                <tr key={m.id} className="border-b border-brand-category/50 text-brand-text">
                  <td className="px-3 py-3 whitespace-nowrap text-xs">{new Date(m.created_at).toLocaleString('he-IL')}</td>
                  <td className="px-3 py-3">{m.full_name}</td>
                  <td className="px-3 py-3 text-xs">{m.email}</td>
                  <td className="px-3 py-3 text-xs">{m.phone}</td>
                  <td className="px-3 py-3">{m.college}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => act(m.id, 'approve')} disabled={busyId === m.id} className="rounded-lg bg-green-500/15 px-3 py-1.5 text-xs font-bold text-green-700 disabled:opacity-50">
                        אשר
                      </button>
                      <button onClick={() => act(m.id, 'reject')} disabled={busyId === m.id} className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-600 disabled:opacity-50">
                        דחה
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UsersSection() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/users');
    if (res.ok) {
      const json = await res.json();
      setUsers(json.users ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- טעינת נתונים סטנדרטית ב-mount
    load();
  }, []);

  async function remove(id: string) {
    if (!confirm('למחוק את החשבון הזה לצמיתות?')) return;
    setBusyId(id);
    const res = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id));
    setBusyId(null);
  }

  const filtered = users.filter((u) => `${u.full_name} ${u.email} ${u.college}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className={sectionTitleClass}>
          <Icon icon="solar:users-group-rounded-bold" width={22} /> משתמשים
        </h1>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש לפי שם / מייל / מכללה..."
            className="w-56 rounded-full border border-brand-category bg-brand-cardbg px-4 py-2 text-sm text-brand-text outline-none"
          />
          <button onClick={load} className="flex items-center gap-1 rounded-full bg-brand-cardbg px-4 py-2 text-sm font-bold text-brand-text shadow-sm">
            <Icon icon="solar:restart-bold" width={14} /> רענון
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-brand-textsoft">טוען...</p>
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-brand-textsoft">לא נמצאו משתמשים</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-brand-cardbg shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-category text-right text-brand-textsoft">
                <th className="px-3 py-3">שם מלא</th>
                <th className="px-3 py-3">מייל</th>
                <th className="px-3 py-3">טלפון</th>
                <th className="px-3 py-3">סוג</th>
                <th className="px-3 py-3">מכללה</th>
                <th className="px-3 py-3">סטטוס</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-brand-category/50 text-brand-text">
                  <td className="px-3 py-3">{u.full_name}</td>
                  <td className="px-3 py-3 text-xs">{u.email}</td>
                  <td className="px-3 py-3 text-xs">{u.phone}</td>
                  <td className="px-3 py-3">
                    <span className="rounded-full bg-brand-picture px-2.5 py-1 text-xs font-bold">{u.role === 'mentor' ? 'מנחה' : 'סטודנט'}</span>
                  </td>
                  <td className="px-3 py-3">{u.college}</td>
                  <td className="px-3 py-3">
                    {u.role === 'mentor' && (
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${u.mentor_approved ? 'bg-green-500/15 text-green-700' : 'bg-amber-500/15 text-amber-700'}`}>
                        {u.mentor_approved ? 'מאושר' : 'ממתין'}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => remove(u.id)} disabled={busyId === u.id} className="rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-600 disabled:opacity-50">
                      מחק
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AddProductSection() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ categorySheetRow: '', name: '', model: '', price: '', description: '', link: '', image_url: '' });
  const [status, setStatus] = useState<{ type: 'error' | 'success'; msg: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/products');
    if (res.ok) {
      const json = await res.json();
      setCategories(json.categories ?? []);
      setProducts(json.products ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- טעינת נתונים סטנדרטית ב-mount
    load();
  }, []);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.categorySheetRow || !form.name) {
      setStatus({ type: 'error', msg: 'יש לבחור קטגוריה ולמלא שם מוצר.' });
      return;
    }
    setSubmitting(true);
    setStatus(null);

    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, categorySheetRow: Number(form.categorySheetRow) }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const json = await res.json();
      setStatus({ type: 'error', msg: json.error || 'שגיאה בהוספה.' });
      return;
    }

    setStatus({ type: 'success', msg: 'המוצר נוסף בהצלחה!' });
    setForm({ categorySheetRow: form.categorySheetRow, name: '', model: '', price: '', description: '', link: '', image_url: '' });
    load();
  }

  async function remove(id: number) {
    if (!confirm('למחוק את המוצר הזה?')) return;
    setBusyId(id);
    const res = await fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setProducts((prev) => prev.filter((p) => p.id !== id));
    setBusyId(null);
  }

  const inputClass = 'w-full rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-name';
  const labelClass = 'mb-1 block text-xs font-bold text-brand-textsoft';

  return (
    <div>
      <h1 className={sectionTitleClass}>
        <Icon icon="solar:box-bold" width={22} /> הוספת מוצרים
      </h1>

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <div className={cardClass}>
          <h2 className="mb-4 text-sm font-bold text-brand-text">מוצר חדש</h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className={labelClass}>קטגוריה</label>
              <select value={form.categorySheetRow} onChange={(e) => update('categorySheetRow', e.target.value)} className={inputClass}>
                <option value="">בחר קטגוריה...</option>
                {categories.map((c) => (
                  <option key={c.sheet_row} value={c.sheet_row}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>שם המוצר</label>
              <input value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>דגם</label>
              <input value={form.model} onChange={(e) => update('model', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>מחיר</label>
              <input type="number" value={form.price} onChange={(e) => update('price', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>תיאור</label>
              <textarea value={form.description} onChange={(e) => update('description', e.target.value)} className={`${inputClass} min-h-20`} />
            </div>
            <div>
              <label className={labelClass}>קישור (AliExpress וכו&apos;)</label>
              <input value={form.link} onChange={(e) => update('link', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>
                קישור תמונה
                <span className="mr-1 font-normal text-brand-textsoft">(URL ישיר - אין עדיין אוטומציית העלאה ל-Cloudinary)</span>
              </label>
              <input value={form.image_url} onChange={(e) => update('image_url', e.target.value)} className={inputClass} />
            </div>

            {status && <p className={`text-center text-xs ${status.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>{status.msg}</p>}

            <button onClick={handleSubmit} disabled={submitting} className="mt-1 w-full rounded-xl bg-brand-name py-2.5 text-sm font-bold text-brand-text disabled:opacity-60">
              {submitting ? 'מוסיף...' : 'הוסף מוצר'}
            </button>
          </div>
        </div>

        <div className={cardClass}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-brand-text">מוצרים קיימים</h2>
            <button onClick={load} className="flex items-center gap-1 rounded-full bg-brand-bg px-3 py-1.5 text-xs font-bold text-brand-text">
              <Icon icon="solar:restart-bold" width={12} /> רענון
            </button>
          </div>
          {loading ? (
            <p className="text-center text-brand-textsoft">טוען...</p>
          ) : (
            <div className="max-h-[520px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-category text-right text-brand-textsoft">
                    <th className="px-2 py-2">שם</th>
                    <th className="px-2 py-2">קטגוריה</th>
                    <th className="px-2 py-2">מחיר</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b border-brand-category/50 text-brand-text">
                      <td className="px-2 py-2">{p.name}</td>
                      <td className="px-2 py-2 text-xs text-brand-textsoft">{p.category_title ?? '—'}</td>
                      <td className="px-2 py-2 text-xs">{p.price ?? '—'}</td>
                      <td className="px-2 py-2">
                        <button onClick={() => remove(p.id)} disabled={busyId === p.id} className="rounded-lg bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-600 disabled:opacity-50">
                          מחק
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const STATUS_META: Record<string, { label: string; color: string; icon: string }> = {
  ok: { label: 'תקין', color: 'bg-green-500/15 text-green-700', icon: 'solar:check-circle-bold' },
  broken: { label: 'שבור', color: 'bg-red-500/15 text-red-600', icon: 'solar:close-circle-bold' },
  no_affiliate_tag: { label: 'בלי תג אפיליאט', color: 'bg-amber-500/15 text-amber-700', icon: 'solar:danger-triangle-bold' },
  rate_mismatch: { label: 'פער בעמלה', color: 'bg-amber-500/15 text-amber-700', icon: 'solar:danger-triangle-bold' },
  api_error: { label: 'שגיאת API', color: 'bg-brand-category text-brand-textsoft', icon: 'solar:question-circle-bold' },
};

type AffiliateProductRow = {
  id: number;
  name: string | null;
  link: string | null;
  check: { status: string; checked_at: string; commission_rate: number | null; http_status: number | null; details: string | null } | null;
};

function AffiliateCheckSection() {
  const [rows, setRows] = useState<AffiliateProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/affiliate-check');
    if (res.ok) {
      const json = await res.json();
      setRows(json.products ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- טעינת נתונים סטנדרטית ב-mount
    load();
  }, []);

  async function runAll() {
    setRunning(true);
    await fetch('/api/admin/affiliate-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    setRunning(false);
    load();
  }

  async function runOne(productId: number) {
    setRunning(true);
    await fetch('/api/admin/affiliate-check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId }) });
    setRunning(false);
    load();
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className={sectionTitleClass}>
          <Icon icon="solar:link-round-angle-bold" width={22} /> בדיקת קישורי אפיליאט
        </h1>
        <button onClick={runAll} disabled={running} className="flex items-center gap-1 rounded-full bg-brand-name px-4 py-2 text-sm font-bold text-brand-text disabled:opacity-60">
          <Icon icon="solar:refresh-bold" width={14} className={running ? 'animate-spin' : ''} />
          {running ? 'בודק...' : 'בדוק הכל'}
        </button>
      </div>

      <p className="mb-4 text-xs text-brand-textsoft">
        שכבה 1 בודקת שהקישור בכלל עובד ועדיין נושא תג אפיליאט. שכבה 2 (רק אם שכבה 1 עברה) שואלת את AliExpress ישירות מה שיעור העמלה בפועל. ריצה מלאה יכולה לקחת זמן על קטלוג גדול.
      </p>

      {loading ? (
        <p className="text-center text-brand-textsoft">טוען...</p>
      ) : rows.length === 0 ? (
        <p className="py-16 text-center text-brand-textsoft">אין מוצרים עם קישור</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-brand-cardbg shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-category text-right text-brand-textsoft">
                <th className="px-3 py-3">מוצר</th>
                <th className="px-3 py-3">סטטוס</th>
                <th className="px-3 py-3">עמלה</th>
                <th className="px-3 py-3">נבדק לאחרונה</th>
                <th className="px-3 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const meta = r.check ? STATUS_META[r.check.status] : null;
                return (
                  <Fragment key={r.id}>
                    <tr className="border-b border-brand-category/50 text-brand-text">
                      <td className="px-3 py-3">{r.name}</td>
                      <td className="px-3 py-3">
                        {meta ? (
                          <span className={`flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${meta.color}`}>
                            <Icon icon={meta.icon} width={12} />
                            {meta.label}
                          </span>
                        ) : (
                          <span className="text-xs text-brand-textsoft">עוד לא נבדק</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs">{r.check?.commission_rate != null ? `${r.check.commission_rate}%` : '—'}</td>
                      <td className="px-3 py-3 text-xs">{r.check ? new Date(r.check.checked_at).toLocaleString('he-IL') : '—'}</td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => runOne(r.id)} disabled={running} className="rounded-lg bg-brand-bg px-2.5 py-1.5 text-xs font-bold text-brand-text disabled:opacity-60">
                            בדוק שוב
                          </button>
                          {r.check?.details && (
                            <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} className="rounded-lg bg-brand-bg px-2.5 py-1.5 text-xs font-bold text-brand-textsoft">
                              פרטים
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === r.id && r.check?.details && (
                      <tr>
                        <td colSpan={5} className="bg-brand-bg px-3 py-3">
                          <pre className="max-h-40 overflow-auto whitespace-pre-wrap text-[10px] text-brand-textsoft">{r.check.details}</pre>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const NAV_ITEMS: { tab: Tab; icon: string; label: string }[] = [
  { tab: 'overview', icon: 'solar:widget-5-bold', label: 'סקירה כללית' },
  { tab: 'tickets', icon: 'solar:ticket-bold', label: 'ניהול פניות' },
  { tab: 'mentors', icon: 'solar:user-check-rounded-bold', label: 'אישור מנחים' },
  { tab: 'users', icon: 'solar:users-group-rounded-bold', label: 'משתמשים' },
  { tab: 'add-product', icon: 'solar:box-bold', label: 'הוספת מוצרים' },
  { tab: 'affiliate-check', icon: 'solar:link-round-angle-bold', label: 'בדיקת אפיליאט' },
];

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    fetch('/api/admin/tickets')
      .then((res) => setAuthed(res.ok))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) return null;
  if (!authed) return <LoginForm onSuccess={() => setAuthed(true)} />;

  return (
    <div className="flex min-h-screen bg-brand-bg" dir="rtl">
      <aside className="flex w-60 shrink-0 flex-col gap-1 border-l border-brand-category bg-brand-cardbg p-4">
        <div className="mb-4 flex items-center gap-2 px-2">
          <Icon icon="solar:shield-user-bold" width={24} className="text-brand-linktext" />
          <span className="text-sm font-bold text-brand-text">לוח בקרה</span>
        </div>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.tab}
            onClick={() => setTab(item.tab)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
              tab === item.tab ? 'bg-brand-name text-brand-text' : 'text-brand-textsoft hover:bg-brand-bg'
            }`}
          >
            <Icon icon={item.icon} width={18} />
            {item.label}
          </button>
        ))}
      </aside>

      <main className="flex-1 p-6">
        {tab === 'overview' && <OverviewSection setTab={setTab} />}
        {tab === 'tickets' && <TicketsSection />}
        {tab === 'mentors' && <MentorsSection />}
        {tab === 'users' && <UsersSection />}
        {tab === 'add-product' && <AddProductSection />}
        {tab === 'affiliate-check' && <AffiliateCheckSection />}
      </main>
    </div>
  );
}
