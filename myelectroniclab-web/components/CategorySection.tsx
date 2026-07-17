// Version: 2.0
// Title: Category Section | Important Data: passes onOpen (product click handler)
// down to every ProductCard so clicking opens the ProductModal.

import { CategoryGroup, GroupedProduct } from '@/lib/catalog';
import ProductCard from './ProductCard';

export default function CategorySection({
  category,
  onOpen,
}: {
  category: CategoryGroup;
  onOpen: (p: GroupedProduct) => void;
}) {
  return (
    <section id={category.id} className="mt-8 scroll-mt-24">
      <div className="mb-4 rounded-xl bg-brand-category px-5 py-3">
        <div className="font-bold text-brand-text">{category.title}</div>
        {category.subtitle && (
          <div className="mt-1 text-sm font-normal text-brand-textsoft">
            {category.subtitle}
          </div>
        )}
      </div>

      {category.looseProducts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {category.looseProducts.map((p) => (
            <ProductCard key={p.id} product={p} onOpen={onOpen} />
          ))}
        </div>
      )}

      {category.subgroups.map((sub, i) => (
        <div key={i} className="mt-4">
          <div className="mb-3 w-fit rounded-lg bg-slate-500 px-3.5 py-1.5 text-sm font-bold text-white">
            {sub.title}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {sub.products.map((p) => (
              <ProductCard key={p.id} product={p} onOpen={onOpen} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
