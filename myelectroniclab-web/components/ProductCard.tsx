// Version: 2.0
// Title: Product Card | Important Data: clickable (opens ProductModal), quick
// "add to cart" button with green flash animation - matches original site's
// flash-added CSS effect (green overlay + checkmark, ~1.5s).

'use client';

import { useState } from 'react';
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
      className="relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg hover:ring-brand-link"
    >
      {flash && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-2 border-green-500/60 bg-green-500/15">
          <span className="text-4xl font-black text-green-600">✓</span>
        </div>
      )}

      <div className="flex aspect-square items-center justify-center overflow-hidden bg-brand-picture">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={product.name ?? ''}
            className="h-full w-full object-contain"
            loading="lazy"
          />
        ) : (
          <span className="text-4xl opacity-40">📦</span>
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
          {product.price !== null && (
            <span className="rounded-lg bg-brand-price px-3 py-1.5 text-sm font-bold text-brand-text">
              ₪{product.price}
            </span>
          )}
          <button
            onClick={handleAdd}
            className="rounded-lg bg-brand-link px-3 py-1.5 text-xs font-bold text-brand-text transition hover:brightness-95"
          >
            🛒 הוסף
          </button>
        </div>
      </div>
    </div>
  );
}
