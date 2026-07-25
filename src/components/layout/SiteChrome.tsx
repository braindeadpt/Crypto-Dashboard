"use client";

import { ExpertiseDial } from "@/components/expertise/ExpertiseDial";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/format";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";

/**
 * Primary destinations — depth over breadth.
 * `wallet` is reserved (VISION) — shown disabled so the IA already has a slot.
 */
const LINKS: {
  href: "/" | "/mundo" | "/fluxos" | "/contexto" | "/instrumento";
  key: "now" | "world" | "flows" | "context" | "instrument";
}[] = [
  { href: "/", key: "now" },
  { href: "/mundo", key: "world" },
  { href: "/fluxos", key: "flows" },
  { href: "/contexto", key: "context" },
  { href: "/instrumento", key: "instrument" },
];

export function SiteHeader() {
  const t = useTranslations("nav");
  const meta = useTranslations("meta");
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-line bg-bg-elevated">
      <div className="obs-shell flex items-center justify-between gap-2 section-pad py-2.5 sm:gap-4 sm:py-3">
        <Link href="/" className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center border border-line-strong bg-surface text-label font-medium text-accent sm:h-8 sm:w-8"
            aria-hidden
          >
            CC
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block font-display text-[1.05rem] leading-tight text-ink sm:text-title">
              CLAREZA{" "}
              <span className="text-accent">Crypto</span>
            </span>
            <span className="site-chrome__brand-tag text-label text-faint">
              {meta("tagline")}
            </span>
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <ExpertiseDial compact />
          <ThemeToggle />
          <LanguageToggle />
        </div>
      </div>
      <nav
        className="obs-shell scroll-x flex gap-0 border-t border-line section-pad"
        aria-label={t("aria")}
      >
        {LINKS.map((link) => {
          const active =
            link.href === "/"
              ? pathname === "/"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "shrink-0 border-b-2 px-3 py-2.5 text-label transition",
                active
                  ? "border-accent text-accent"
                  : "border-transparent text-faint hover:text-muted",
              )}
            >
              {t(link.key)}
            </Link>
          );
        })}
        {/* Reserved slot — VISION Carteira (read-only address paste). Not built yet. */}
        <span
          className="shrink-0 cursor-default border-b-2 border-transparent px-3 py-2.5 text-label text-faint/50"
          title={t("walletSoon")}
          aria-disabled="true"
        >
          {t("wallet")}
          <span className="ml-1 text-[0.65rem] uppercase tracking-wider">
            {t("soon")}
          </span>
        </span>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  const meta = useTranslations("meta");
  const t = useTranslations("chrome");
  return (
    <footer className="w-full border-t border-line bg-bg-elevated">
      <div className="obs-shell flex flex-col gap-3 section-pad py-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-title text-ink">
            CLAREZA <span className="text-accent">Crypto</span>
          </p>
          <p className="mt-2 max-w-xl text-meta text-muted">{meta("disclaimer")}</p>
          <p className="mt-3">
            <Link href="/estilo" className="text-label text-faint hover:text-accent">
              {t("styleGuide")}
            </Link>
          </p>
        </div>
        <p className="text-label text-faint">{t("footerNote")}</p>
      </div>
    </footer>
  );
}
