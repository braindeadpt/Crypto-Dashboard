"use client";

import { LiveLiquidations } from "@/components/board/LiveLiquidations";
import {
  ActHead,
  EtfMini,
  ExpandedMetric,
  LiveStatus,
  MoverCol,
  Panel,
  Row,
  TapeItem,
} from "@/components/board/boardShared";
import { PriceChart } from "@/components/charts/PriceChart";
import { Regua } from "@/components/instrument/Regua";
import { useWatchlist } from "@/components/watchlist/WatchlistProvider";
import { useExpertise } from "@/components/expertise/ExpertiseProvider";
import { useHistoryContexts } from "@/components/history/MetricHistoryHint";
import { Link } from "@/i18n/navigation";
import type { DerivativesSnapshot } from "@/lib/data/derivatives";
import type { DexFrenzySnapshot } from "@/lib/data/dex";
import type { EtfSnapshot } from "@/lib/data/etf";
import type { MempoolFees } from "@/lib/data/mempool";
import { deltaClass, formatPct, formatUsd, formatUsdMillions } from "@/lib/format";
import type {
  DefiSnapshot,
  MarketSnapshot,
  RegimeResult,
  SentimentSnapshot,
  TrendingCoin,
} from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { useBoardRefresh } from "@/lib/hooks/useBoardRefresh";
import { useLiveTicker } from "@/lib/hooks/useLiveTicker";

export type YieldPool = {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
  stablecoin: boolean;
};

type Props = {
  market: MarketSnapshot;
  sentiment: SentimentSnapshot;
  regime: RegimeResult;
  defi: DefiSnapshot | null;
  yields: YieldPool[];
  etf: EtfSnapshot | null;
  derivs: DerivativesSnapshot | null;
  dex: DexFrenzySnapshot | null;
  trending: TrendingCoin[];
  mempool: MempoolFees | null;
};

/**
 * Nível 3 — o instrumento completo. Saiu da entrada; vive em /instrumento.
 */
