// Version: 1.0
// Title: Next.js Config | Important Data: adds the HTTP security headers the
// app was missing entirely (found during the pre-public-launch security
// review) - no CSP, no clickjacking protection, no HSTS, nothing. The CSP
// below is scoped to the actual external resources this app uses client-side
// (checked directly, not guessed):
//  - script-src allows exactly one inline script via its sha256 hash - the
//    theme-flash-prevention script in app/layout.tsx. If that script's exact
//    text ever changes, this hash must be recomputed or the theme init will
//    silently stop running (falls back to light mode, no visible error).
//  - style-src needs 'unsafe-inline' because the codebase uses React's
//    style={{...}} prop extensively (dynamic gradients etc.) - those render
//    as inline style="" attributes, which CSP style-src governs. This is a
//    much lower-risk allowance than script-src unsafe-inline would be.
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

const THEME_SCRIPT_HASH = "'sha256-BtXmztwt2bpZ807buKIMmL7bwFdPyAVVINZYQDtVuzM='";
const SUPABASE_URL = "https://viqmlpipgzrfulbauotv.supabase.co";

const csp = [
  "default-src 'self'",
  `script-src 'self' ${THEME_SCRIPT_HASH}`,
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
