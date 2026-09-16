"use client";

import { Link } from "@/i18n/navigation";
import type { RegimeResult } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";

/**
 * R3 — o score de regime explica-se a si próprio.
 *
 * Lista todos os sinais que o motor avaliou: os que somaram stress (com a
 * regra que disparou), os que foram medidos e ficaram a zero, e os que
 * faltaram — declarados como lacuna, nunca estimados. Fecha com o link para
 * a metodologia publicada, onde a mesma tabela de regras é a fonte.
 */
export function RegimeDecomposition({
  regime,
  defaultOpen = false,
}: {
  regime: RegimeResult;
  defaultOpen?: boolean;
}) {
  const t = useTranslations("regimeDecomp");
  const locale = useLocale();
  const isPt = locale === "pt";
  const signals = regime.signals ?? [];
  if (!signals.length) return null;

  const active = signals.filter((s) => s.points > 0).length;
  const missing = signals.filter((s) => s.status === "missing").length;

  return (
    <details
      className="group/decomp mt-3 border border-line"
      open={defaultOpen || undefined}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-label text-muted transition hover:text-ink">
        <span>
          {t("summary", { active, total: signals.length })}
          {missing > 0 && (
            <span className="ml-2 text-warn">
              {t("missingCount", { count: missing })}
            </span>
          )}
        </span>
        <span
          aria-hidden
          className="font-mono text-faint transition-transform group-open/decomp:rotate-180"
        >
          ▾
        </span>
      </summary>

      <ul className="border-t border-line">
        {signals.map((s) => {
          const isMissing = s.status === "missing";
          return (
            <li
              key={s.id}
              className="flex items-baseline justify-between gap-3 border-b border-line/60 px-3 py-1.5 last:border-0"
            >
              <span className="min-w-0">
                <span className={isMissing ? "text-faint" : "text-ink"}>
                  {isPt ? s.labelPt : s.labelEn}
                </span>
                {isMissing ? (
                  <span className="ml-2 text-meta text-warn">
                    {t("missing")}
                  </span>
                ) : (
                  s.detailPt != null && (
                    <span className="ml-2 text-meta text-faint">
                      {isPt ? s.detailPt : s.detailEn}
                    </span>
                  )
                )}
              </span>
              <span
                className={`shrink-0 font-mono tabular-nums ${
                  s.points > 0 ? "text-warn" : "text-faint"
                }`}
              >
                {isMissing ? "—" : s.points > 0 ? `+${s.points}` : "0"}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="border-t border-line px-3 py-2 text-meta">
        <Link
          href="/metodologia#regime"
          className="text-accent-2 transition hover:text-accent"
        >
          {t("howLink")}
        </Link>
      </p>
    </details>
  );
}
