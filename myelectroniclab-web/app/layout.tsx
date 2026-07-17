// Version: 1.0
// Title: Root Layout | Important Data: uses system font stack (no next/font/google
// build-time fetch dependency) - more reliable builds, matches the Arial/Heebo
// stack used in the original Index.html.

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyElectronicLab",
  description: "קטלוג רכיבי אלקטרוניקה לפרויקטי גמר",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
