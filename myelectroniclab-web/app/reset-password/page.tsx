// Version: 1.0
// Title: Reset Password Page | Important Data: reached via the link in the
// recovery email sent from /forgot-password. @supabase/ssr's browser client
// detects the recovery token in the URL and fires a PASSWORD_RECOVERY
// auth event - we wait for that (or an existing recovery session) before
// showing the form, then call auth.updateUser({ password }).

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { getSupabaseAuthClient } from '@/lib/supabase-browser';

const inputClass =
  'w-full rounded-lg border border-brand-category bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-name';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseAuthClient();

    // אם ה-session כבר קיים (הקישור כבר עובד ברקע לפני שהאפקט רץ)
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit() {
    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים.');
      return;
    }
    if (password !== confirm) {
      setError('הסיסמאות לא תואמות.');
      return;
    }

    setSubmitting(true);
    setError('');
    const supabase = getSupabaseAuthClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => {
      router.push('/');
      router.refresh();
    }, 1500);
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4" dir="rtl">
        <p className="text-sm text-brand-textsoft">מאמת קישור...</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4" dir="rtl">
        <div className="w-full max-w-sm rounded-2xl bg-brand-cardbg p-8 text-center shadow-lg">
          <Icon icon="solar:check-circle-bold" width={44} className="mx-auto mb-3 text-green-500" />
          <h1 className="text-lg font-bold text-brand-text">הסיסמה עודכנה!</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-bg p-4" dir="rtl">
      <div className="w-full max-w-sm rounded-2xl bg-brand-cardbg p-8 shadow-lg">
        <h1 className="mb-1 text-center text-lg font-bold text-brand-text">קביעת סיסמה חדשה</h1>
        <p className="mb-5 text-center text-sm text-brand-textsoft">בחר סיסמה חדשה לחשבון שלך</p>

        <div className="flex flex-col gap-3">
          <input
            type="password"
            placeholder="סיסמה חדשה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            placeholder="אימות סיסמה"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className={inputClass}
          />

          {error && <p className="text-center text-xs text-red-500">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-1 w-full rounded-xl bg-brand-name py-2.5 text-sm font-bold text-brand-text disabled:opacity-60"
          >
            {submitting ? 'מעדכן...' : 'עדכן סיסמה'}
          </button>
        </div>
      </div>
    </div>
  );
}
