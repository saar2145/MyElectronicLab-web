// Version: 2.0
// Title: Cart Context | Change from v1.0: cart now syncs to Supabase
// (cart_items table, see cart_items_v1.4.sql) when a user is logged in, so it
// follows them across devices. Anonymous users keep the original localStorage
// behavior unchanged. On SIGNED_IN, any local (pre-login) cart items are
// merged into the server cart (quantities summed for items present in both,
// server keeps its own qty is NOT used - see mergeLocalIntoServer) and
// localStorage is cleared. On SIGNED_OUT, we go back to reading whatever is
// currently in localStorage (empty in the normal flow, since it was cleared
// at merge time) - this intentionally does NOT show the previous user's cart
// to whoever uses the browser next.

'use client';

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { getSupabaseAuthClient } from './supabase-browser';

export type CartItem = {
  id: number;
  name: string;
  model: string | null;
  price: number | null;
  image_url: string | null;
  link: string | null;
  qty: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'qty'>) => void;
  removeItem: (id: number) => void;
  setQty: (id: number, qty: number) => void;
  clear: () => void;
  totalCount: number;
  totalPrice: number;
  syncing: boolean;
};

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = 'myl_cart_v1';

function readLocal(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocal(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage לא זמין - לא קריטי, פשוט לא נשמר
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const supabase = useRef(getSupabaseAuthClient()).current;

  // טעינת cart שרת עבור משתמש מחובר, כולל merge של פריטים מקומיים (מלפני ההתחברות)
  async function loadServerCart(uid: string) {
    type JoinedRow = {
      qty: number;
      products: { id: number; name: string; model: string | null; price: number | null; image_url: string | null; link: string | null } | null;
    };

    const { data } = await supabase
      .from('cart_items')
      .select('product_id, qty, products(id, name, model, price, image_url, link)')
      .eq('user_id', uid);

    return ((data ?? []) as unknown as JoinedRow[])
      .filter((row) => row.products)
      .map((row) => ({
        id: row.products!.id,
        name: row.products!.name,
        model: row.products!.model,
        price: row.products!.price,
        image_url: row.products!.image_url,
        link: row.products!.link,
        qty: row.qty,
      })) as CartItem[];
  }

  async function mergeLocalIntoServer(uid: string, localItems: CartItem[], serverItems: CartItem[]) {
    if (localItems.length === 0) return serverItems;
    const serverMap = new Map(serverItems.map((i) => [i.id, i]));
    const rows = localItems.map((li) => {
      const existing = serverMap.get(li.id);
      const qty = existing ? existing.qty + li.qty : li.qty;
      serverMap.set(li.id, { ...li, qty });
      return { user_id: uid, product_id: li.id, qty };
    });
    await supabase.from('cart_items').upsert(rows, { onConflict: 'user_id,product_id' });
    return Array.from(serverMap.values());
  }

  // אתחול: בודק אם יש session, טוען מהמקום הנכון (שרת/localStorage)
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;

      if (data.user) {
        userIdRef.current = data.user.id;
        setSyncing(true);
        const local = readLocal();
        const server = await loadServerCart(data.user.id);
        const merged = await mergeLocalIntoServer(data.user.id, local, server);
        if (local.length > 0) writeLocal([]);
        if (!cancelled) {
          setItems(merged);
          setSyncing(false);
        }
      } else {
        setItems(readLocal());
      }
      if (!cancelled) setLoaded(true);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        userIdRef.current = session.user.id;
        setSyncing(true);
        const local = readLocal();
        const server = await loadServerCart(session.user.id);
        const merged = await mergeLocalIntoServer(session.user.id, local, server);
        writeLocal([]);
        setItems(merged);
        setSyncing(false);
      } else if (event === 'SIGNED_OUT') {
        userIdRef.current = null;
        setItems(readLocal());
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- מריץ פעם אחת בלבד ב-mount, ה-subscription מטפל בשינויים
  }, []);

  // שמירה ל-localStorage רק במצב אנונימי (הכתיבה למצב מחובר קורית ישירות בכל פעולה, ראה למטה)
  useEffect(() => {
    if (!loaded || userIdRef.current) return;
    writeLocal(items);
  }, [items, loaded]);

  function addItem(item: Omit<CartItem, 'qty'>) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      const next = existing
        ? prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
        : [...prev, { ...item, qty: 1 }];

      const uid = userIdRef.current;
      if (uid) {
        const newQty = existing ? existing.qty + 1 : 1;
        supabase.from('cart_items').upsert(
          { user_id: uid, product_id: item.id, qty: newQty },
          { onConflict: 'user_id,product_id' }
        );
      }
      return next;
    });
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    const uid = userIdRef.current;
    if (uid) supabase.from('cart_items').delete().eq('user_id', uid).eq('product_id', id);
  }

  function setQty(id: number, qty: number) {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
    const uid = userIdRef.current;
    if (uid) supabase.from('cart_items').update({ qty }).eq('user_id', uid).eq('product_id', id);
  }

  function clear() {
    setItems([]);
    const uid = userIdRef.current;
    if (uid) supabase.from('cart_items').delete().eq('user_id', uid);
  }

  const totalCount = items.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = items.reduce((sum, i) => sum + (i.price ?? 0) * i.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, setQty, clear, totalCount, totalPrice, syncing }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
