// Version: 1.0
// Title: Category Section | Important Data: renders category header + subcategory
// dividers + 4-column product grid (2 on mobile), matching original Index.html layout.

import { CategoryGroup } from '@/lib/catalog';
import ProductCard from './ProductCard';

export default function CategorySection({ category }: { category: CategoryGroup }) {
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
            <ProductCard key={p.id} product={p} />
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
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
