// Version: 1.1
// Title: App Shell | Important Data: single source of truth for view state
// ('catalog' | 'cart'), search query, and selected product (modal). Wraps children
// in CartProvider so useCart() works anywhere in the tree. Fix from v1.0: search
// query state lifted here so SearchBar can render inside the blue header while
// CategorySection/Sidebar render in the body below it.

'use client';

import { useMemo, useState } from 'react';
import { ProductRow } from '@/lib/supabase';
import { groupCatalog, searchCatalog, GroupedProduct } from '@/lib/catalog';
import { CartProvider, useCart } from '@/lib/cart-context';
import SearchBar from './SearchBar';
import Sidebar from './Sidebar';
import CategorySection from './CategorySection';
import ProductModal from './ProductModal';
import CartView from './CartView';

function HeaderNav({
  view,
  setView,
}: {
  view: 'catalog' | 'cart';
  setView: (v: 'catalog' | 'cart') => void;
}) {
  const { totalCount } = useCart();

  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <button
        onClick={() => setView('catalog')}
        className={`shrink-0 rounded-full px-3 py-2 text-sm font-bold shadow-sm transition sm:px-4 ${
          view === 'catalog' ? 'bg-white text-brand-text' : 'bg-white/20 text-white'
        }`}
      >
        🗂️ <span className="hidden sm:inline">קטלוג</span>
      </button>

      <h1 className="truncate text-base font-black tracking-wide text-white sm:text-2xl">
        📦 קטלוג רכיבי אלקטרוניקה
      </h1>

      <button
        onClick={() => setView('cart')}
        className={`relative shrink-0 rounded-full px-3 py-2 text-sm font-bold shadow-sm transition sm:px-4 ${
          view === 'cart' ? 'bg-white text-brand-text' : 'bg-white/20 text-white'
        }`}
      >
        🛒 <span className="hidden sm:inline">עגלה</span>
        {totalCount > 0 && (
          <span className="absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {totalCount}
          </span>
        )}
      </button>
    </div>
  );
}

function ShellInner({ rows }: { rows: ProductRow[] }) {
  const [view, setView] = useState<'catalog' | 'cart'>('catalog');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<GroupedProduct | null>(null);

  const allProducts = useMemo(
    () => rows.filter((r): r is GroupedProduct => r.row_type === 'product'),
    [rows]
  );

  const allCategories = useMemo(() => groupCatalog(rows), [rows]);
  const visibleCategories = useMemo(
    () => searchCatalog(allCategories, query),
    [allCategories, query]
  );

  return (
    <div className="min-h-screen bg-brand-bg">
      <header
        className="sticky top-0 z-50 px-5 pt-5 pb-4 shadow-lg"
        style={{ background: 'linear-gradient(135deg, #1565C0 0%, #0842A0 100%)' }}
      >
        <HeaderNav view={view} setView={setView} />
        {view === 'catalog' && (
          <>
            <SearchBar value={query} onChange={setQuery} />
            <p className="mt-2 text-center text-xs text-white/70">
              {allProducts.length} מוצרים בקטלוג
            </p>
          </>
        )}
      </header>

      {view === 'catalog' ? (
        <>
          <main className="mx-auto max-w-6xl px-4 pb-16 md:pr-72">
            {visibleCategories.length === 0 ? (
              <div className="py-20 text-center text-brand-textsoft">
                לא נמצאו רכיבים מתאימים לחיפוש 🙁
              </div>
            ) : (
              visibleCategories.map((cat) => (
                <CategorySection key={cat.id} category={cat} onOpen={setSelected} />
              ))
            )}
          </main>
          <Sidebar categories={visibleCategories} />
        </>
      ) : (
        <CartView onBack={() => setView('catalog')} />
      )}

      <footer className="pb-10 pt-6 text-center text-xs text-brand-textsoft/50">
        <div>כל הזכויות שמורות. © 2026 MyElectronicLab</div>
        <div className="mt-1 opacity-60">By Saar Cohen</div>
      </footer>

      {selected && (
        <ProductModal
          product={selected}
          allProducts={allProducts}
          onClose={() => setSelected(null)}
          onSelectProduct={setSelected}
        />
      )}
    </div>
  );
}

export default function AppShell({ rows }: { rows: ProductRow[] }) {
  return (
    <CartProvider>
      <ShellInner rows={rows} />
    </CartProvider>
  );
}
