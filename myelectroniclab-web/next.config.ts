// Version: 1.1
// Title: Next.js Config | Change from v1.0: FIX - the hash-only script-src
// broke the entire site (every page stuck forever on app/loading.tsx,
// nothing ever hydrated) - deployed, caught it live via the browser, and
// reverted this part immediately. Root cause: Next.js's App Router injects
// its OWN inline <script> tags for streaming/hydration (the
// `self.__next_f.push(...)` payloads), not just the one theme-init script I
// hashed - a hash-source only CSP has no way to allow those since they don't
// match any listed hash, and per the CSP spec 'unsafe-inline' is ignored
// entirely once ANY hash-source is present (that's for old-browser
// fallback only, modern browsers that understand hashes drop unsafe-inline
// the moment a hash-source exists) - so combining them doesn't work either.
// script-src is 'self' 'unsafe-inline' now (no hash) as an immediate fix;
// the secure correct fix is a per-request nonce generated in proxy.ts
// (middleware, not next.config.ts, since headers() here is static/built
// once) that Next.js auto-applies to its own inline scripts - noted as a
// follow-up, not worth blocking the emergency revert on getting it exactly
// right in one pass. Important Data: adds the HTTP security headers the
// app was missing entirely (found during the pre-public-launch security
// review) - no CSP, no clickjacking protection, no HSTS, nothing. The CSP
// below is scoped to the actual external resources this app uses client-side
// (checked directly, not guessed):
//  - style-src needs 'unsafe-inline' because the codebase uses React's
//    style={{...}} prop extensively (dynamic gradients etc.) - those render
//    as inline style="" attributes, which CSP style-src governs.
//  - connect-src allows the Supabase project URL (all reads/writes go
//    through supabase-js) and api.iconify.design (@iconify/react fetches
//    icon data from there at runtime - confirmed by how many solar:* icons
//    render across the app; without this every icon breaks).
//  - img-src allows any https: host + data: - the admin "add product" form
//    accepts a pasted image URL with no host restriction (currently all 152
//    product images happen to be on Cloudinary, but nothing stops an admin
//    from pasting a different host), so locking img-src to one CDN would
//    silently break future product images.
// OpenAI/Resend/AliExpress calls happen server-side only (API routes), so
// they never touch this CSP - browser CSP only governs requests the page
// itself initiates.

import type { NextConfig } from "next";

const SUPABASE_URL = "https://viqmlpipgzrfulbauotv.supabase.co";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data:",
  "font-src 'self'",
  `connect-src 'self' ${SUPABASE_URL} https://api.iconify.design`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
};

export default nextConfig;
