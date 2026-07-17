// Version: 1.0
// Title: Route Loading UI | Important Data: Next.js App Router convention -
// automatically shown while page.tsx's async Server Component is fetching data.

export default function Loading() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4"
      style={{ background: 'linear-gradient(135deg, #1565C0 0%, #0842A0 100%)' }}
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      <p className="text-sm text-white/80">טוען את הקטלוג...</p>
    </div>
  );
}
