// Version: 1.1
// Title: Route Loading UI | Change from v1.0: redesigned per the user's
// reference mockup - full-bleed dark backdrop (not theme-aware, same
// reasoning as v1.0: this shows before the theme preference can even be read
// from localStorage), large centered site banner (same image as
// components/Banner.tsx) with a soft blue glow, thin looping gradient
// progress bar (animation defined in globals.css as .loading-bar-fill),
// faint "By Saar Cohen" credit at the bottom. Purely visual - Next.js still
// only renders this for exactly as long as page.tsx's Server Component fetch
// takes; nothing here adds delay. Important Data: Next.js App Router
// convention - automatically shown while page.tsx's async Server Component
// is fetching data.

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-7" style={{ background: '#111827' }}>
      <div className="w-[min(480px,82vw)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://lh3.googleusercontent.com/d/1-a1wyruaEH7ijcTd3_po5WJuHF64IMZ5"
          alt="MyElectronicLab"
          className="block h-auto w-full rounded-2xl"
          style={{ filter: 'drop-shadow(0 0 18px rgba(41, 182, 246, 0.25))' }}
        />
      </div>

      <div className="h-[3px] w-[min(300px,60vw)] overflow-hidden rounded-full bg-[rgba(255,255,255,0.08)]">
        <div className="loading-bar-fill h-full rounded-full" style={{ background: 'linear-gradient(90deg, #1565C0, #29B6F6)' }} />
      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.65rem] tracking-wide text-[rgba(255,255,255,0.18)]">
        By Saar Cohen
      </div>
    </div>
  );
}
