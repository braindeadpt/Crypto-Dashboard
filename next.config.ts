import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /**
   * O Playwright usa baseURL 127.0.0.1 e, em local, reutiliza o dev server.
   * Em dev o Next bloqueia recursos a origens diferentes de localhost, o que
   * impedia a hidratação nessa origem — teclas premidas eram descartadas e o
   * teste do dial falhava sem que a aplicação tivesse defeito.
   */
  allowedDevOrigins: ["127.0.0.1"],
};

export default withNextIntl(nextConfig);
