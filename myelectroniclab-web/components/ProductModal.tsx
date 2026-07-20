// Version: 3.0
// Title: Product Modal | Change from v2.0: matches the legacy (Index.html/GAS)
// reference screenshot more closely - (1) close button moved from top-right to
// top-left (reference shows the X on the left edge of the image); (2) added a
// third button, "העתק קישור" - copies a shareable deep link (?product=<id>)
// to this specific product, distinct from "לקנייה" (the external purchase
// link) and "הוסף לעגלה"; (3) image container background is plain white (not
// theme-dependent bg-brand-picture) - matches how the reference shows product
// photos on white regardless of dark/light mode. Important Data: Iconify
// icons (majesticons:open-line for buy, solar:link-bold for related).

'use client';

import { useState } from 'react';
import { Icon } from '@iconify/react';
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
  const [linkCopied, setLinkCopied] = useState(false);

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

  function handleCopyLink() {
    const url = `${window.location.origin}/?product=${product.id}`;
    navigator.clipboard.writeText(url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 1500);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-brand-cardbg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex aspect-square items-center justify-center bg-white">
          <button
            onClick={onClose}
            className="absolute top-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/30"
          >
            ✕
          </button>
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={product.name ?? ''} className="h-full w-full object-contain" />
          ) : (
            <Icon icon="solar:gallery-broken-bold" width={48} className="opacity-30" />
          )}
        </div>

        <div className="flex flex-col gap-3 p-5">
          <div className="rounded-lg bg-brand-name px-3 py-2.5 text-center text-base font-bold text-brand-text">
            {product.name}
          </div>

          {product.model && (
            <div className="rounded-lg bg-brand-model px-3 py-2 text-center text-sm text-brand-text">
              {product.model}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-brand-textsoft/60">ID : #{product.id}</span>
            {product.price !== null ? (
              <span className="rounded-lg bg-brand-price px-3 py-1.5 text-base font-bold text-brand-text">
                ₪{product.price}
              </span>
            ) : (
              <span />
            )}
          </div>

          {product.description && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-brand-text/90">
              {product.description}
            </p>
          )}

          <div className="mt-2 grid grid-cols-3 gap-2">
            <button
              onClick={handleCopyLink}
              className="flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-bold text-white transition hover:brightness-110"
              style={{ background: 'var(--header-grad-from)' }}
            >
              <Icon icon={linkCopied ? 'solar:check-circle-bold' : 'solar:copy-bold'} width={16} />
              {linkCopied ? 'הועתק!' : 'העתק קישור'}
            </button>

            <button
              onClick={handleAddToCart}
              className="flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-bold text-white transition hover:brightness-110"
              style={{ background: 'var(--header-grad-from)' }}
            >
              <Icon icon={added ? 'solar:check-circle-bold' : 'solar:cart-plus-bold'} width={16} />
              {added ? 'נוסף!' : 'הוסף לעגלה'}
            </button>

            {product.link ? (
              <a
                href={product.link}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex flex-col items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-bold text-white transition hover:brightness-110"
                style={{ background: 'var(--header-grad-from)' }}
              >
                <Icon icon="majesticons:open-line" width={16} />
                לקנייה
              </a>
            ) : (
              <span />
            )}
          </div>

          {relatedProducts.length > 0 && (
            <div className="mt-3 border-t border-brand-category pt-3">
              <div className="mb-2 flex items-center gap-1 text-xs font-bold text-brand-textsoft">
                <Icon icon="solar:link-bold" width={14} />
                מוצרים קשורים
              </div>
              <div className="grid grid-cols-3 gap-2">
                {relatedProducts.map((rp) => {
                  const rImg = cloudinaryTransform(rp.image_url, 'f_auto,q_auto,w_280');
                  return (
                    <button
                      key={rp.id}
                      onClick={() => onSelectProduct(rp)}
                      className="flex flex-col overflow-hidden rounded-lg bg-white text-right ring-1 ring-black/5 hover:ring-brand-link"
                    >
                      <div className="flex aspect-square items-center justify-center overflow-hidden bg-white">
                        {rImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={rImg}
                            alt={rp.name ?? ''}
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />
                        ) : (
                          <Icon icon="solar:box-bold" width={18} className="opacity-30" />
                        )}
                      </div>
                      <div className="truncate bg-brand-bg p-1.5 text-[11px] font-semibold text-brand-text">
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
