// Version: 1.0
// Title: Cart View | Important Data: "buy all" opens each item's affiliate link in
// a new tab (window.open loop) - matches original site's cart checkout behavior
// (there is no real checkout; purchases happen directly on AliExpress).

'use client';

import { useCart } from '@/lib/cart-context';
import { cloudinaryTransform } from '@/lib/cloudinary';

export default function CartView({ onBack }: { onBack: () => void }) {
  const { items, removeItem, setQty, totalPrice, clear } = useCart();

  function buyAll() {
    items.forEach((item) => {
      if (item.link) window.open(item.link, '_blank', 'noopener,noreferrer');
    });
  }

  return (
    <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-6">
      <button
        onClick={onBack}
        className="mb-4 text-sm font-semibold text-brand-link hover:underline"
      >
        → חזרה לקטלוג
      </button>

      {items.length === 0 ? (
        <div className="py-20 text-center text-brand-textsoft">
          <div className="mb-2 text-4xl">🛒</div>
          העגלה שלך ריקה
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {items.map((item) => {
              const img = cloudinaryTransform(item.image_url, 'f_auto,q_auto,w_150');
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-picture">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={item.name} className="h-full w-full object-contain" />
                    ) : (
                      <span className="text-xl opacity-40">📦</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-brand-text">
                      {item.name}
                    </div>
                    {item.model && (
                      <div className="truncate text-xs text-brand-textsoft">{item.model}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setQty(item.id, item.qty - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-bg text-brand-text"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-sm">{item.qty}</span>
                    <button
                      onClick={() => setQty(item.id, item.qty + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-bg text-brand-text"
                    >
                      +
                    </button>
                  </div>

                  {item.price !== null && (
                    <div className="w-16 shrink-0 text-left text-sm font-bold text-brand-text">
                      ₪{item.price * item.qty}
                    </div>
                  )}

                  <button
                    onClick={() => removeItem(item.id)}
                    className="shrink-0 text-brand-textsoft hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <span className="text-sm text-brand-textsoft">סה&quot;כ לתשלום</span>
            <span className="text-xl font-black text-brand-text">₪{totalPrice}</span>
          </div>

          <button
            onClick={buyAll}
            className="mt-4 w-full rounded-xl py-3 text-sm font-bold text-white shadow-md"
            style={{ background: 'linear-gradient(135deg, #1565C0 0%, #0842A0 100%)' }}
          >
            🚀 רכישת כל המוצרים בעגלה
          </button>

          <p className="mt-2 text-center text-xs text-brand-textsoft">
            כל מוצר ייפתח בכרטיסייה נפרדת ישירות באתר הספק
          </p>

          <button
            onClick={clear}
            className="mt-3 w-full text-center text-xs text-brand-textsoft hover:text-red-500"
          >
            רוקן עגלה
          </button>
        </>
      )}
    </main>
  );
}
