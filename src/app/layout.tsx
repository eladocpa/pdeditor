import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "עורך PDF | חתימות, טקסט ותמונות",
  description: "עורך PDF מקוון - הוסיפו חתימות, טקסט, תאריכים ותמונות לקבצי PDF בקלות",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
