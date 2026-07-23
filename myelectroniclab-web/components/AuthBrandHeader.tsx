// Version: 1.1
// Title: Auth Brand Header | Change from v1.0: FIX - "solar:flask-bold" is
// not a real Iconify icon in the Solar set (verified against
// icon-sets.iconify.design - search for "flask" returns no matches), so the
// badge rendered as an empty box on every auth page. Swapped for
// "solar:test-tube-bold", which does exist. Important Data: small shared header used only by
// the auth-page family (login/register/forgot-password/reset-password/
// join-class/join-class[code]) so those pages read as part of the same site
// as the catalog instead of a generic centered form. Purely presentational -
// no props, no state, no links (the pages below it already provide their own
// navigation).

import { Icon } from '@iconify/react';

export default function AuthBrandHeader() {
  return (
    <div className="mb-5 flex flex-col items-center gap-2">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
        style={{ background: 'linear-gradient(135deg, var(--header-grad-from), var(--header-grad-to))' }}
      >
        <Icon icon="solar:test-tube-bold" width={28} className="text-white" />
      </div>
      <span className="text-sm font-extrabold tracking-tight text-brand-text">MyElectronicLab</span>
    </div>
  );
}
