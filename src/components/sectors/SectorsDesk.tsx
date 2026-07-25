"use client";

import { Regua } from "@/components/instrument/Regua";
import { SectorRotationChart } from "@/components/sectors/SectorRotationChart";
import { SectorTreemap } from "@/components/sectors/SectorTreemap";
import type { SectorsSnapshot } from "@/lib/data/sectors";
import { deltaClass, formatPct, formatUsd } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useState } from "react";

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
  initial: SectorsSnapshot;
};

export function SectorsDesk({ initial }: Props) {
  const t = useTranslations("sectors");
  const locale = useLocale();
  const loc = locale === "pt" ? "pt" : "en";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rotWindow, setRotWindow] = useState<7 | 30>(7);
  const [coins, setCoins] = useState<CoinRow[] | null>(null);
  const [coinsLoading, setCoinsLoading] = useState(false);
  const [coinsError, setCoinsError] = useState<string | null>(null);

  const selected =
    initial.thematic.find((s) => s.id === selectedId) ??
    initial.mega.find((s) => s.id === selectedId) ??
    null;
  const rotation = initial.rotation.find((r) => r.id === selectedId);
  const ctx = selectedId ? initial.changeContext[selectedId] : null;

  const selectSector = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      if (!id) {
        setCoins(null);
        setCoinsError(null);
        setCoinsLoading(false);
        return;
      }
      setCoinsLoading(true);
      setCoinsError(null);
      setCoins(null);
      void fetch(`/api/sectors/coins?category=${encodeURIComponent(id)}`)
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json = (await res.json()) as { coins: CoinRow[] };
          setCoins(json.coins ?? []);
        })
        .catch(() => {
          setCoinsError(t("coinsError"));
        })
        .finally(() => {
          setCoinsLoading(false);
        });
    },
    [t],
  );

  const reading = loc === "pt" ? initial.readingPt : initial.readingEn;

  return (
    <div className="mx-auto w-full max-w-[1400px] section-pad pb-16 pt-6 enter">
      <header className="max-w-3xl">
        <p className="text-label text-faint">{t("eyebrow")}</p>
        <h1 className="mt-1 font-display text-display text-ink">{t("title")}</h1>
        <p className="mt-2 text-body text-muted">{t("subtitle")}</p>
      </header>

      {/* Automatic observation */}
      <section className="panel-hero mt-5 p-4 md:p-5" aria-live="polite">
        <p className="text-label text-faint">{t("readingLabel")}</p>
        <p className="mt-2 max-w-3xl text-body text-ink text-balance">{reading}</p>
        {initial.stale && (
          <p className="mt-2 text-meta text-warn">{t("stale")}</p>
        )}
        <p className="mt-2 text-meta text-faint">
          {t("historyDays", { days: initial.history.length })} · {t("source")}
        </p>
      </section>

      {/* Mega aside */}
      {initial.mega.length > 0 && (
        <section className="mt-4 flex flex-wrap gap-2">
          <span className="text-label text-faint self-center">{t("megaLabel")}</span>
          {initial.mega.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() =>
                selectSector(selectedId === m.id ? null : m.id)
              }
              className={`border px-2.5 py-1.5 text-meta tabular-nums ${
                selectedId === m.id
                  ? "border-accent bg-accent-dim text-accent"
                  : "border-line bg-surface text-muted"
              }`}
            >
              {m.name}{" "}
              <span className={deltaClass(m.change24h)}>
                {m.change24h >= 0 ? "▲" : "▼"} {formatPct(m.change24h)}
              </span>
            </button>
          ))}
        </section>
      )}

      {/* Treemap */}
      <section className="mt-5">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-label text-faint">{t("mapTitle")}</h2>
            <p className="text-meta text-muted">{t("mapHint")}</p>
          </div>
          <p className="text-meta text-faint">
            {t("mapLegend")}
          </p>
        </div>
        <SectorTreemap
          sectors={initial.thematic}
          selectedId={selectedId}
          onSelect={selectSector}
          locale={loc}
        />
      </section>

      {/* Rotation */}
      <section className="mt-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-label text-faint">{t("rotationTitle")}</h2>
            <p className="text-meta text-muted">{t("rotationHint")}</p>
          </div>
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
          rotation={initial.rotation}
          window={rotWindow}
          selectedId={selectedId}
          onSelect={selectSector}
          locale={loc}
        />
      </section>

      {/* Detail panel */}
      {selected && (
        <section className="panel-secondary mt-5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-title text-ink">{selected.name}</h2>
              <p className="mt-1 text-data tabular-nums text-muted">
                {formatUsd(selected.marketCap, true)} ·{" "}
                <span className={deltaClass(selected.change24h)}>
                  {selected.change24h >= 0 ? "▲" : "▼"}{" "}
                  {formatPct(selected.change24h)}
                </span>{" "}
                · {t("share", { pct: selected.sharePct.toFixed(1) })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => selectSector(null)}
              className="text-label text-accent"
            >
              {t("clear")}
            </button>
          </div>

          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-label text-faint">{t("changeContext")}</p>
              <Regua
                context={ctx}
                variant="expanded"
                locale={loc}
                className="mt-2"
              />
            </div>
            <div className="text-meta text-muted">
              {rotation && (
                <ul className="space-y-1">
                  <li>
                    Δ quota 7d:{" "}
                    <span className="tabular-nums text-ink">
                      {rotation.shareDelta7d != null
                        ? `${rotation.shareDelta7d >= 0 ? "+" : ""}${rotation.shareDelta7d.toFixed(2)} pp`
                        : "—"}
                    </span>
                  </li>
                  <li>
                    Δ quota 30d:{" "}
                    <span className="tabular-nums text-ink">
                      {rotation.shareDelta30d != null
                        ? `${rotation.shareDelta30d >= 0 ? "+" : ""}${rotation.shareDelta30d.toFixed(2)} pp`
                        : "—"}
                    </span>
                  </li>
                  <li>
                    Δ mcap 7d:{" "}
                    <span className="tabular-nums text-ink">
                      {rotation.mcapChange7d != null
                        ? formatPct(rotation.mcapChange7d)
                        : "—"}
                    </span>
                  </li>
                </ul>
              )}
              <p className="mt-2 text-faint">{t("observeOnly")}</p>
            </div>
          </div>

          <div className="mt-4 border-t border-line pt-3">
            <p className="text-label text-faint">{t("coinsTitle")}</p>
            {coinsLoading && (
              <p className="mt-2 text-meta text-muted">{t("coinsLoading")}</p>
            )}
            {coinsError && (
              <p className="mt-2 text-meta text-warn">{coinsError}</p>
            )}
            {coins && coins.length > 0 && (
              <ul className="mt-2 divide-y divide-line">
                {coins.slice(0, 12).map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={c.image}
                        alt=""
                        width={18}
                        height={18}
                        className="rounded-sm"
                      />
                      <span className="truncate font-medium">{c.symbol}</span>
                      <span className="truncate text-faint">{c.name}</span>
                    </span>
                    <span className="shrink-0 text-right font-mono tabular-nums">
                      <span className="text-ink">{formatUsd(c.price)}</span>
                      <span className={`ml-2 ${deltaClass(c.change24h)}`}>
                        {c.change24h >= 0 ? "▲" : "▼"} {formatPct(c.change24h)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {coins && coins.length === 0 && !coinsLoading && (
              <p className="mt-2 text-meta text-muted">{t("coinsEmpty")}</p>
            )}
          </div>
        </section>
      )}

      {/* Compact table for mobile scan */}
      <section className="mt-6 overflow-x-auto border border-line">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-line bg-bg-elevated text-label text-faint">
              <th className="px-3 py-2">{t("colSector")}</th>
              <th className="px-3 py-2">{t("colMcap")}</th>
              <th className="px-3 py-2">24h</th>
              <th className="px-3 py-2">{t("colShare")}</th>
              <th className="px-3 py-2">Δ7d</th>
            </tr>
          </thead>
          <tbody>
            {initial.thematic.map((s) => {
              const rot = initial.rotation.find((r) => r.id === s.id);
              return (
                <tr
                  key={s.id}
                  className={`cursor-pointer border-b border-line/70 hover:bg-surface ${
                    selectedId === s.id ? "bg-accent-dim" : ""
                  }`}
                  onClick={() =>
                    selectSector(selectedId === s.id ? null : s.id)
                  }
                >
                  <td className="px-3 py-2 font-medium">{s.name}</td>
                  <td className="px-3 py-2 font-mono tabular-nums">
                    {formatUsd(s.marketCap, true)}
                  </td>
                  <td
                    className={`px-3 py-2 font-mono tabular-nums ${deltaClass(s.change24h)}`}
                  >
                    {s.change24h >= 0 ? "▲" : "▼"} {formatPct(s.change24h)}
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums">
                    {s.sharePct.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums">
                    {rot?.shareDelta7d != null
                      ? `${rot.shareDelta7d >= 0 ? "+" : ""}${rot.shareDelta7d.toFixed(2)}`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
