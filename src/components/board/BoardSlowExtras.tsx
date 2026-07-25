"use client";

import { Link } from "@/i18n/navigation";
import type { DexFrenzySnapshot } from "@/lib/data/dex";
import type { EtfSnapshot } from "@/lib/data/etf";
import { deltaClass, formatPct, formatUsd, formatUsdMillions } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";

/**
 * Streamed after the core board: ETF scrape + DEX frenzy (can be slow).
 */
export function BoardSlowExtras({
  etf,
  dex,
}: {
  etf: EtfSnapshot | null;
  dex: DexFrenzySnapshot | null;
}) {
  const t = useTranslations("board");
  const locale = useLocale();

  return (
    <div className="mx-auto w-full max-w-[1400px] section-pad pb-10">
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="border border-line bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-faint">
              {t("etfSpot")}
            </h2>
            <Link
              href="/fluxos"
              className="font-mono text-[0.65rem] uppercase text-accent"
            >
              {t("openEtf")} →
            </Link>
          </div>
          {etf ? (
            <>
              {etf.stale && etf.btc.latest && (
                <p className="mt-1 font-mono text-[0.6rem] text-warn">
                  {locale === "pt"
                    ? `Snapshot · fluxos de ${etf.btc.latest.dateLabel}`
                    : `Snapshot · flows from ${etf.btc.latest.dateLabel}`}
                </p>
              )}
              <p className="mt-2 text-sm text-muted">
                {locale === "pt" ? etf.signal.spotBidPt : etf.signal.spotBidEn}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <EtfMini
                  label="BTC"
                  value={etf.btc.latest?.totalUsdM}
                  sum5={etf.btc.sum5dUsdM}
                />
                <EtfMini
                  label="ETH"
                  value={etf.eth.latest?.totalUsdM}
                  sum5={etf.eth.sum5dUsdM}
                />
                <EtfMini
                  label="SOL"
                  value={etf.sol?.latest?.totalUsdM}
                  sum5={etf.sol?.sum5dUsdM}
                />
              </div>
              <p className="mt-2 font-mono text-[0.6rem] text-faint">
                {t("etfAfterClose")}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">{t("etfUnavailable")}</p>
          )}
        </section>

        <section className="border border-line bg-surface p-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-faint">
              {t("dexFrenzy")}
            </h2>
            <Link
              href="/mundo"
              className="font-mono text-[0.65rem] uppercase text-accent"
            >
              {t("memes")} →
            </Link>
          </div>
          <p className="mt-1 font-mono text-[0.58rem] text-faint">
            {t("dexNotCg")}
          </p>
          {dex?.notePt && (
            <p className="mt-2 text-sm text-muted">
              {locale === "pt" ? dex.notePt : dex.noteEn}
            </p>
          )}
          <ul className="mt-3 space-y-1.5">
            {(dex?.items ?? []).slice(0, 6).map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="truncate font-medium">
                  {m.symbol}{" "}
                  <span className="font-mono text-[0.6rem] text-faint">
                    {m.chainId}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-xs tabular-nums">
                  {m.priceUsd != null ? formatUsd(m.priceUsd) : "—"}{" "}
                  {m.change24h != null && (
                    <span className={deltaClass(m.change24h)}>
                      {formatPct(m.change24h)}
                    </span>
                  )}
                </span>
              </li>
            ))}
            {!dex?.items?.length && (
              <li className="text-sm text-muted">{t("noMemes")}</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

function EtfMini({
  label,
  value,
  sum5,
}: {
  label: string;
  value?: number | null;
  sum5?: number | null;
}) {
  const t = useTranslations("board");
  if (value == null) {
    return (
      <div className="border border-line/80 bg-bg-elevated p-2">
        <p className="font-mono text-[0.58rem] text-faint">{label}</p>
        <p className="mt-0.5 text-sm text-muted">—</p>
      </div>
    );
  }
  return (
    <div className="border border-line/80 bg-bg-elevated p-2">
      <p className="font-mono text-[0.58rem] text-faint">{label} · 1d</p>
      <p
        className={`mt-0.5 font-mono text-base font-medium tabular-nums ${
          value > 0 ? "text-up" : value < 0 ? "text-down" : "text-muted"
        }`}
      >
        {formatUsdMillions(value)}
      </p>
      {sum5 != null && (
        <p
          className={`font-mono text-[0.62rem] tabular-nums ${
            sum5 >= 0 ? "text-up" : "text-down"
          }`}
        >
          5d {formatUsdMillions(sum5)} · {t("etfUnit")}
        </p>
      )}
    </div>
  );
}
