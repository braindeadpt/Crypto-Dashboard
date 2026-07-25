"use client";

import { ExpertiseGate } from "@/components/expertise/ExpertiseGate";
import { useExpertise } from "@/components/expertise/ExpertiseProvider";
import { useWatchlist } from "@/components/watchlist/WatchlistProvider";
import { SectorRotationChart } from "@/components/sectors/SectorRotationChart";
import { SectorTreemap } from "@/components/sectors/SectorTreemap";
import { Regua } from "@/components/instrument/Regua";
import { Link } from "@/i18n/navigation";
import type { SectorsSnapshot } from "@/lib/data/sectors";
import { deltaClass, formatPct, formatUsd } from "@/lib/format";
import type { CaseFile, MarketSnapshot } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useMemo, useState } from "react";

type CoinRow = {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  image: string;
};

type Props = {
  sectors: SectorsSnapshot;
  market: MarketSnapshot;
  cases: CaseFile[];
};

/**
 * MUNDO — sectors, rotation, movers + Case & Effect.
 * Depth destination (not a thin table page).
 */
export function MundoDesk({ sectors, market, cases }: Props) {
  const t = useTranslations("mundo");
  const tCase = useTranslations("case");
  const locale = useLocale();
  const loc = locale === "pt" ? "pt" : "en";
  const { show } = useExpertise();
  const watch = useWatchlist();
  const watchedIds = useMemo(
    () => new Set(watch.assets.map((a) => a.id)),
    [watch.assets],
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rotWindow, setRotWindow] = useState<7 | 30>(7);
  const [coins, setCoins] = useState<CoinRow[] | null>(null);
  const [coinsLoading, setCoinsLoading] = useState(false);

  const selected =
    sectors.thematic.find((s) => s.id === selectedId) ??
    sectors.mega.find((s) => s.id === selectedId) ??
    null;
  const rotation = sectors.rotation.find((r) => r.id === selectedId);
  const ctx = selectedId ? sectors.changeContext[selectedId] : null;
  const reading = loc === "pt" ? sectors.readingPt : sectors.readingEn;

  const selectSector = useCallback((id: string | null) => {
    setSelectedId(id);
    if (!id) {
      setCoins(null);
      setCoinsLoading(false);
      return;
    }
    setCoinsLoading(true);
    setCoins(null);
    void fetch(`/api/sectors/coins?category=${encodeURIComponent(id)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("fail");
        const json = (await res.json()) as { coins: CoinRow[] };
        setCoins(json.coins ?? []);
      })
      .catch(() => setCoins([]))
      .finally(() => setCoinsLoading(false));
  }, []);

  return (
    <div className="mx-auto w-full max-w-[1400px] section-pad pb-16 pt-6 enter">
      <header className="max-w-3xl">
        <p className="text-label text-faint">{t("eyebrow")}</p>
        <h1 className="mt-1 font-display text-display text-ink">{t("title")}</h1>
        <ExpertiseGate section="readings">
          <p className="mt-2 text-body text-muted">{t("subtitle")}</p>
        </ExpertiseGate>
      </header>

      <ExpertiseGate section="readings">
        <section className="panel-hero mt-5 p-4 md:p-5">
          <p className="text-label text-faint">{t("readingLabel")}</p>
          <p className="mt-2 max-w-3xl text-body text-ink text-balance">{reading}</p>
        </section>
      </ExpertiseGate>

      {/* Case & Effect — featured; watchlist cases first when moving */}
      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-title text-ink">{t("casesTitle")}</h2>
            <ExpertiseGate section="readings">
              <p className="text-meta text-muted">{t("casesHint")}</p>
            </ExpertiseGate>
          </div>
        </div>
        {cases.length === 0 ? (
          <p className="text-muted">{tCase("empty")}</p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {[...cases]
              .sort((a, b) => {
                const aw = watchedIds.has(a.assetId) ? 1 : 0;
                const bw = watchedIds.has(b.assetId) ? 1 : 0;
                return bw - aw;
              })
              .slice(0, show("boardSecondary") ? 8 : 4)
              .map((c) => (
              <li key={c.id}>
                <Link
                  href={`/caso/${c.id}`}
                  className={`panel-secondary flex h-full items-center justify-between gap-4 p-4 transition hover:border-accent/40 ${
                    watchedIds.has(c.assetId) ? "border-accent/35" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-title">
                      {c.symbol}
                      {watchedIds.has(c.assetId) ? (
                        <span className="ml-2 text-label text-accent">·</span>
                      ) : null}
                    </p>
                    <p className="mt-1 truncate text-meta text-muted">
                      {locale === "pt"
                        ? c.unclear
                          ? tCase("unclear")
                          : c.hypotheses[0]?.labelPt
                        : c.unclear
                          ? tCase("unclear")
                          : c.hypotheses[0]?.labelEn}
                    </p>
                  </div>
                  <p className={`shrink-0 text-data ${deltaClass(c.change24h)}`}>
                    {c.change24h >= 0 ? "▲" : "▼"} {formatPct(c.change24h)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Market movers */}
      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <MoverBlock
          title={t("gainers")}
          items={market.movers.gainers.slice(0, show("tapeExtended") ? 5 : 3)}
        />
        <MoverBlock
          title={t("losers")}
          items={market.movers.losers.slice(0, show("tapeExtended") ? 5 : 3)}
        />
      </section>

      {/* Sectors map */}
      <section className="mt-10">
        <h2 className="font-display text-title text-ink">{t("sectorsTitle")}</h2>
        <ExpertiseGate section="readings">
          <p className="mb-3 text-meta text-muted">{t("sectorsHint")}</p>
        </ExpertiseGate>
        {sectors.mega.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {sectors.mega.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => selectSector(selectedId === m.id ? null : m.id)}
                className={`border px-2.5 py-1.5 text-meta ${
                  selectedId === m.id
                    ? "border-accent bg-accent-dim text-accent"
                    : "border-line text-muted"
                }`}
              >
                {m.name}{" "}
                <span className={deltaClass(m.change24h)}>
                  {m.change24h >= 0 ? "▲" : "▼"} {formatPct(m.change24h)}
                </span>
              </button>
            ))}
          </div>
        )}
        <SectorTreemap
          sectors={sectors.thematic}
          selectedId={selectedId}
          onSelect={selectSector}
          locale={loc}
        />
      </section>

      <ExpertiseGate section="rotation30d">
        <section className="mt-8">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-label text-faint">{t("rotationTitle")}</h2>
            <div className="flex gap-1">
              {([7, 30] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setRotWindow(w)}
                  className={`border px-2.5 py-1 text-label ${
                    rotWindow === w
                      ? "border-accent bg-accent-dim text-accent"
                      : "border-line text-faint"
                  }`}
                >
                  {w}d
                </button>
              ))}
            </div>
          </div>
          <SectorRotationChart
            rotation={sectors.rotation}
            window={rotWindow}
            selectedId={selectedId}
            onSelect={selectSector}
            locale={loc}
          />
        </section>
      </ExpertiseGate>

      {selected && (
        <section className="panel-secondary mt-6 p-4">
          <div className="flex justify-between gap-3">
            <h3 className="font-display text-title">{selected.name}</h3>
            <button
              type="button"
              className="text-label text-accent"
              onClick={() => selectSector(null)}
            >
              {t("close")}
            </button>
          </div>
          <p className="mt-1 text-data text-muted">
            {formatUsd(selected.marketCap, true)} ·{" "}
            <span className={deltaClass(selected.change24h)}>
              {selected.change24h >= 0 ? "▲" : "▼"}{" "}
              {formatPct(selected.change24h)}
            </span>
          </p>
          <ExpertiseGate section="reguaExpanded">
            <Regua context={ctx} variant="expanded" locale={loc} className="mt-3" />
          </ExpertiseGate>
          {rotation && show("tapeExtended") && (
            <p className="mt-2 text-meta text-faint">
              Δ quota 7d:{" "}
              {rotation.shareDelta7d != null
                ? `${rotation.shareDelta7d >= 0 ? "+" : ""}${rotation.shareDelta7d.toFixed(2)} pp`
                : "—"}
            </p>
          )}
          {coinsLoading && (
            <p className="mt-3 text-meta text-muted">{t("loadingCoins")}</p>
          )}
          {coins && coins.length > 0 && (
            <ul className="mt-3 divide-y divide-line">
              {coins.slice(0, show("sectorTable") ? 12 : 6).map((c) => (
                <li
                  key={c.id}
                  className="flex justify-between gap-2 py-2 text-sm"
                >
                  <span className="font-medium">{c.symbol}</span>
                  <span className={`font-mono ${deltaClass(c.change24h)}`}>
                    {c.change24h >= 0 ? "▲" : "▼"} {formatPct(c.change24h)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <ExpertiseGate section="sectorTable">
        <section className="mt-8 overflow-x-auto border border-line">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-line bg-bg-elevated text-label text-faint">
                <th className="px-3 py-2">{t("colSector")}</th>
                <th className="px-3 py-2">24h</th>
                <th className="px-3 py-2">{t("colShare")}</th>
              </tr>
            </thead>
            <tbody>
              {sectors.thematic.map((s) => (
                <tr
                  key={s.id}
                  className="cursor-pointer border-b border-line/70 hover:bg-surface"
                  onClick={() => selectSector(s.id)}
                >
                  <td className="px-3 py-2 font-medium">{s.name}</td>
                  <td className={`px-3 py-2 font-mono ${deltaClass(s.change24h)}`}>
                    {formatPct(s.change24h)}
                  </td>
                  <td className="px-3 py-2 font-mono">{s.sharePct.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </ExpertiseGate>
    </div>
  );
}

function MoverBlock({
  title,
  items,
}: {
  title: string;
  items: MarketSnapshot["movers"]["gainers"];
}) {
  return (
    <div className="panel-secondary p-3">
      <h3 className="text-label text-faint">{title}</h3>
      <ul className="mt-2 space-y-1.5">
        {items.map((m) => (
          <li key={m.id} className="flex justify-between text-sm">
            <Link href={`/caso/${m.caseId}`} className="font-medium hover:text-accent">
              {m.symbol}
            </Link>
            <span className={`font-mono ${deltaClass(m.change24h)}`}>
              {m.change24h >= 0 ? "▲" : "▼"} {formatPct(m.change24h)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
