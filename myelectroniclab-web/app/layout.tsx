// Version: 1.4
// Title: Root Layout | Important Data: uses system font stack (no next/font/google
// build-time fetch dependency). Includes a blocking inline script that sets
// html[data-theme] BEFORE paint, based on localStorage - prevents a flash of the
// wrong theme on load (the theme itself is managed by lib/theme-context.tsx).
// FIX v1.3: explicit m-0/p-0 on body (belt-and-suspenders alongside globals.css
// reset) - eliminates default browser body margin (8px in most browsers) that
// was causing a visible gap/seam above the header.
// FIX v1.4: renders <Footer /> once here (after children) so the copyright
// line appears on every route - public catalog, auth pages, admin, mentor,
// student areas - instead of only on "/" via AppShell. AppShell's own footer
// was removed in the same change to avoid a duplicate on the homepage.

import type { Metadata } from "next";
import "./globals.css";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "MyElectronicLab",
  description: "קטלוג רכיבי אלקטרוניקה לפרויקטי גמר",
  icons: {
    icon: "https://lh3.googleusercontent.com/d/1QOuhriqT5PyPaydnhuRK7ccPG2udhHT6",
  },
};

const themeInitScript = `
(function () {
  try {
    var saved = localStorage.getItem('myl_theme');
    var theme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="h-full antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="m-0 min-h-full flex flex-col p-0 font-sans">
        {children}
        <Footer />
      </body>
    </html>
  );
}
