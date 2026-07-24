"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/format";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "./LanguageToggle";

const LINKS = [
  { href: "/", key: "board" as const },
  { href: "/mercado", key: "market" as const },
  { href: "/graficos", key: "charts" as const },
  { href: "/etf", key: "etf" as const },
  { href: "/sentimento", key: "sentiment" as const },
  { href: "/defi", key: "defi" as const },
  { href: "/yields", key: "yields" as const },
  { href: "/memes", key: "memes" as const },
  { href: "/lab", key: "lab" as const },
];

export function SiteHeader() {
  const t = useTranslations("nav");
  const meta = useTranslations("meta");
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/92 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 section-pad py-2.5">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center border border-accent/35 bg-accent-dim font-mono text-[0.65rem] font-semibold text-accent">
            CC
          </span>
          <span className="leading-tight">
            <span className="block text-[0.92rem] font-semibold tracking-tight text-ink">
              CLAREZA <span className="text-accent">Crypto</span>
            </span>
            <span className="block font-mono text-[0.58rem] uppercase tracking-[0.12em] text-faint">
              {meta("tagline")}
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 font-mono text-[0.62rem] uppercase tracking-wider text-faint sm:inline-flex">
            <span className="live-dot" />
            {t("operator")}
          </span>
          <LanguageToggle />
        </div>
      </div>
      <nav
        className="mx-auto flex max-w-[1400px] gap-0 overflow-x-auto border-t border-line section-pad"
        aria-label="Navegação"
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
                "shrink-0 border-b-2 px-3 py-2 font-mono text-[0.66rem] uppercase tracking-[0.08em] transition",
                active
                  ? "border-accent text-accent"
                  : "border-transparent text-faint hover:text-muted",
              )}
            >
              {t(link.key)}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  const meta = useTranslations("meta");
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-2 section-pad py-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-semibold text-ink">
            CLAREZA <span className="text-accent">Crypto</span>
          </p>
          <p className="mt-1 max-w-xl text-sm text-muted">{meta("disclaimer")}</p>
        </div>
        <p className="font-mono text-[0.62rem] uppercase tracking-wider text-faint">
          Read-only · Sem custódia · Modelo de liquidação estimado
        </p>
      </div>
    </footer>
  );
}
