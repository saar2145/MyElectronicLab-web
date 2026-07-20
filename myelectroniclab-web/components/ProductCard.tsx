// Version: 4.1
// Title: Product Card | Change from v4.0: swapped the price/buy-link order in
// the row - price now renders on the right, buy button on the left (was
// reversed). Important Data: Iconify icons, dark-mode aware background
// (bg-brand-cardbg). Buy/add buttons use --header-grad-from as a solid color
// (matches the reference's dark navy buttons - no existing brand token was
// that dark).

'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
import { GroupedProduct } from '@/lib/catalog';
import { cloudinaryTransform } from '@/lib/cloudinary';
import { useCart } from '@/lib/cart-context';

export default function ProductCard({
  product,
  onOpen,
}: {
  product: GroupedProduct;
  onOpen: (p: GroupedProduct) => void;
}) {
  const { addItem } = useCart();
  const [flash, setFlash] = useState(false);

  const img = cloudinaryTransform(product.image_url, 'f_auto,q_auto,w_500');

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name ?? '',
      model: product.model,
      price: product.price,
      image_url: product.image_url,
      link: product.link,
    });
    setFlash(true);
    setTimeout(() => setFlash(false), 1200);
  }

  return (
    <div
      onClick={() => onOpen(product)}
      className="relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-brand-cardbg shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-brand-link"
    >
      {flash && (
        <div className="flash-added-overlay pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-green-500/60 bg-green-500/15">
          <Icon icon="solar:check-circle-bold" width={54} className="text-green-600" />
        </div>
      )}

      <div className="flex aspect-square items-center justify-center overflow-hidden bg-white">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={product.name ?? ''}
            className="h-full w-full object-contain"
            loading="lazy"
          />
        ) : (
          <Icon icon="solar:gallery-broken-bold" width={36} className="opacity-30" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="rounded-lg bg-brand-name px-3 py-2 text-center text-sm font-bold text-brand-text">
          {product.name}
        </div>

        {product.model && (
          <div className="rounded-lg bg-brand-model px-3 py-1.5 text-center text-xs font-medium text-brand-text">
            {product.model}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          {product.price !== null ? (
            <span className="rounded-lg bg-brand-price px-3 py-1.5 text-sm font-bold text-brand-text">
              ₪{product.price}
            </span>
          ) : (
            <span />
          )}
          {product.link && (
            <a
              href={product.link}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold text-white transition hover:brightness-110"
              style={{ background: 'var(--header-grad-from)' }}
            >
              <Icon icon="majesticons:open-line" width={13} />
              לקנייה
            </a>
          )}
        </div>

        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-bold text-white transition hover:brightness-110"
          style={{ background: 'var(--header-grad-from)' }}
        >
          <Icon icon="solar:cart-plus-bold" width={16} />
          הוסף לעגלה
        </button>
      </div>
    </div>
  );
}
