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
  // Renomeações IA v2 — slugs antigos → novos
  { from: "mundo", to: "casos" },
  { from: "contexto", to: "aprender" },
  { from: "instrumento", to: "mesa" },
  { from: "carteira", to: "ferramentas" },
  // Aliases históricos → /casos
  { from: "sectores", to: "casos" },
  { from: "memes", to: "casos" },
  { from: "caso", to: "casos" },
  // Aliases históricos → /fluxos
  { from: "liquidez", to: "fluxos" },
  { from: "sentimento", to: "fluxos" },
  { from: "yields", to: "fluxos" },
  { from: "etf", to: "fluxos" },
  // Aliases históricos → /aprender
  { from: "lab", to: "aprender" },
  { from: "atlas", to: "aprender" },
  { from: "ciclo", to: "aprender" },
  { from: "portugal", to: "aprender" },
  // Aliases históricos → /mesa
  { from: "graficos", to: "mesa" },
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
  experimental: {
    // View transitions nativas (React <ViewTransition>) entre páginas.
    viewTransition: true,
  },
  async redirects() {
    return LEGACY_ALIASES.map(({ from, to }) => ({
      source: `/:locale(pt|en)/${from}`,
      destination: `/:locale/${to}`,
      permanent: true,
    }));
  },
};

export default withNextIntl(nextConfig);
