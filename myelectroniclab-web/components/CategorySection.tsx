// Version: 2.2
// Title: Category Section | Change from v2.1: renders GridItem entries that
// are a BlankSlot (admin-placed empty grid cell, see lib/catalog.ts v1.1) as
// an invisible same-size placeholder instead of a ProductCard - this is what
// lets an admin control where the responsive grid wraps to a new row. Change
// from v2.0: UI/UX refinement pass (visual only) - category header gets a
// subtle border + left accent bar instead of a flat fill, subgroup pill uses
// the brand gradient instead of generic slate-500. Important Data: passes
// onOpen (product click handler) down to every ProductCard so clicking opens
// the ProductModal.

import { CategoryGroup, GridItem, GroupedProduct } from '@/lib/catalog';
import ProductCard from './ProductCard';

function GridCell({ item, onOpen }: { item: GridItem; onOpen: (p: GroupedProduct) => void }) {
  if ('kind' in item) {
    return <div aria-hidden className="pointer-events-none" />;
  }
  return <ProductCard product={item} onOpen={onOpen} />;
}

export default function CategorySection({
  category,
  onOpen,
}: {
  category: CategoryGroup;
  onOpen: (p: GroupedProduct) => void;
}) {
  return (
    <section id={category.id} className="mt-8 scroll-mt-24">
      <div
        className="mb-4 rounded-xl border border-black/5 bg-brand-category px-5 py-3 shadow-sm"
        style={{ borderInlineEndWidth: 3, borderInlineEndColor: 'var(--header-grad-from)' }}
      >
        <div className="font-bold text-brand-text">{category.title}</div>
        {category.subtitle && (
          <div className="mt-1 text-sm font-normal text-brand-textsoft">
            {category.subtitle}
          </div>
        )}
      </div>

      {category.looseProducts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {category.looseProducts.map((item) => (
            <GridCell key={'kind' in item ? item.key : item.id} item={item} onOpen={onOpen} />
          ))}
        </div>
      )}

      {category.subgroups.map((sub, i) => (
        <div key={i} className="mt-4">
          <div
            className="mb-3 w-fit rounded-lg px-3.5 py-1.5 text-sm font-bold text-white shadow-sm"
            style={{ background: 'linear-gradient(135deg, var(--header-grad-from), var(--header-grad-to))' }}
          >
            {sub.title}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {sub.products.map((item) => (
              <GridCell key={'kind' in item ? item.key : item.id} item={item} onOpen={onOpen} />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