export function InstrumentDesk({
  market,
  sentiment,
  regime,
  defi,
  yields,
  etf,
  derivs,
  dex,
  trending,
  mempool,
}: Props) {
  const t = useTranslations("board");
  const ti = useTranslations("instrumento");
  const locale = useLocale();
  const watch = useWatchlist();
  const [symbol, setSymbol] = useState<"BTCUSDT" | "ETHUSDT" | "SOLUSDT">(
    "BTCUSDT",
  );
  const [interval, setInterval] = useState<"15m" | "1h" | "4h" | "1d">("1h");

  const sol = market.top.find((a) => a.id === "solana");
  const green = market.top.filter((a) => a.change24h >= 0).length;
  const breadth = market.top.length
    ? Math.round((green / market.top.length) * 100)
    : 0;
  const topContributors = (regime.contributors ?? []).slice(0, 4);

  const btcPerp = derivs?.btc;
  const ethPerp = derivs?.eth;
  const solPerp = derivs?.sol;

  const live = useLiveTicker({
    BTCUSDT: { price: market.btc.price, change24h: market.btc.change24h },
    ETHUSDT: { price: market.eth.price, change24h: market.eth.change24h },
    ...(sol
      ? { SOLUSDT: { price: sol.price, change24h: sol.change24h } }
      : {}),
  });
  useBoardRefresh();
  const hist = useHistoryContexts();
  const histLocale = locale === "pt" ? "pt" : "en";
  const { show } = useExpertise();

  const btcPx = live.quotes.BTCUSDT?.price ?? market.btc.price;
  const btcChg = live.quotes.BTCUSDT?.change24h ?? market.btc.change24h;
  const ethPx = live.quotes.ETHUSDT?.price ?? market.eth.price;
  const ethChg = live.quotes.ETHUSDT?.change24h ?? market.eth.change24h;
  const solPx = live.quotes.SOLUSDT?.price ?? sol?.price;
  const solChg = live.quotes.SOLUSDT?.change24h ?? sol?.change24h;

  return (
    <div className="mx-auto w-full max-w-[1400px] section-pad pb-16 pt-3 enter">
      <header className="mb-3">
        <p className="text-label text-faint">{ti("eyebrow")}</p>
        <h1 className="font-display text-title text-ink">{ti("title")}</h1>
        <p className="mt-1 max-w-2xl text-meta text-muted">{ti("subtitle")}</p>
      </header>

      {/* TAPE completa */}
      <div className="scroll-x flex items-center gap-0 border border-line bg-bg-elevated">
        <LiveStatus
          connection={live.connection}
          lastUpdate={live.lastUpdate}
          labelLive={t("live")}
          labelConnecting={t("liveConnecting")}
          labelReconnecting={t("liveReconnecting")}
          labelOffline={t("liveOffline")}
        />
        <TapeItem
          label="BTC"
          value={formatUsd(btcPx)}
          change={btcChg}
          flashKey={btcPx}
        />
        <TapeItem
          label="ETH"
          value={formatUsd(ethPx)}
          change={ethChg}
          flashKey={ethPx}
        />
        {solPx != null && solChg != null && (
          <TapeItem
            label="SOL"
            value={formatUsd(solPx)}
            change={solChg}
            flashKey={solPx}
          />
        )}
        {watch.quotes
          .filter((q) => !["bitcoin", "ethereum", "solana"].includes(q.id))
          .slice(0, 6)
          .map((q) => (
            <TapeItem
              key={q.id}
              label={q.symbol}
              value={formatUsd(q.price)}
              change={q.change24h}
              flashKey={q.price}
              watched
            />
          ))}
        <TapeItem
          label="MCAP"
          value={formatUsd(market.global.totalMarketCap, true)}
          change={market.global.marketCapChange24h}
        />
        <TapeItem
          label="BTC.D"
          value={`${market.global.btcDominance.toFixed(1)}%`}
          history={hist.btc_dominance}
          historyLocale={histLocale}
        />
        <TapeItem
          label="F&G"
          value={String(sentiment.fearGreed.value)}
          history={hist.fear_greed}
          historyLocale={histLocale}
        />
        {etf?.btc.latest && (
          <TapeItem
            label="ETF BTC"
            value={formatUsdMillions(etf.btc.latest.totalUsdM, 0)}
            change={etf.btc.latest.totalUsdM}
            changeIsAbs
            history={hist.etf_btc_flow}
            historyLocale={histLocale}
          />
        )}
        {btcPerp && (
          <TapeItem
            label="FUND BTC"
            value={`${(btcPerp.fundingRate * 100).toFixed(4)}%`}
            history={hist.funding_btc}
            historyLocale={histLocale}
            historyStretched
          />
        )}
        {btcPerp && (
          <TapeItem
            label="OI BTC"
            value={formatUsd(btcPerp.openInterestUsd, true)}
            history={hist.oi_btc}
            historyLocale={histLocale}
          />
        )}
        {mempool && (
          <TapeItem
            label="FEE BTC"
            value={`${mempool.fastestFee} sat`}
            history={hist.fee_btc}
            historyLocale={histLocale}
          />
        )}
        <TapeItem
          label="BREADTH"
          value={`${breadth}%`}
          history={hist.breadth}
          historyLocale={histLocale}
        />
        {hist.vol_realized_btc && show("tapeExtended") && (
          <TapeItem
            label="VOL R"
            value={`${hist.vol_realized_btc.valor.toFixed(0)}%`}
            history={hist.vol_realized_btc}
            historyLocale={histLocale}
          />
        )}
        {hist.volume_btc && show("tapeExtended") && (
          <TapeItem
            label="VOL $"
            value={formatUsd(hist.volume_btc.valor, true)}
            history={hist.volume_btc}
            historyLocale={histLocale}
          />
        )}
        <TapeItem label="STRESS" value={`${regime.score}`} />
      </div>

      {/* Grelha de réguas */}
      <div className="board-act">
        <ActHead title={ti("acts.whereTitle")} note={ti("acts.whereNote")} />
        <section className="panel-secondary p-3 md:p-4">
          <h2 className="sr-only">{ti("acts.rulerSr")}</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ExpandedMetric
              label="Funding BTC"
              value={
                btcPerp ? `${(btcPerp.fundingRate * 100).toFixed(4)}%` : "—"
              }
              history={hist.funding_btc}
              locale={histLocale}
              stretched
            />
            <ExpandedMetric
              label="Fear & Greed"
              value={String(sentiment.fearGreed.value)}
              history={hist.fear_greed}
              locale={histLocale}
            />
            <ExpandedMetric
              label={ti("labels.breadth")}
              value={`${breadth}%`}
              history={hist.breadth}
              locale={histLocale}
            />
            <ExpandedMetric
              label="OI BTC"
              value={btcPerp ? formatUsd(btcPerp.openInterestUsd, true) : "—"}
              history={hist.oi_btc}
              locale={histLocale}
            />
            <ExpandedMetric
              label="ETF BTC"
              value={
                etf?.btc.latest
                  ? formatUsdMillions(etf.btc.latest.totalUsdM, 0)
                  : "—"
              }
              history={hist.etf_btc_flow}
              locale={histLocale}
            />
            <ExpandedMetric
              label={ti("labels.realizedVol")}
              value={
                hist.vol_realized_btc
                  ? `${hist.vol_realized_btc.valor.toFixed(1)}%`
                  : "—"
              }
              history={hist.vol_realized_btc}
              locale={histLocale}
            />
            <ExpandedMetric
              label="TVL DeFi"
              value={defi ? formatUsd(defi.totalTvl, true) : "—"}
              history={hist.tvl}
              locale={histLocale}
            />
            <ExpandedMetric
              label={ti("labels.btcFee")}
              value={mempool ? `${mempool.fastestFee} sat/vB` : "—"}
              history={hist.fee_btc}
              locale={histLocale}
            />
          </div>
        </section>
      </div>

      {/* Spot vs alavancagem */}
      <div className="board-act">
        <ActHead title={ti("acts.moneyTitle")} note={ti("acts.moneyNote")} />
        <section className="panel-secondary p-3 md:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-label text-faint">{t("spotVsLev")}</h2>
            <p className="text-meta text-faint">{t("spotVsLevHint")}</p>
          </div>
          <div className={`mt-3 grid gap-3 ${etf ? "lg:grid-cols-2" : ""}`}>
            {etf && (
              <div className="border border-line bg-bg-elevated p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-[0.62rem] uppercase text-faint">
                    {t("etfSpot")}
                  </p>
                  <Link
                    href="/fluxos"
                    className="font-mono text-[0.62rem] text-accent"
                  >
                    →
                  </Link>
                </div>
                <p className="mt-2 text-sm leading-snug text-ink">
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
                    sum5={etf.sol?.sum5dUsdM ?? null}
                  />
                </div>
                {hist.etf_btc_flow && (
                  <div className="mt-3">
                    <Regua
                      context={hist.etf_btc_flow}
                      variant="expanded"
                      locale={histLocale}
                      label="ETF BTC · 90d"
                    />
                  </div>
                )}
                <p className="mt-2 font-mono text-[0.58rem] text-faint">
                  {t("etfAfterClose")}
                </p>
              </div>
            )}

            <div className="border border-line bg-bg-elevated p-3">
              <p className="font-mono text-[0.62rem] uppercase text-faint">
                {t("leverageBlock")}
              </p>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead>
                    <tr className="font-mono text-[0.58rem] uppercase text-faint">
                      <th className="py-1 pr-2">Asset</th>
                      <th className="py-1 pr-2">Funding</th>
                      <th className="py-1 pr-2">OI Δ24h</th>
                      <th className="py-1">L/S</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[btcPerp, ethPerp, solPerp].filter(Boolean).map((p) => (
                      <tr key={p!.symbol} className="border-t border-line/70">
                        <td className="py-1.5 pr-2 font-medium">
                          {p!.symbol.replace("USDT", "")}
                        </td>
                        <td className="py-1.5 pr-2 font-mono tabular-nums">
                          {(p!.fundingRate * 100).toFixed(4)}%
                        </td>
                        <td
                          className={`py-1.5 pr-2 font-mono tabular-nums ${
                            p!.oiChange24hPct != null
                              ? deltaClass(p!.oiChange24hPct)
                              : ""
                          }`}
                        >
                          {p!.oiChange24hPct != null
                            ? formatPct(p!.oiChange24hPct)
                            : "—"}
                        </td>
                        <td className="py-1.5 font-mono tabular-nums">
                          {p!.longShortRatio != null
                            ? p!.longShortRatio.toFixed(2)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {hist.funding_btc && (
                <div className="mt-3">
                  <Regua
                    context={hist.funding_btc}
                    variant="expanded"
                    locale={histLocale}
                    stretched
                    label="Funding BTC · 90d"
                  />
                </div>
              )}
              <p className="mt-2 font-mono text-[0.58rem] text-faint">
                {t("lsHint")}
              </p>
            </div>
          </div>
          {!etf && (
            <p className="mt-3 text-sm text-muted">{t("etfUnavailable")}</p>
          )}
        </section>
      </div>

      {/* Preço de perto + derivados */}
      <div className="board-act">
        <ActHead title={ti("acts.priceTitle")} note={ti("acts.priceNote")} />
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,0.85fr)]">
          <section className="min-w-0 self-start border border-line bg-surface lum-panel">
            <div className="grid grid-cols-1 items-center gap-2 border-b border-line px-3 py-2 sm:grid-cols-[1fr_auto_1fr]">
              <div className="flex flex-wrap gap-1 sm:justify-self-start">
                {(["BTCUSDT", "ETHUSDT", "SOLUSDT"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSymbol(s)}
                    className={`font-mono px-2 py-1 text-[0.65rem] uppercase tracking-wider ${
                      symbol === s
                        ? "bg-accent-dim text-accent border border-accent/30"
                        : "text-faint border border-transparent hover:text-muted"
                    }`}
                  >
                    {s.replace("USDT", "")}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 sm:justify-self-center">
                {(["15m", "1h", "4h", "1d"] as const).map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    onClick={() => setInterval(tf)}
                    className={`font-mono px-2 py-1 text-[0.65rem] uppercase ${
                      interval === tf
                        ? "text-accent"
                        : "text-faint hover:text-muted"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
              <span className="font-mono text-[0.65rem] uppercase tracking-wider text-faint sm:justify-self-end">
                {ti("chartHint")}
              </span>
            </div>
            <PriceChart symbol={symbol} interval={interval} height={340} />
          </section>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <Panel title={t("derivatives")} href="/fluxos">
              <Row
                label="OI BTC"
                value={formatUsd(sentiment.openInterest.value, true)}
              />
              {hist.oi_btc && (
                <Regua
                  context={hist.oi_btc}
                  variant="expanded"
                  locale={histLocale}
                  className="my-2"
                />
              )}
              {sentiment.openInterest.change24hPct != null && (
                <Row
                  label="OI Δ24h"
                  value={formatPct(sentiment.openInterest.change24hPct)}
                />
              )}
              <Row
                label={t("postureLabel")}
                value={t(`posture.${regime.posture}`)}
              />
              <Row label={t("stressLabel")} value={`${regime.score}`} />
              {topContributors.length > 0 && (
                <div className="mt-2 border-t border-line pt-2">
                  <p className="mb-1 font-mono text-[0.58rem] uppercase tracking-wider text-faint">
                    {t("stressDrivers")}
                  </p>
                  <ul className="space-y-1">
                    {topContributors.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-baseline justify-between gap-2 text-sm"
                      >
                        <span className="truncate text-muted">
                          {locale === "pt" ? c.labelPt : c.labelEn}
                          <span className="ml-1 font-mono text-[0.58rem] text-faint">
                            {c.detail}
                          </span>
                        </span>
                        <span className="shrink-0 font-mono tabular-nums text-warn">
                          +{c.points}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Panel>

            <LiveLiquidations compact />
          </div>
        </div>
      </div>

      {/* Mercado amplo */}
      <div className="board-act">
        <ActHead title={ti("acts.wideTitle")} note={ti("acts.wideNote")} />
        <div className={`grid gap-3 ${dex ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
          <Panel title={t("movers")} href="/mundo">
            <div className="grid grid-cols-2 gap-3">
              <MoverCol
                title={t("gainers")}
                items={market.movers.gainers.slice(0, 5)}
                watchedIds={watch.assets.map((a) => a.id)}
              />
              <MoverCol
                title={t("losers")}
                items={market.movers.losers.slice(0, 5)}
                watchedIds={watch.assets.map((a) => a.id)}
              />
            </div>
            {watch.quotes.length > 0 && (
              <div className="mt-3 border-t border-line pt-3">
                <p className="mb-2 text-label text-accent">{t("watchMovers")}</p>
                <ul className="space-y-1.5">
                  {[...watch.quotes]
                    .sort(
                      (a, b) => Math.abs(b.change24h) - Math.abs(a.change24h),
                    )
                    .slice(0, 6)
                    .map((q) => (
                      <li
                        key={q.id}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <Link
                          href={
                            Math.abs(q.change24h) >= 3
                              ? `/caso/case-${q.id}`
                              : "/mundo"
                          }
                          className="font-medium hover:text-accent"
                        >
                          {q.symbol}
                        </Link>
                        <span
                          className={`text-data tabular-nums ${deltaClass(q.change24h)}`}
                        >
                          {formatPct(q.change24h)}
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </Panel>

          {dex && (
            <Panel title={t("dexFrenzy")} href="/mundo">
              <p className="mb-2 border border-accent/25 bg-accent-dim px-2 py-1.5 font-mono text-[0.65rem] text-accent">
                {locale === "pt" ? dex.notePt : dex.noteEn}
              </p>
              <ul className="space-y-1.5">
                {dex.items.slice(0, 6).map((m) => (
                  <li key={m.id} className="flex justify-between gap-2 text-sm">
                    <a
                      href={m.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate font-medium hover:text-accent"
                    >
                      {m.symbol}
                      <span className="ml-1 font-mono text-[0.58rem] text-faint">
                        {m.chainId}
                      </span>
                    </a>
                    <span
                      className={`font-mono tabular-nums ${
                        m.change24h != null
                          ? deltaClass(m.change24h)
                          : "text-muted"
                      }`}
                    >
                      {m.change24h != null ? formatPct(m.change24h) : "—"}
                    </span>
                  </li>
                ))}
                {!dex.items.length && (
                  <p className="text-sm text-muted">{t("noMemes")}</p>
                )}
              </ul>
              <p className="mt-2 font-mono text-[0.58rem] text-faint">
                {t("dexNotCg")}
              </p>
            </Panel>
          )}

          <Panel title={t("yields")} href="/fluxos">
            <ul className="space-y-1.5">
              {yields.slice(0, 6).map((y) => (
                <li key={y.pool} className="text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="truncate font-medium">
                      {y.project} · {y.symbol}
                    </span>
                    <span className="font-mono tabular-nums text-accent">
                      {y.apy.toFixed(1)}%
                    </span>
                  </div>
                  <p className="font-mono text-[0.62rem] text-faint">
                    {y.chain} · TVL {formatUsd(y.tvlUsd, true)}
                    {y.stablecoin ? " · stable" : ""}
                    {y.apyReward != null && y.apyReward > 0
                      ? ` · reward ${y.apyReward.toFixed(1)}%`
                      : ""}
                  </p>
                </li>
              ))}
              {yields.length === 0 && (
                <p className="text-sm text-muted">{t("noYields")}</p>
              )}
            </ul>
            <p className="mt-2 font-mono text-[0.58rem] text-faint">
              {t("yieldsSortHint")}
            </p>
          </Panel>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <Panel title={t("trendingRetail")}>
            <p className="mb-2 font-mono text-[0.58rem] text-faint">
              {t("trendingHint")}
            </p>
            <ul className="space-y-1.5">
              {trending.slice(0, 7).map((c) => (
                <li key={c.id} className="flex justify-between gap-2 text-sm">
                  <span>
                    <span className="font-medium">{c.symbol}</span>
                    <span className="ml-2 text-faint">{c.name}</span>
                  </span>
                  <span
                    className={`font-mono tabular-nums ${
                      c.change24h != null
                        ? deltaClass(c.change24h)
                        : "text-muted"
                    }`}
                  >
                    {c.change24h != null ? formatPct(c.change24h) : "—"}
                  </span>
                </li>
              ))}
              {trending.length === 0 && (
                <p className="text-sm text-muted">{t("noTrending")}</p>
              )}
            </ul>
          </Panel>

          {defi && (
            <Panel title={t("defiPulse")} href="/fluxos">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="font-mono text-[0.58rem] text-faint">TVL</p>
                  <p className="font-mono text-xl font-medium">
                    {formatUsd(defi.totalTvl, true)}
                  </p>
                  <Regua
                    context={hist.tvl}
                    variant="inline"
                    locale={histLocale}
                    className="mt-1"
                  />
                  {defi.change1d != null && (
                    <p
                      className={`font-mono text-xs ${deltaClass(defi.change1d)}`}
                    >
                      {formatPct(defi.change1d)} 1d
                    </p>
                  )}
                </div>
                <div>
                  <p className="font-mono text-[0.58rem] text-faint">
                    {t("fees24h")}
                  </p>
                  <p className="font-mono text-xl font-medium">
                    {defi.fees24h != null ? formatUsd(defi.fees24h, true) : "—"}
                  </p>
                  {defi.feesChange1d != null && (
                    <p
                      className={`font-mono text-xs ${deltaClass(defi.feesChange1d)}`}
                    >
                      {formatPct(defi.feesChange1d)} 1d
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 border-t border-line pt-3">
                <p className="font-mono text-[0.58rem] uppercase text-faint">
                  {t("pegWatch")}
                </p>
                {defi.pegWatch.length === 0 ? (
                  <p className="mt-1 text-sm text-muted">{t("pegOk")}</p>
                ) : (
                  <ul className="mt-1 space-y-1">
                    {defi.pegWatch.map((s) => (
                      <li
                        key={s.symbol}
                        className="flex justify-between text-sm"
                      >
                        <span>{s.symbol}</span>
                        <span
                          className={`font-mono tabular-nums ${
                            s.pegDeviation != null && s.pegDeviation < 0
                              ? "text-down"
                              : "text-warn"
                          }`}
                        >
                          {s.pegDeviation != null
                            ? formatPct(s.pegDeviation)
                            : "—"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}
