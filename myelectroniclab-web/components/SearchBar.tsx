// Version: 3.2
// Title: Search Bar | Change from v3.1: UI/UX refinement pass (visual only) -
// added a resting shadow that strengthens on focus for more depth.
// Important Data: FIX v3.1 - added explicit w-full + self-center
// to the wrapper div. In the header's flex-col layout, a plain <div> with only
// max-width (no explicit width) interacts ambiguously with flexbox's default
// align-items:stretch, causing it to shrink to a much narrower width than
// intended. Being fully explicit (w-full to claim the row, max-w-xl to cap it,
// self-center to center it as a flex item) removes all ambiguity. Banner (an
// <img>, a CSS "replaced element") wasn't affected by the same header change
// because replaced elements are exempt from align-items:stretch by spec.

'use client';

import { Icon } from '@iconify/react';

export default function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative mx-auto w-full max-w-xl self-center">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="חיפוש לפי שם, דגם או קטגוריה..."
        className="w-full rounded-full bg-white/90 py-3 pl-5 pr-11 text-sm text-[#091e3a] shadow-md placeholder:text-[#4e6e92] transition focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
      />
      <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[#4e6e92]">
        <Icon icon="solar:magnifer-bold" width={17} />
      </span>
    </div>
  );
}
