"use client";

import { LiveLiquidations } from "@/components/board/LiveLiquidations";
import { PriceChart } from "@/components/charts/PriceChart";
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
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useBoardRefresh } from "@/lib/hooks/useBoardRefresh";
import {
  useLiveTicker,
  type LiveTickerConnection,
} from "@/lib/hooks/useLiveTicker";

type YieldPool = {
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

export function OperatorBoard({
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
  const locale = useLocale();
  const [symbol, setSymbol] = useState<"BTCUSDT" | "ETHUSDT" | "SOLUSDT">(
    "BTCUSDT",
  );
  const [interval, setInterval] = useState<"15m" | "1h" | "4h" | "1d">("1h");

  const sol = market.top.find((a) => a.id === "solana");
  const green = market.top.filter((a) => a.change24h >= 0).length;
  const breadth = market.top.length
    ? Math.round((green / market.top.length) * 100)
    : 0;

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

  const btcPx = live.quotes.BTCUSDT?.price ?? market.btc.price;
  const btcChg = live.quotes.BTCUSDT?.change24h ?? market.btc.change24h;
  const ethPx = live.quotes.ETHUSDT?.price ?? market.eth.price;
  const ethChg = live.quotes.ETHUSDT?.change24h ?? market.eth.change24h;
  const solPx = live.quotes.SOLUSDT?.price ?? sol?.price;
  const solChg = live.quotes.SOLUSDT?.change24h ?? sol?.change24h;

  return (
    <div className="mx-auto w-full max-w-[1400px] section-pad pb-16 pt-3 enter">
      {/* TAPE */}
      <div className="flex items-center gap-0 overflow-x-auto border border-line bg-bg-elevated">
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
        <TapeItem
          label="MCAP"
          value={formatUsd(market.global.totalMarketCap, true)}
          change={market.global.marketCapChange24h}
        />
        <TapeItem label="BTC.D" value={`${market.global.btcDominance.toFixed(1)}%`} />
        <TapeItem label="F&G" value={String(sentiment.fearGreed.value)} />
        {etf?.btc.latest && (
          <TapeItem
            label="ETF BTC"
            value={formatUsdMillions(etf.btc.latest.totalUsdM, 0)}
            change={etf.btc.latest.totalUsdM}
            changeIsAbs
          />
        )}
        {btcPerp && (
          <TapeItem
            label="FUND BTC"
            value={`${(btcPerp.fundingRate * 100).toFixed(4)}%`}
          />
        )}
        {ethPerp && (
          <TapeItem
            label="FUND ETH"
            value={`${(ethPerp.fundingRate * 100).toFixed(4)}%`}
          />
        )}
        {solPerp && (
          <TapeItem
            label="FUND SOL"
            value={`${(solPerp.fundingRate * 100).toFixed(4)}%`}
          />
        )}
        {btcPerp?.oiChange24hPct != null && (
          <TapeItem
            label="OI Δ BTC"
            value={formatPct(btcPerp.oiChange24hPct)}
            change={btcPerp.oiChange24hPct}
          />
        )}
        {btcPerp?.longShortRatio != null && (
          <TapeItem label="L/S BTC" value={btcPerp.longShortRatio.toFixed(2)} />
        )}
        {mempool && (
          <TapeItem label="FEE BTC" value={`${mempool.fastestFee} sat`} />
        )}
        <TapeItem label="STRESS" value={`${regime.score}`} />
        <TapeItem label="BREADTH" value={`${breadth}%`} />
      </div>

      {/* SPOT VS ALAVANCA */}
      <section className="mt-3 border border-line bg-surface p-3 md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-faint">
            {t("spotVsLev")}
          </h2>
          <p className="font-mono text-[0.6rem] text-faint">{t("spotVsLevHint")}</p>
        </div>
        <div className={`mt-3 grid gap-3 ${etf ? "lg:grid-cols-2" : ""}`}>
          {etf && (
            <div className="border border-line bg-bg-elevated p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[0.62rem] uppercase text-faint">
                  {t("etfSpot")}
                </p>
                <Link href="/etf" className="font-mono text-[0.62rem] text-accent">
                  →
                </Link>
              </div>
              <p className="mt-2 text-sm leading-snug text-ink">
                {locale === "pt" ? etf.signal.spotBidPt : etf.signal.spotBidEn}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <EtfMini label="BTC" value={etf.btc.latest?.totalUsdM} sum5={etf.btc.sum5dUsdM} />
                <EtfMini label="ETH" value={etf.eth.latest?.totalUsdM} sum5={etf.eth.sum5dUsdM} />
                <EtfMini
                  label="SOL"
                  value={etf.sol?.latest?.totalUsdM}
                  sum5={etf.sol?.sum5dUsdM ?? null}
                />
              </div>
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
            <p className="mt-2 font-mono text-[0.58rem] text-faint">
              {t("lsHint")}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,0.85fr)]">
        <section className="min-w-0 border border-line bg-surface">
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
            <Link
              href="/graficos"
              className="font-mono text-[0.65rem] uppercase tracking-wider text-accent sm:justify-self-end"
            >
              {t("openCharts")} →
            </Link>
          </div>
          <PriceChart symbol={symbol} interval={interval} height={340} />
        </section>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <Panel title={t("derivatives")} href="/sentimento">
            <Row
              label="OI BTC"
              value={formatUsd(sentiment.openInterest.value, true)}
            />
            {sentiment.openInterest.change24hPct != null && (
              <Row
                label="OI Δ24h"
                value={formatPct(sentiment.openInterest.change24hPct)}
              />
            )}
            <Row label={t("postureLabel")} value={t(`posture.${regime.posture}`)} />
          </Panel>

          <LiveLiquidations compact />
        </div>
      </div>

      <div className={`mt-3 grid gap-3 ${dex ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        <Panel title={t("movers")} href="/mercado">
          <div className="grid grid-cols-2 gap-3">
            <MoverCol title={t("gainers")} items={market.movers.gainers.slice(0, 5)} />
            <MoverCol title={t("losers")} items={market.movers.losers.slice(0, 5)} />
          </div>
        </Panel>

        {dex && (
        <Panel title={t("dexFrenzy")} href="/memes">
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
                    m.change24h != null ? deltaClass(m.change24h) : "text-muted"
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
          <p className="mt-2 font-mono text-[0.58rem] text-faint">{t("dexNotCg")}</p>
        </Panel>
        )}

        <Panel title={t("yields")} href="/yields">
          <ul className="space-y-1.5">
            {yields.slice(0, 6).map((y) => (
              <li key={`${y.project}-${y.symbol}-${y.chain}`} className="text-sm">
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
                    c.change24h != null ? deltaClass(c.change24h) : "text-muted"
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
          <Panel title={t("defiPulse")} href="/defi">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="font-mono text-[0.58rem] text-faint">TVL</p>
                <p className="font-mono text-xl font-medium">
                  {formatUsd(defi.totalTvl, true)}
                </p>
                {defi.change1d != null && (
                  <p className={`font-mono text-xs ${deltaClass(defi.change1d)}`}>
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
  );
}

function LiveStatus({
  connection,
  lastUpdate,
  labelLive,
  labelConnecting,
  labelReconnecting,
  labelOffline,
}: {
  connection: LiveTickerConnection;
  lastUpdate: number | null;
  labelLive: string;
  labelConnecting: string;
  labelReconnecting: string;
  labelOffline: string;
}) {
  const label =
    connection === "live"
      ? labelLive
      : connection === "reconnecting"
        ? labelReconnecting
        : connection === "offline"
          ? labelOffline
          : labelConnecting;
  const tone =
    connection === "live"
      ? "text-accent"
      : connection === "offline"
        ? "text-faint"
        : "text-warn";
  const time =
    lastUpdate != null
      ? new Date(lastUpdate).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : null;

  return (
    <div className="flex shrink-0 items-center gap-2 border-r border-line px-3 py-2">
      <span
        className={`live-dot ${
          connection === "live"
            ? "live-dot--on"
            : connection === "offline"
              ? "live-dot--off"
              : "live-dot--warn"
        }`}
      />
      <span
        className={`font-mono text-[0.62rem] uppercase tracking-[0.14em] ${tone}`}
      >
        {label}
      </span>
      {time && connection === "live" && (
        <span className="hidden font-mono text-[0.58rem] text-faint sm:inline">
          {time}
        </span>
      )}
    </div>
  );
}

function TapeItem({
  label,
  value,
  change,
  changeIsAbs,
  flashKey,
}: {
  label: string;
  value: string;
  change?: number;
  changeIsAbs?: boolean;
  flashKey?: number | string;
}) {
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prev = useRef<number | string | undefined>(flashKey);

  useEffect(() => {
    if (flashKey == null || prev.current == null) {
      prev.current = flashKey;
      return;
    }
    if (flashKey === prev.current) return;
    const dir =
      typeof flashKey === "number" && typeof prev.current === "number"
        ? flashKey > prev.current
          ? "up"
          : flashKey < prev.current
            ? "down"
            : null
        : "up";
    prev.current = flashKey;
    if (!dir) return;
    setFlash(dir);
    const id = window.setTimeout(() => setFlash(null), 450);
    return () => window.clearTimeout(id);
  }, [flashKey]);

  return (
    <div
      className={`flex min-w-[6.5rem] shrink-0 flex-col border-r border-line px-3 py-2 last:border-r-0 ${
        flash === "up"
          ? "tape-flash-up"
          : flash === "down"
            ? "tape-flash-down"
            : ""
      }`}
    >
      <span className="font-mono text-[0.58rem] uppercase tracking-[0.1em] text-faint">
        {label}
      </span>
      <span
        className={`font-mono text-[0.8rem] font-medium tabular-nums ${
          changeIsAbs && change != null
            ? change > 0
              ? "text-up"
              : change < 0
                ? "text-down"
                : ""
            : ""
        }`}
      >
        {value}
      </span>
      {change != null && !changeIsAbs && (
        <span className={`font-mono text-[0.65rem] tabular-nums ${deltaClass(change)}`}>
          {formatPct(change)}
        </span>
      )}
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
      <div className="border border-line/80 bg-surface p-2">
        <p className="font-mono text-[0.58rem] text-faint">{label}</p>
        <p className="mt-0.5 text-sm text-muted">—</p>
      </div>
    );
  }
  return (
    <div className="border border-line/80 bg-surface p-2">
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

function Panel({
  title,
  href,
  children,
  warn,
}: {
  title: string;
  href?: string;
  children: ReactNode;
  warn?: boolean;
}) {
  return (
    <section
      className={`border bg-surface p-3 ${warn ? "border-warn/30" : "border-line"}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-faint">
          {title}
        </h2>
        {href && (
          <Link href={href} className="font-mono text-[0.62rem] text-accent">
            →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line/70 py-1.5 last:border-0">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-right">
        <span className="font-mono text-sm tabular-nums">{value}</span>
        {hint && (
          <span className="ml-2 font-mono text-[0.6rem] uppercase text-faint">
            {hint}
          </span>
        )}
      </span>
    </div>
  );
}

function MoverCol({
  title,
  items,
}: {
  title: string;
  items: MarketSnapshot["movers"]["gainers"];
}) {
  return (
    <div>
      <p className="mb-1 font-mono text-[0.6rem] uppercase text-faint">{title}</p>
      <ul className="space-y-1">
        {items.map((m) => (
          <li key={m.id} className="text-sm">
            <div className="flex justify-between gap-2">
              <Link
                href={`/caso/${m.caseId}`}
                className="font-medium hover:text-accent"
              >
                {m.symbol}
              </Link>
              <span className={`font-mono tabular-nums ${deltaClass(m.change24h)}`}>
                {formatPct(m.change24h)}
              </span>
            </div>
            <p className="font-mono text-[0.58rem] text-faint">
              {m.change1h != null && (
                <span className={deltaClass(m.change1h)}>
                  1h {formatPct(m.change1h)}
                </span>
              )}
              {m.change7d != null && (
                <span className={`ml-2 ${deltaClass(m.change7d)}`}>
                  7d {formatPct(m.change7d)}
                </span>
              )}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
