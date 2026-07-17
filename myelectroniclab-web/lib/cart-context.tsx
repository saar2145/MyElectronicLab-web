// Version: 1.0
// Title: Cart Context | Important Data: localStorage key "myl_cart_v1", client-only
// state (no backend cart yet) - mirrors the cart behavior from the original Index.html.

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

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
};

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = 'myl_cart_v1';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // טעינה מ-localStorage בעליה הראשונית בלבד. הכרחי לקרוא ב-useEffect
  // (לא ב-lazy initializer) כי ל-localStorage אין גישה ב-SSR - חייבים
  // להתחיל עם מערך ריק בשני הצדדים (שרת+קליינט) כדי למנוע hydration
  // mismatch, ולסנכרן את הערך האמיתי רק אחרי ה-mount בדפדפן.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- ראה הערה למעלה
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // localStorage לא זמין / נתונים פגומים - מתחילים מעגלה ריקה
    }
    setLoaded(true);
  }, []);

  // שמירה בכל שינוי, רק אחרי שהטעינה הראשונית הסתיימה (למניעת דריסה בזמן הטעינה)
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, loaded]);

  function addItem(item: Omit<CartItem, 'qty'>) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, { ...item, qty: 1 }];
    });
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function setQty(id: number, qty: number) {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty } : i)));
  }

  function clear() {
    setItems([]);
  }

  const totalCount = items.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = items.reduce((sum, i) => sum + (i.price ?? 0) * i.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, setQty, clear, totalCount, totalPrice }}
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
