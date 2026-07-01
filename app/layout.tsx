import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { AppToaster } from "@/components/providers/toaster";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "greek", "greek-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kartex Αποθήκη",
  description: "Εφαρμογή αποθήκης Kartex",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kartex Αποθήκη",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A1628",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="el" className={`${inter.variable} h-full`}>
      <body className={`${inter.className} min-h-dvh bg-kartex-navy text-white antialiased`}>
        {children}
        <AppToaster />
      </body>
    </html>
  );
}
