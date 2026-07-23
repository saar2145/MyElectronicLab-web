// Version: 1.2
// Title: Forgot Password Page | Change from v1.1: email field now uses
// EmailAutocomplete (gmail.com-first domain suggestions as you type). Change
// from v1.0: UI/UX refinement pass
// (visual only) - AuthBrandHeader + gradient accent bar/button, matching the
// rest of the auth-page family. Important Data: sends a Supabase recovery
// email via resetPasswordForEmail, redirecting the emailed link to
// /reset-password. Requires Supabase's built-in email rate limit to not be
// exceeded (or a custom SMTP provider configured) - see chat notes on the
// "email rate limit exceeded" error.

'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { getSupabaseAuthClient } from '@/lib/supabase-browser';
import AuthBrandHeader from '@/components/AuthBrandHeader';
import EmailAutocomplete from '@/components/EmailAutocomplete';

const inputClass =
  'w-full rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none transition focus:border-brand-name focus:ring-2 focus:ring-brand-name/40';
const cardClass =
  "relative overflow-hidden rounded-2xl bg-brand-cardbg p-8 text-center shadow-xl ring-1 ring-black/5 before:absolute before:inset-x-0 before:top-0 before:h-1.5 before:bg-[linear-gradient(90deg,var(--header-grad-from),var(--header-grad-to))] before:content-['']";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email) {
      setError('יש להזין כתובת מייל.');
      return;
    }
    setSubmitting(true);
    setError('');

    const supabase = getSupabaseAuthClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setSubmitting(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4" dir="rtl">
      <div className="w-full max-w-sm">
        <AuthBrandHeader />
        <div className={cardClass}>
        {sent ? (
          <>
            <Icon icon="solar:letter-bold" width={44} className="mx-auto mb-3 text-brand-linktext" />
            <h1 className="mb-2 text-lg font-bold text-brand-text">נשלח מייל</h1>
            <p className="text-sm text-brand-textsoft">
              אם הכתובת {email} רשומה אצלנו, נשלח אליה קישור לאיפוס סיסמה.
            </p>
          </>
        ) : (
          <>
            <Icon icon="solar:key-minimalistic-square-bold" width={44} className="mx-auto mb-3 text-brand-linktext" />
            <h1 className="mb-1 text-lg font-bold text-brand-text">שכחתי סיסמה</h1>
            <p className="mb-5 text-sm text-brand-textsoft">נשלח לך קישור לאיפוס לכתובת המייל שלך</p>

            <div className="mb-3">
              <EmailAutocomplete value={email} onChange={setEmail} onEnter={handleSubmit} placeholder="מייל" className={inputClass} />
            </div>

            {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-xl py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-px hover:shadow-lg disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, var(--header-grad-from), var(--header-grad-to))' }}
            >
              {submitting ? 'שולח...' : 'שלח קישור איפוס'}
            </button>

            <p className="mt-3 text-center text-xs text-brand-textsoft">
              <a href="/login" className="font-bold text-brand-linktext hover:underline">
                חזרה להתחברות
              </a>
            </p>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
