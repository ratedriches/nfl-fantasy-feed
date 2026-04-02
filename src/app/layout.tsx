import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NFL Fantasy Feed",
  description: "Beat writer tweets for all 32 NFL teams",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-gray-950 text-white">{children}</body>
    </html>
  );
}
