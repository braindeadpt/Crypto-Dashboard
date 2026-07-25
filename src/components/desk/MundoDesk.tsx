"use client";

import { ActHead } from "@/components/board/boardShared";
import { CaseEffectStage } from "@/components/cases/CaseEffectStage";
import { ExpertiseGate } from "@/components/expertise/ExpertiseGate";
import { useExpertise } from "@/components/expertise/ExpertiseProvider";
import { useWatchlist } from "@/components/watchlist/WatchlistProvider";
import { SectorRotationChart } from "@/components/sectors/SectorRotationChart";
import { SectorTreemap } from "@/components/sectors/SectorTreemap";
import { Regua } from "@/components/instrument/Regua";
import { casesForSector, sectorsForAsset } from "@/lib/cases/sectorsLink";
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
 * MUNDO — Case & Effect is the centrepiece; sectors answer where capital rotates.
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
  const [focusCaseId, setFocusCaseId] = useState<string | null>(null);

  const selected =
    sectors.thematic.find((s) => s.id === selectedId) ??
    sectors.mega.find((s) => s.id === selectedId) ??
    null;
  const rotation = sectors.rotation.find((r) => r.id === selectedId);
  const ctx = selectedId ? sectors.changeContext[selectedId] : null;
  const reading = loc === "pt" ? sectors.readingPt : sectors.readingEn;

  const orderedCases = useMemo(() => {
    const list = [...cases].sort((a, b) => {
      const aw = watchedIds.has(a.assetId) ? 1 : 0;
      const bw = watchedIds.has(b.assetId) ? 1 : 0;
      if (bw !== aw) return bw - aw;
      return Math.abs(b.change24h) - Math.abs(a.change24h);
    });
    const limit = show("boardSecondary") ? 8 : 5;
    return list.slice(0, limit);
  }, [cases, watchedIds, show]);

  const linkedCases = useMemo(() => {
    if (!selectedId) return [];
    return casesForSector(selectedId, sectors, orderedCases);
  }, [selectedId, sectors, orderedCases]);

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
        <p className="mt-3 text-meta text-faint">{tCase("correlationNote")}</p>
      </header>

      {/* —— CENTREPIECE: Caso & Efeito —— */}
      <div className="board-act mt-8">
        <ActHead title={t("casesTitle")} note={t("casesActNote")} />
        <ExpertiseGate section="readings">
          <p className="mb-4 max-w-2xl text-meta text-muted">{t("casesHint")}</p>
        </ExpertiseGate>

        {orderedCases.length === 0 ? (
          <p className="text-muted">{tCase("empty")}</p>
        ) : (
          <>
            <nav
              className="scroll-x mb-4 flex gap-2 border border-line bg-bg-elevated p-2"
              aria-label={t("casesNav")}
            >
              {orderedCases.map((c) => {
                const active = focusCaseId === c.id || (!focusCaseId && c === orderedCases[0]);
                return (
                  <a
                    key={c.id}
                    href={`#${c.id}`}
                    onClick={() => setFocusCaseId(c.id)}
                    className={`shrink-0 border px-3 py-2 text-label transition ${
                      active
                        ? "border-accent bg-accent-dim text-accent"
                        : "border-transparent text-faint hover:text-muted"
                    } ${watchedIds.has(c.assetId) ? "ring-1 ring-accent/40" : ""}`}
                  >
                    {c.symbol}{" "}
                    <span className={deltaClass(c.change24h)}>
                      {formatPct(c.change24h)}
                    </span>
                  </a>
                );
              })}
            </nav>

            <div className="space-y-6">
              {orderedCases.map((c) => (
                <CaseEffectStage
                  key={c.id}
                  caseFile={c}
                  relatedSectors={sectorsForAsset(c.assetId, sectors)}
                  onSelectSector={(id) => {
                    selectSector(id);
                    document
                      .getElementById("mundo-sectores")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* —— Where capital rotates — linked to cases —— */}
      <div className="board-act mt-12" id="mundo-sectores">
        <ActHead title={t("sectorsTitle")} note={t("sectorsActNote")} />
        <ExpertiseGate section="readings">
          <p className="mb-3 max-w-2xl text-meta text-muted">{t("sectorsHint")}</p>
        </ExpertiseGate>

        <ExpertiseGate section="readings">
          <section className="panel-secondary mb-5 p-4">
            <p className="text-label text-faint">{t("readingLabel")}</p>
            <p className="mt-2 max-w-3xl text-body text-ink text-balance">
              {reading}
            </p>
          </section>
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

        {selectedId && linkedCases.length > 0 && (
          <div className="mt-4 border border-accent/30 bg-accent-dim/20 p-4">
            <p className="text-label text-accent">{t("linkedCasesTitle")}</p>
            <p className="mt-1 text-meta text-faint">{t("linkedCasesHint")}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {linkedCases.map((c) => (
                <li key={c.id}>
                  <a
                    href={`#${c.id}`}
                    className="border border-line bg-surface px-2.5 py-1.5 text-meta hover:border-accent"
                  >
                    {c.symbol}{" "}
                    <span className={deltaClass(c.change24h)}>
                      {formatPct(c.change24h)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

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
              {t("shareDelta7d")}:{" "}
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
              {coins.slice(0, show("sectorTable") ? 12 : 6).map((c) => {
                const match = orderedCases.find((x) => x.assetId === c.id);
                return (
                  <li
                    key={c.id}
                    className="flex justify-between gap-2 py-2 text-sm"
                  >
                    <span className="font-medium">
                      {c.symbol}
                      {match && (
                        <a
                          href={`#${match.id}`}
                          className="ml-2 text-label text-accent"
                        >
                          {t("seeCase")}
                        </a>
                      )}
                    </span>
                    <span className={`font-mono ${deltaClass(c.change24h)}`}>
                      {c.change24h >= 0 ? "▲" : "▼"} {formatPct(c.change24h)}
                    </span>
                  </li>
                );
              })}
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

      {/* Quiet reference — movers without duplicating the case stage */}
      <ExpertiseGate section="tapeExtended">
        <p className="mt-10 text-meta text-faint">
          {t("moversFootnote", {
            n: market.movers.gainers.length + market.movers.losers.length,
          })}
        </p>
      </ExpertiseGate>
    </div>
  );
}
