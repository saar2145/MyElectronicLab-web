// Version: 1.3
// Title: Login Page | Change from v1.2: supports a ?next= query param - after
// a successful login, redirects there instead of always to "/". Used by
// /join-class/[code] so a logged-out student clicking a mentor's invite link
// ends up back on that exact invite after logging in, instead of the
// catalog. Important Data: email/password sign-in via Supabase Auth only (no
// SSO). On success, proxy.ts keeps the session cookie fresh on subsequent
// requests.

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getSupabaseAuthClient } from '@/lib/supabase-browser';

const inputClass =
  'w-full rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-name';
const labelClass = 'mb-1 block text-xs font-bold text-brand-textsoft';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      setError('יש להזין מייל וסיסמה.');
      return;
    }

    setSubmitting(true);
    setError('');

    const supabase = getSupabaseAuthClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setSubmitting(false);

    if (signInError) {
      setError('מייל או סיסמה שגויים.');
      return;
    }

    router.push(searchParams.get('next') || '/');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4" dir="rtl">
      <div className="w-full max-w-sm rounded-2xl bg-brand-cardbg p-8 shadow-lg">
        <h1 className="mb-1 text-center text-lg font-bold text-brand-text">
          <Icon icon="solar:login-2-bold" width={22} className="inline" /> התחברות
        </h1>
        <p className="mb-5 text-center text-sm text-brand-textsoft">קטלוג רכיבי אלקטרוניקה לפרויקטי גמר</p>

        <div className="flex flex-col gap-3">
          <div>
            <label className={labelClass}>מייל</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div>
            <label className={labelClass}>סיסמה</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <a href="/forgot-password" className="mt-1 block text-left text-xs font-bold text-brand-linktext hover:underline">
              שכחתי סיסמה
            </a>
          </div>

          {error && <p className="text-center text-xs text-red-500">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-1 w-full rounded-xl bg-brand-name py-2.5 text-sm font-bold text-brand-text disabled:opacity-60"
          >
            {submitting ? 'מתחבר...' : 'התחברות'}
          </button>

          <p className="text-center text-xs text-brand-textsoft">
            עדיין אין לך חשבון?{' '}
            <a href="/register" className="font-bold text-brand-linktext hover:underline">
              הרשם כאן
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
