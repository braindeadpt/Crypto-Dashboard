import { IBM_Plex_Mono, IBM_Plex_Sans, Sora } from "next/font/google";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { themeBootstrapScript } from "@/lib/theme";
import "./globals.css";

/**
 * O Observatório — three families, three jobs (see src/app/design-system.md).
 * Loaded via next/font (self-hosted at build time; no Google runtime requests).
 *
 * Display is Sora: geometric, wide-aperture, forward-looking. An editorial
 * serif here read as newspaper — wrong century for a market instrument.
 */
const display = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
  adjustFontFallback: true,
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
