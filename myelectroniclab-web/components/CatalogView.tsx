// Version: 1.0
// Title: Catalog View (Client Component) | Important Data: holds search state,
// re-groups/filters via lib/catalog.ts on every keystroke. Header uses the brand
// blue gradient (#1565C0 → #0842A0) matching the original Index.html header.

'use client';

import { useMemo, useState } from 'react';
import { ProductRow } from '@/lib/supabase';
import { groupCatalog, searchCatalog } from '@/lib/catalog';
import SearchBar from './SearchBar';
import Sidebar from './Sidebar';
import CategorySection from './CategorySection';

export default function CatalogView({ rows }: { rows: ProductRow[] }) {
  const [query, setQuery] = useState('');

  const allCategories = useMemo(() => groupCatalog(rows), [rows]);
  const visibleCategories = useMemo(
    () => searchCatalog(allCategories, query),
    [allCategories, query]
  );

  const productCount = rows.filter((r) => r.row_type === 'product').length;

  return (
    <div className="min-h-screen bg-brand-bg">
      <header
        className="sticky top-0 z-50 px-5 pt-5 pb-4 shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #1565C0 0%, #0842A0 100%)',
        }}
      >
        <h1 className="mb-4 text-center text-2xl font-black tracking-wide text-white">
          📦 קטלוג רכיבי אלקטרוניקה
        </h1>
        <SearchBar value={query} onChange={setQuery} />
        <p className="mt-2 text-center text-xs text-white/70">
          {productCount} מוצרים בקטלוג
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 md:pr-72">
        {visibleCategories.length === 0 ? (
          <div className="py-20 text-center text-brand-textsoft">
            לא נמצאו רכיבים מתאימים לחיפוש 🙁
          </div>
        ) : (
          visibleCategories.map((cat) => (
            <CategorySection key={cat.id} category={cat} />
          ))
        )}
      </main>

      <Sidebar categories={visibleCategories} />

      <footer className="pb-10 pt-6 text-center text-xs text-brand-textsoft/50">
        <div>כל הזכויות שמורות. © 2026 MyElectronicLab</div>
        <div className="mt-1 opacity-60">By Saar Cohen</div>
      </footer>
    </div>
  );
}
