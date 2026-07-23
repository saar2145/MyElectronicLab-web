// Version: 1.2
// Title: Auth Brand Header | Change from v1.1: replaced the icon-in-gradient-
// badge with the site's actual logo mark image (same source as the favicon
// in app/layout.tsx - a near-square 199x219 crop, not the wide text banner
// from components/Banner.tsx, which would look squashed here), sized up per
// request, with a soft brand-colored glow instead of a solid background
// tile. Change from v1.0: FIX - "solar:flask-bold" is not a real Iconify
// icon in the Solar set (verified against icon-sets.iconify.design - search
// for "flask" returns no matches), so the badge rendered as an empty box on
// every auth page. Important Data: small shared header used only by
// the auth-page family (login/register/forgot-password/reset-password/
// join-class/join-class[code]) so those pages read as part of the same site
// as the catalog instead of a generic centered form. Purely presentational -
// no props, no state, no links (the pages below it already provide their own
// navigation).

export default function AuthBrandHeader() {
  return (
    <div className="mb-5 flex flex-col items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://lh3.googleusercontent.com/d/1QOuhriqT5PyPaydnhuRK7ccPG2udhHT6"
        alt="MyElectronicLab"
        className="h-20 w-20 rounded-2xl object-contain"
        style={{ filter: 'drop-shadow(0 6px 16px rgba(21, 101, 192, 0.4))' }}
      />
      <span className="text-sm font-extrabold tracking-tight text-brand-text">MyElectronicLab</span>
    </div>
  );
}
