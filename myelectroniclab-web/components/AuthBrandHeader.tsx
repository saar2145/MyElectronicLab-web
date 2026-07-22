// Version: 1.0
// Title: Auth Brand Header | Important Data: small shared header used only by
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
        <Icon icon="solar:flask-bold" width={28} className="text-white" />
      </div>
      <span className="text-sm font-extrabold tracking-tight text-brand-text">MyElectronicLab</span>
    </div>
  );
}
