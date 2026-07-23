"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/format";
import { useTranslations } from "next-intl";
import { ExpertiseDial } from "./ExpertiseDial";
import { LanguageToggle } from "./LanguageToggle";

const LINKS = [
  { href: "/", key: "home" as const },
  { href: "/mercado", key: "market" as const },
  { href: "/sentimento", key: "sentiment" as const },
  { href: "/ciclo", key: "cycle" as const },
  { href: "/defi", key: "defi" as const },
  { href: "/atlas", key: "atlas" as const },
  { href: "/brief", key: "brief" as const },
  { href: "/portugal", key: "portugal" as const },
  { href: "/lab", key: "lab" as const },
];

export function SiteHeader() {
  const t = useTranslations("nav");
  const meta = useTranslations("meta");
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 section-pad py-3">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center border border-accent/35 bg-accent-dim font-mono text-[0.7rem] font-semibold tracking-tight text-accent">
            CC
          </span>
          <span className="leading-tight">
            <span className="block text-[0.95rem] font-semibold tracking-tight text-ink">
              CLAREZA <span className="text-accent">Crypto</span>
            </span>
            <span className="block font-mono text-[0.62rem] uppercase tracking-[0.12em] text-faint">
              {meta("tagline")}
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          {isHome ? (
            <a
              href="#access"
              className="hidden border border-accent/35 bg-accent-dim px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-accent transition hover:bg-accent hover:text-bg sm:inline-flex"
            >
              {t("access")}
            </a>
          ) : (
            <Link
              href="/mercado"
              className="hidden border border-accent/35 bg-accent-dim px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-accent transition hover:bg-accent hover:text-bg sm:inline-flex"
            >
              {t("market")}
            </Link>
          )}
          <ExpertiseDial />
          <LanguageToggle />
        </div>
      </div>
      <nav
        className="mx-auto flex max-w-7xl gap-0 overflow-x-auto border-t border-line section-pad"
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
                "shrink-0 border-b-2 px-3 py-2.5 font-mono text-[0.68rem] uppercase tracking-[0.08em] transition",
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
      <div className="mx-auto flex max-w-7xl flex-col gap-3 section-pad py-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-semibold text-ink">
            CLAREZA <span className="text-accent">Crypto</span>
          </p>
          <p className="mt-1 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-faint">
            {meta("tagline")}
          </p>
          <p className="mt-3 max-w-xl text-sm text-muted">{meta("disclaimer")}</p>
        </div>
        <p className="font-mono text-[0.65rem] text-faint">
          SYS · READ-ONLY · NO CUSTODY
        </p>
      </div>
    </footer>
  );
}
