// Version: 2.0
// Title: Cart View | Important Data: Iconify icons, dark-mode aware backgrounds,
// gradient uses CSS var (--header-grad-from/to) so it also flips correctly in dark mode.

'use client';

import { Icon } from '@iconify/react';
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
        className="mb-4 flex items-center gap-1 text-sm font-semibold text-brand-link hover:underline"
      >
        <Icon icon="solar:arrow-right-bold" width={15} />
        חזרה לקטלוג
      </button>

      {items.length === 0 ? (
        <div className="py-20 text-center text-brand-textsoft">
          <Icon icon="solar:cart-large-minimalistic-bold" width={44} className="mx-auto mb-2 opacity-40" />
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
                  className="flex items-center gap-3 rounded-xl bg-brand-cardbg p-3 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-picture">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt={item.name} className="h-full w-full object-contain" />
                    ) : (
                      <Icon icon="solar:box-bold" width={22} className="opacity-30" />
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
                    <span className="w-5 text-center text-sm text-brand-text">{item.qty}</span>
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

          <div className="mt-6 flex items-center justify-between rounded-xl bg-brand-cardbg p-4 shadow-sm ring-1 ring-black/5">
            <span className="text-sm text-brand-textsoft">סה&quot;כ לתשלום</span>
            <span className="text-xl font-black text-brand-text">₪{totalPrice}</span>
          </div>

          <button
            onClick={buyAll}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-md"
            style={{ background: 'linear-gradient(135deg, var(--header-grad-from), var(--header-grad-to))' }}
          >
            <Icon icon="solar:rocket-bold" width={16} />
            רכישת כל המוצרים בעגלה
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
