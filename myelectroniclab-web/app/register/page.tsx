// Version: 1.0
// Title: Registration Page | Important Data: self-managed email/password auth only
// (no Google SSO). Collects all required fields per spec (name, phone, email,
// gender, role, college) and passes them as auth signUp metadata - the
// handle_new_user() trigger in supabase_schema_v1.1_auth.sql copies them into
// public.profiles automatically. Mentor accounts show a pending-approval message
// instead of redirecting straight into the site (mentor_approved defaults to false).

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getSupabaseAuthClient } from '@/lib/supabase-browser';

const inputClass =
  'w-full rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-name';
const labelClass = 'mb-1 block text-xs font-bold text-brand-textsoft';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    gender: '',
    role: 'student',
    college: '',
  });
  const [status, setStatus] = useState<{ type: 'error' | 'success'; msg: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.fullName || !form.phone || !form.email || !form.password || !form.gender || !form.college) {
      setStatus({ type: 'error', msg: 'יש למלא את כל השדות.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);

    const supabase = getSupabaseAuthClient();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          phone: form.phone,
          gender: form.gender,
          role: form.role,
          college: form.college,
        },
      },
    });

    setSubmitting(false);

    if (error) {
      setStatus({ type: 'error', msg: error.message });
      return;
    }

    if (form.role === 'mentor') {
      setPendingApproval(true);
    } else {
      router.push('/');
      router.refresh();
    }
  }

  if (pendingApproval) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4" dir="rtl">
        <div className="w-full max-w-sm rounded-2xl bg-brand-cardbg p-8 text-center shadow-lg">
          <Icon icon="solar:clock-circle-bold" width={44} className="mx-auto mb-3 text-brand-link" />
          <h1 className="mb-2 text-lg font-bold text-brand-text">ההרשמה שלך התקבלה</h1>
          <p className="text-sm text-brand-textsoft">
            חשבון מנחה דורש אישור ידני של האדמין לפני הפעלה. נעדכן אותך במייל כשהחשבון מאושר.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4" dir="rtl">
      <div className="w-full max-w-md rounded-2xl bg-brand-cardbg p-8 shadow-lg">
        <h1 className="mb-1 text-center text-lg font-bold text-brand-text">
          <Icon icon="solar:user-plus-bold" width={22} className="inline" /> הרשמה
        </h1>
        <p className="mb-5 text-center text-sm text-brand-textsoft">קטלוג רכיבי אלקטרוניקה לפרויקטי גמר</p>

        <div className="flex flex-col gap-3">
          <div>
            <label className={labelClass}>שם מלא</label>
            <input value={form.fullName} onChange={(e) => update('fullName', e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>טלפון</label>
            <input value={form.phone} onChange={(e) => update('phone', e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>מייל</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>סיסמה</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>מין</label>
            <select value={form.gender} onChange={(e) => update('gender', e.target.value)} className={inputClass}>
              <option value="">בחר...</option>
              <option value="זכר">זכר</option>
              <option value="נקבה">נקבה</option>
              <option value="אחר">אחר</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>סוג משתמש</label>
            <select value={form.role} onChange={(e) => update('role', e.target.value)} className={inputClass}>
              <option value="student">סטודנט</option>
              <option value="mentor">מנחה</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>מכללה</label>
            <input value={form.college} onChange={(e) => update('college', e.target.value)} className={inputClass} />
          </div>

          {status && (
            <p className={`text-center text-xs ${status.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
              {status.msg}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-1 w-full rounded-xl bg-brand-name py-2.5 text-sm font-bold text-brand-text disabled:opacity-60"
          >
            {submitting ? 'נרשם...' : 'הרשמה'}
          </button>

          <p className="text-center text-xs text-brand-textsoft">
            כבר רשום?{' '}
            <a href="/login" className="font-bold text-brand-link">
              התחבר כאן
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
