import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Legacy aliases → canonical destinations (E7).
 * Permanent (308) via next.config — before render, not soft page redirects.
 *
 * Kept as real pages (unique content):
 * - /atlas/[slug] — concept articles
 * - /caso/[id] — case detail
 * - /brief — ritual bookmark (same card as Agora, intentional URL)
 */
const LEGACY_ALIASES: ReadonlyArray<{ from: string; to: string }> = [
  // → /mundo
  { from: "sectores", to: "mundo" },
  { from: "memes", to: "mundo" },
  { from: "caso", to: "mundo" },
  { from: "mercado", to: "mundo" },
  // → /fluxos
  { from: "liquidez", to: "fluxos" },
  { from: "sentimento", to: "fluxos" },
  { from: "defi", to: "fluxos" },
  { from: "yields", to: "fluxos" },
  { from: "etf", to: "fluxos" },
  // → /contexto
  { from: "lab", to: "contexto" },
  { from: "atlas", to: "contexto" },
  { from: "ciclo", to: "contexto" },
  { from: "portugal", to: "contexto" },
  // → /instrumento
  { from: "graficos", to: "instrumento" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /**
   * O Playwright usa baseURL 127.0.0.1 e, em local, reutiliza o dev server.
   * Em dev o Next bloqueia recursos a origens diferentes de localhost, o que
   * impedia a hidratação nessa origem — teclas premidas eram descartadas e o
   * teste do dial falhava sem que a aplicação tivesse defeito.
   */
  allowedDevOrigins: ["127.0.0.1"],
  async redirects() {
    return LEGACY_ALIASES.map(({ from, to }) => ({
      source: `/:locale(pt|en)/${from}`,
      destination: `/:locale/${to}`,
      permanent: true,
    }));
  },
};

export default withNextIntl(nextConfig);
