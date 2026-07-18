// Version: 2.0
// Title: App Shell | Important Data: full integration - banner, theme toggle,
// FAB group (chat/ticket/about), all modals, refresh via router.refresh().
// This is the "1:1 parity" pass matching the original Index.html feature set
// (chat/ticket UIs are shells only - TODO Step 2: wire to backend).

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@iconify/react';
import { ProductRow } from '@/lib/supabase';
import { groupCatalog, searchCatalog, GroupedProduct } from '@/lib/catalog';
import { CartProvider, useCart } from '@/lib/cart-context';
import { ThemeProvider } from '@/lib/theme-context';
import Banner from './Banner';
import HeaderStatusRow from './HeaderStatusRow';
import SearchBar from './SearchBar';
import Sidebar from './Sidebar';
import CategorySection from './CategorySection';
import ProductModal from './ProductModal';
import CartView from './CartView';
import FabGroup from './FabGroup';
import AboutModal from './AboutModal';
import TicketModal from './TicketModal';
import ChatPanel from './ChatPanel';

function HeaderNav({ setView }: { setView: (v: 'catalog' | 'cart') => void }) {
  const { totalCount } = useCart();
  const btnClass =
    'flex shrink-0 items-center gap-2 rounded-full bg-brand-cardbg px-4 py-3 text-base font-bold text-brand-text shadow-md transition hover:brightness-95 sm:px-6 sm:text-lg';

  return (
    <div className="mb-1 flex items-center justify-between gap-2">
      <button onClick={() => setView('catalog')} className={btnClass}>
        <Icon icon="solar:book-2-bold" width={22} />
        <span>קטלוג</span>
      </button>

      <div className="min-w-0 flex-1" />

      <button onClick={() => setView('cart')} className={`relative ${btnClass}`}>
        <Icon icon="solar:cart-large-minimalistic-bold" width={22} />
        <span>עגלה</span>
        {totalCount > 0 && (
          <span className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {totalCount}
          </span>
        )}
      </button>
    </div>
  );
}

function ShellInner({ rows }: { rows: ProductRow[] }) {
  const router = useRouter();
  const [view, setView] = useState<'catalog' | 'cart'>('catalog');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<GroupedProduct | null>(null);
  const [modal, setModal] = useState<'about' | 'ticket' | 'chat' | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // מעדכן חותמת זמן וכיבוי ה-spinner בכל פעם ש-rows מתעדכן (אחרי router.refresh())
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- סנכרון מדעת עם שינוי prop חיצוני (rows), לא לולאת רינדור
    setLastUpdated(new Date().toLocaleTimeString('he-IL'));
    setRefreshing(false);
  }, [rows]);

  function handleRefresh() {
    setRefreshing(true);
    router.refresh();
  }

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
        className="sticky top-0 z-50 px-3 pt-3 pb-2.5 shadow-lg"
        style={{ background: 'linear-gradient(135deg, var(--header-grad-from), var(--header-grad-to))' }}
      >
        <HeaderNav setView={setView} />
        <Banner />
        {view === 'catalog' && (
          <div className="mt-2">
            <SearchBar value={query} onChange={setQuery} />
          </div>
        )}
        <HeaderStatusRow lastUpdated={lastUpdated} onRefresh={handleRefresh} refreshing={refreshing} />
      </header>

      {view === 'catalog' ? (
        <>
          <main className="mx-auto max-w-6xl px-4 pb-24 pt-2 md:pr-72">
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

      <footer className="pb-24 pt-6 text-center text-xs text-brand-textsoft">
        <div className="opacity-60">כל הזכויות שמורות. © 2026 MyElectronicLab</div>
        <div className="mt-1 opacity-30">By Saar Cohen</div>
      </footer>

      <FabGroup
        onOpenChat={() => setModal('chat')}
        onOpenTicket={() => setModal('ticket')}
        onOpenAbout={() => setModal('about')}
      />

      {selected && (
        <ProductModal
          product={selected}
          allProducts={allProducts}
          onClose={() => setSelected(null)}
          onSelectProduct={setSelected}
        />
      )}
      {modal === 'about' && <AboutModal onClose={() => setModal(null)} />}
      {modal === 'ticket' && <TicketModal onClose={() => setModal(null)} />}
      {modal === 'chat' && <ChatPanel onClose={() => setModal(null)} />}
    </div>
  );
}

export default function AppShell({ rows }: { rows: ProductRow[] }) {
  return (
    <ThemeProvider>
      <CartProvider>
        <ShellInner rows={rows} />
      </CartProvider>
    </ThemeProvider>
  );
}
