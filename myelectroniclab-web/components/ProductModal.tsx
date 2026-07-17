// Version: 1.0
// Title: Product Modal | Important Data: resolves related_ids (comma-separated) by
// looking up matching products in allProducts array - same pattern as related items
// in the original Index.html modal.

'use client';

import { useState } from 'react';
import { GroupedProduct } from '@/lib/catalog';
import { cloudinaryTransform } from '@/lib/cloudinary';
import { useCart } from '@/lib/cart-context';

export default function ProductModal({
  product,
  allProducts,
  onClose,
  onSelectProduct,
}: {
  product: GroupedProduct;
  allProducts: GroupedProduct[];
  onClose: () => void;
  onSelectProduct: (p: GroupedProduct) => void;
}) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const img = cloudinaryTransform(product.image_url, 'f_auto,q_auto,w_900');

  const relatedProducts = (product.related_ids ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((idStr) => allProducts.find((p) => String(p.id) === idStr))
    .filter((p): p is GroupedProduct => Boolean(p));

  function handleAddToCart() {
    addItem({
      id: product.id,
      name: product.name ?? '',
      model: product.model,
      price: product.price,
      image_url: product.image_url,
      link: product.link,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex aspect-square items-center justify-center bg-brand-picture">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/30"
          >
            ✕
          </button>
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt={product.name ?? ''}
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-5xl opacity-40">📦</span>
          )}
        </div>

        <div className="flex flex-col gap-3 p-5">
          <h2 className="text-lg font-bold text-brand-text">{product.name}</h2>

          {product.model && (
            <div className="w-fit rounded-lg bg-brand-model px-3 py-1.5 text-sm text-brand-text">
              {product.model}
            </div>
          )}

          <div className="flex items-center justify-between">
            {product.price !== null ? (
              <span className="rounded-lg bg-brand-price px-3 py-1.5 text-base font-bold text-brand-text">
                ₪{product.price}
              </span>
            ) : (
              <span />
            )}
            <span className="font-mono text-xs text-brand-textsoft/40">
              ID : #{product.id}
            </span>
          </div>

          {product.description && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-brand-text/90">
              {product.description}
            </p>
          )}

          <div className="mt-2 flex gap-2">
            {product.link && (
              <a
                href={product.link}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex-1 rounded-xl bg-brand-link py-2.5 text-center text-sm font-bold text-brand-text hover:brightness-95"
              >
                לקנייה ↗
              </a>
            )}
            <button
              onClick={handleAddToCart}
              className="flex-1 rounded-xl bg-brand-name py-2.5 text-sm font-bold text-brand-text transition hover:brightness-95"
            >
              {added ? '✓ נוסף!' : '🛒 הוסף לעגלה'}
            </button>
          </div>

          {relatedProducts.length > 0 && (
            <div className="mt-3 border-t border-brand-category pt-3">
              <div className="mb-2 text-xs font-bold text-brand-textsoft">
                🔗 מוצרים קשורים
              </div>
              <div className="grid grid-cols-3 gap-2">
                {relatedProducts.map((rp) => {
                  const rImg = cloudinaryTransform(rp.image_url, 'f_auto,q_auto,w_280');
                  return (
                    <button
                      key={rp.id}
                      onClick={() => onSelectProduct(rp)}
                      className="flex flex-col overflow-hidden rounded-lg bg-brand-bg text-right ring-1 ring-black/5 hover:ring-brand-link"
                    >
                      <div className="flex aspect-square items-center justify-center overflow-hidden bg-brand-picture">
                        {rImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={rImg}
                            alt={rp.name ?? ''}
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-lg opacity-40">📦</span>
                        )}
                      </div>
                      <div className="truncate p-1.5 text-[11px] font-semibold text-brand-text">
                        {rp.name}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
