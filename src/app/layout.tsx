import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConvexProvider } from "convex/react";
import { convex } from "@/lib/vitta/convex-client";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VITTA ERP — Enterprise Business Suite",
  description:
    "VITTA is a proprietary, all-in-one ERP suite: CRM, Sales, Purchase, Inventory, Accounting, HR, Projects, Manufacturing and more. © 2025 VITTA Labs. All rights reserved.",
  keywords: ["VITTA", "ERP", "business software", "CRM", "accounting", "inventory", "proprietary"],
  authors: [{ name: "VITTA Labs Pvt. Ltd." }],
  icons: {
    icon: "/favicon.svg",
  },
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ConvexProvider client={convex}>{children}</ConvexProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
