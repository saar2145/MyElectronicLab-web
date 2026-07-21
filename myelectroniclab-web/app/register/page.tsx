// Version: 1.4
// Title: Registration Page | Change from v1.3: now checks whether Supabase
// actually returned a session after signUp - with "Confirm email" turned
// back on, it won't (the user isn't logged in until they click the emailed
// link), so a new "בדוק את המייל שלך" screen shows instead of silently
// redirecting home. Also passes emailRedirectTo pointing at /email-confirmed
// (a page built specifically so the confirmation link lands somewhere
// meaningful instead of Supabase's bare default, which was landing on
// localhost - see that page for the "why" and the required Supabase Redirect
// URLs allow-list entry). Important Data: self-managed email/password auth
// only (no Google SSO). Collects all required fields per spec (name, phone,
// email, gender, role, college, avatar). Mentor accounts still separately
// need admin approval AFTER email verification - the check-your-email screen
// says so when role==='mentor'.

'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { getSupabaseAuthClient } from '@/lib/supabase-browser';
import { AVATAR_ICONS, DEFAULT_AVATAR_KEY } from '@/lib/avatar-icons';

const inputClass =
  'w-full rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-name';
const labelClass = 'mb-1 block text-xs font-bold text-brand-textsoft';

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    gender: '',
    role: 'student',
    college: '',
    avatarIcon: DEFAULT_AVATAR_KEY as string,
  });
  const [status, setStatus] = useState<{ type: 'error' | 'success'; msg: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

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
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/email-confirmed`,
        data: {
          full_name: form.fullName,
          phone: form.phone,
          gender: form.gender,
          role: form.role,
          college: form.college,
          avatar_icon: form.avatarIcon,
        },
      },
    });

    setSubmitting(false);

    if (error) {
      setStatus({ type: 'error', msg: error.message });
      return;
    }

    // אם אין session, "Confirm email" דלוק ב-Supabase - המשתמש חייב לאמת קודם
    setCheckEmail(!data.session);
  }

  if (checkEmail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4" dir="rtl">
        <div className="w-full max-w-sm rounded-2xl bg-brand-cardbg p-8 text-center shadow-lg">
          <Icon icon="solar:letter-bold" width={44} className="mx-auto mb-3 text-brand-linktext" />
          <h1 className="mb-2 text-lg font-bold text-brand-text">כמעט סיימת!</h1>
          <p className="mb-2 text-sm text-brand-textsoft">
            שלחנו קישור אימות ל-<span className="font-bold text-brand-text">{form.email}</span>. תיכנס למייל ותלחץ עליו כדי להשלים את ההרשמה.
          </p>
          {form.role === 'mentor' && (
            <p className="mt-3 rounded-lg bg-brand-bg p-2 text-xs text-brand-textsoft">
              בנוסף לאימות המייל, חשבון מנחה דורש גם אישור ידני של האדמין - נעדכן אותך כשהחשבון יופעל.
            </p>
          )}
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

          <div>
            <label className={labelClass}>תמונת פרופיל</label>
            <div className="grid grid-cols-7 gap-1.5 rounded-xl border border-brand-category bg-brand-bg p-2">
              {AVATAR_ICONS.map((a) => {
                const selected = form.avatarIcon === a.key;
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => update('avatarIcon', a.key)}
                    title={a.label}
                    className={`flex aspect-square items-center justify-center rounded-lg transition ${
                      selected ? 'bg-brand-picture ring-2 ring-brand-linktext' : 'hover:bg-brand-picture/50'
                    }`}
                  >
                    <Icon icon={a.icon} width={18} className="text-brand-text" />
                  </button>
                );
              })}
            </div>
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
            <a href="/login" className="font-bold text-brand-linktext hover:underline">
              התחבר כאן
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
