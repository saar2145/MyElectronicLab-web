// Version: 1.6
// Title: Login Page | Change from v1.5: FIX - the ?next= redirect target is
// now validated to be a same-origin relative path before use (must start
// with "/" and not "//", which browsers treat as protocol-relative to an
// external host) - found during the pre-public-launch security review as an
// open-redirect risk (a crafted /login?next=https://evil.example link could
// otherwise send a user who just "successfully logged in" straight to a
// phishing page). Change from v1.4: email field now uses
// EmailAutocomplete (gmail.com-first domain suggestions as you type).
// Change from v1.3: UI/UX refinement pass (visual only,
// no behavior change) - added a brand header above the card (matches the auth
// pages family: register/forgot-password/reset-password/join-class), gradient
// top accent bar + submit button, refined input focus ring. Change from v1.2:
// supports a ?next= query param - after a successful login, redirects there
// instead of always to "/". Used by /join-class/[code] so a logged-out
// student clicking a mentor's invite link ends up back on that exact invite
// after logging in, instead of the catalog. Important Data: email/password
// sign-in via Supabase Auth only (no SSO). On success, proxy.ts keeps the
// session cookie fresh on subsequent requests.

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getSupabaseAuthClient } from '@/lib/supabase-browser';
import AuthBrandHeader from '@/components/AuthBrandHeader';
import EmailAutocomplete from '@/components/EmailAutocomplete';

const inputClass =
  'w-full rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none transition focus:border-brand-name focus:ring-2 focus:ring-brand-name/40';
const labelClass = 'mb-1 block text-xs font-bold text-brand-textsoft';

function safeNextPath(next: string | null): string {
  if (!next) return '/';
  if (!next.startsWith('/') || next.startsWith('//')) return '/';
  return next;
}

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

    router.push(safeNextPath(searchParams.get('next')));
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <AuthBrandHeader />
        <div className="overflow-hidden rounded-2xl bg-brand-cardbg shadow-xl ring-1 ring-black/5">
          <div style={{ background: 'linear-gradient(90deg, var(--header-grad-from), var(--header-grad-to))' }} className="h-1.5" />
          <div className="p-8">
        <h1 className="mb-1 text-center text-lg font-bold text-brand-text">
          <Icon icon="solar:login-2-bold" width={22} className="inline" /> התחברות
        </h1>
        <p className="mb-5 text-center text-sm text-brand-textsoft">קטלוג רכיבי אלקטרוניקה לפרויקטי גמר</p>

        <div className="flex flex-col gap-3">
          <div>
            <label className={labelClass}>מייל</label>
            <EmailAutocomplete value={email} onChange={setEmail} onEnter={handleSubmit} className={inputClass} />
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
            className="mt-1 w-full rounded-xl py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-px hover:shadow-lg disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, var(--header-grad-from), var(--header-grad-to))' }}
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
      </div>
    </div>
  );
}
