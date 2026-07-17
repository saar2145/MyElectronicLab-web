// Version: 1.2
// Title: Root Layout | Important Data: uses system font stack (no next/font/google
// build-time fetch dependency). Includes a blocking inline script that sets
// html[data-theme] BEFORE paint, based on localStorage - prevents a flash of the
// wrong theme on load (the theme itself is managed by lib/theme-context.tsx).

import type { Metadata } from "next";
import "./globals.css";

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
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
