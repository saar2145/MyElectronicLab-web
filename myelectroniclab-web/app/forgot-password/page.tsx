// Version: 1.0
// Title: Forgot Password Page | Important Data: sends a Supabase recovery
// email via resetPasswordForEmail, redirecting the emailed link to
// /reset-password. Requires Supabase's built-in email rate limit to not be
// exceeded (or a custom SMTP provider configured) - see chat notes on the
// "email rate limit exceeded" error.

'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { getSupabaseAuthClient } from '@/lib/supabase-browser';

const inputClass =
  'w-full rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-name';

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
      <div className="w-full max-w-sm rounded-2xl bg-brand-cardbg p-8 text-center shadow-lg">
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

            <input
              type="email"
              placeholder="מייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className={`mb-3 ${inputClass}`}
            />

            {error && <p className="mb-3 text-xs text-red-500">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-xl bg-brand-name py-2.5 text-sm font-bold text-brand-text disabled:opacity-60"
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
  );
}
