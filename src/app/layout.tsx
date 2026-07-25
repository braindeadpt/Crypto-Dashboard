import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { themeBootstrapScript } from "@/lib/theme";
import "./globals.css";

/**
 * O Observatório — three families, three jobs (see src/app/design-system.md).
 * Loaded via next/font (self-hosted at build time; no Google runtime requests).
 */
const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: true,
  axes: ["SOFT", "WONK", "opsz"],
});

const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
  adjustFontFallback: true,
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "CLAREZA Crypto — Observatório de mercado",
  description:
    "Observatório de mercado crypto para operadores: preços, derivados, liquidações ao vivo, DeFi e contexto — PT-PT.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt"
      data-theme="light"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
