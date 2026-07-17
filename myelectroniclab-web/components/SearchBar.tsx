// Version: 1.0
// Title: Search Bar | Important Data: controlled input, dispatches to parent state
// in CatalogView, matches original placeholder text/style.

'use client';

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
        className="w-full rounded-full bg-white/90 py-3 pl-5 pr-11 text-sm text-brand-text placeholder:text-brand-textsoft focus:outline-none focus:ring-2 focus:ring-white"
      />
      <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-brand-textsoft">
        🔍
      </span>
    </div>
  );
}
