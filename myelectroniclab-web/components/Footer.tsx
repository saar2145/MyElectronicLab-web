// Version: 1.1
// Title: Global Footer | Change from v1.0: UI/UX refinement pass (visual only)
// - added a hairline top border so the footer reads as an intentional band on
// every page instead of trailing text, and a touch more line-height. Important
// Data: rendered once from app/layout.tsx so it appears on every route (public
// catalog, auth pages, admin, mentor, student areas) without each page needing
// to render it itself. Content ported verbatim from the copyright block that
// used to live only inside AppShell.tsx (removed there in the same change to
// avoid a duplicate on "/"). pb-24 (not a smaller value) is intentional: on the
// homepage the fixed FAB buttons (bottom-4) float over the page bottom, and
// this padding keeps them from visually sitting on top of the footer text when
// scrolled all the way down.

export default function Footer() {
  return (
    <footer className="mt-4 border-t border-brand-category/60 pt-5 pb-24 text-center text-xs leading-relaxed text-brand-textsoft">
      <div className="opacity-60">כל הזכויות שמורות. © 2026 MyElectronicLab</div>
      <div className="mt-1 opacity-30">By Saar Cohen</div>
    </footer>
  );
}
