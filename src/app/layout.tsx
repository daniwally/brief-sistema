import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { Sidebar } from "@/components/layout/sidebar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brief Sistema - WTF Agency",
  description: "Sistema de facturación y gastos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex bg-gray-50/80">
        <Sidebar />
        <main className="flex-1 min-w-0 p-6 lg:p-8 overflow-x-hidden overflow-y-auto">{children}</main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
