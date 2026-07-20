// Version: 2.3
// Title: App Shell | Change from v2.2: the nav row's height was defined only
// by the buttons (~56px), while the centered banner is taller than that -
// so it overflowed the row and "ate" its own margin into that overflow,
// producing zero visible gap (my-2 on Banner had no visible effect - see chat).
// Fix: give the row an explicit min-height at each breakpoint, comfortably
// taller than the banner + its margin, so centering has real room to work
// with and the gap actually renders. Important Data: full integration -
// banner, theme toggle, FAB group (chat/ticket/about), all modals, refresh via
// router.refresh().

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
import UserMenu from './UserMenu';

function HeaderNav({ setView }: { setView: (v: 'catalog' | 'cart') => void }) {
  const { totalCount } = useCart();
  const btnClass =
    'flex shrink-0 items-center gap-2 rounded-full bg-brand-cardbg px-4 py-3 text-base font-bold text-brand-text shadow-md transition hover:brightness-95 sm:px-6 sm:text-lg';

  return (
    <div className="relative flex min-h-[72px] items-center justify-between gap-2 sm:min-h-[92px] md:min-h-[118px]">
      <button onClick={() => setView('catalog')} className={btnClass}>
        <Icon icon="solar:book-2-bold" width={22} />
        <span>קטלוג</span>
      </button>

      {/* הבאנר ממורכז מעל השורה עצמה (absolute), לא תופס שורה נפרדת -
          pointer-events-none כדי שלא יחסום קליק על מה שמתחתיו בקצוות */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Banner />
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button onClick={() => setView('cart')} className={`relative ${btnClass}`}>
          <Icon icon="solar:cart-large-minimalistic-bold" width={22} />
          <span>עגלה</span>
          {totalCount > 0 && (
            <span className="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {totalCount}
            </span>
          )}
        </button>

        <UserMenu />
      </div>
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
        className="isolate sticky top-0 z-50 box-border flex flex-col gap-2 overflow-visible px-3 pt-3 pb-2.5 shadow-lg"
        style={{ background: 'linear-gradient(135deg, var(--header-grad-from), var(--header-grad-to))' }}
      >
        <HeaderNav setView={setView} />
        {view === 'catalog' && <SearchBar value={query} onChange={setQuery} />}
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
