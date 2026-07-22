// Version: 1.1
// Title: Category Sidebar | Change from v1.0: UI/UX refinement pass (visual
// only, no behavior change) - hover state gets a left accent bar + soft
// background instead of a flat bg-brand-bg swap. Important Data: fixed right
// sidebar, smooth-scroll to category anchors, hidden on mobile (<768px) -
// matches original Index.html sidebar.

'use client';

import { CategoryGroup } from '@/lib/catalog';

export default function Sidebar({ categories }: { categories: CategoryGroup[] }) {
  function scrollTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const headerOffset = 90;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  if (categories.length === 0) return null;

  return (
    <nav className="fixed top-[250px] right-4 z-40 hidden max-h-[calc(100vh-270px)] w-64 overflow-y-auto rounded-2xl bg-brand-cardbg shadow-md ring-1 ring-black/5 md:block">
      <div className="border-b border-brand-category px-4 py-3 text-xs font-bold tracking-wide text-brand-textsoft">
        קטגוריות
      </div>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => scrollTo(cat.id)}
          className="block w-full truncate border-e-2 border-transparent px-4 py-2 text-right text-sm text-brand-text transition hover:border-e-brand-linktext hover:bg-brand-bg"
        >
          {cat.title}
        </button>
      ))}
    </nav>
  );
}
