import {
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Newsreader,
  Sora,
} from "next/font/google";
import type { ReactNode } from "react";
import type { Metadata } from "next";
import { themeBootstrapScript } from "@/lib/theme";
import { entryBootstrapScript } from "@/lib/motion";
import "./globals.css";

/**
 * O Observatório — four families, four jobs (see src/app/design-system.md).
 * Loaded via next/font (self-hosted at build time; no Google runtime requests).
 *
 * Display is Sora: geometric, wide-aperture, forward-looking.
 * Editorial voice is Newsreader: optical serif for the daily headline and
 * plate titles — the engraved-plate language of the observatory.
 */
const display = Sora({
  subsets: ["latin"],
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

const serif = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "CLAREZA Crypto — Observatório de mercado",
  description:
    "Observatório de mercado crypto para operadores: preços, derivados, liquidações ao vivo, DeFi e contexto — PT-PT.",
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt"
      data-theme="light"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${mono.variable} ${serif.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeBootstrapScript }}
        />
        <script
          dangerouslySetInnerHTML={{ __html: entryBootstrapScript }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
