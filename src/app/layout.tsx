import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CLAREZA Crypto — Command center cripto",
  description:
    "Centro de comando cripto para decisões com dados ao vivo: mercado, sentimento, ciclo e educação — PT-PT e EN.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={`${sans.variable} ${mono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
