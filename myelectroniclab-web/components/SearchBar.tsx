// Version: 3.0
// Title: Search Bar | Important Data: FIX - the input background is intentionally
// ALWAYS light (bg-white/90) regardless of site theme (floats on the blue header
// gradient like a distinct pill, same as original design). Previously the text
// color used the theme-switching `text-brand-text` token, which resolves to a
// LIGHT color in dark mode - invisible against the always-light background. Now
// hardcoded to a fixed dark navy that never changes with theme, matching the
// fixed-light background.

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
    <div className="relative mx-auto max-w-xl">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="חיפוש לפי שם, דגם או קטגוריה..."
        className="w-full rounded-full bg-white/90 py-3 pl-5 pr-11 text-sm text-[#091e3a] placeholder:text-[#4e6e92] focus:outline-none focus:ring-2 focus:ring-white"
      />
      <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[#4e6e92]">
        <Icon icon="solar:magnifer-bold" width={17} />
      </span>
    </div>
  );
}
