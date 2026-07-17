// Version: 1.1
// Title: Root Layout | Important Data: uses system font stack (no next/font/google
// build-time fetch dependency) - more reliable builds, matches the Arial/Heebo
// stack used in the original Index.html. Favicon matches the original site's icon.

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MyElectronicLab",
  description: "קטלוג רכיבי אלקטרוניקה לפרויקטי גמר",
  icons: {
    icon: "https://lh3.googleusercontent.com/d/1QOuhriqT5PyPaydnhuRK7ccPG2udhHT6",
  },
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
