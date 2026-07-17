// Version: 1.0
// Title: Product Card | Important Data: matches Index.html card design -
// image (Cloudinary w_500), name badge, model badge, price badge, buy link.

import { GroupedProduct } from '@/lib/catalog';
import { cloudinaryTransform } from '@/lib/cloudinary';

export default function ProductCard({ product }: { product: GroupedProduct }) {
  const img = cloudinaryTransform(product.image_url, 'f_auto,q_auto,w_500');

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
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
          {product.link && (
            <a
              href={product.link}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="rounded-lg bg-brand-link px-3 py-1.5 text-xs font-bold text-brand-text transition hover:brightness-95"
            >
              לקנייה ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
