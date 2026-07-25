"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type Bar = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type Props = {
  symbol?: "BTCUSDT" | "ETHUSDT" | "SOLUSDT";
  interval?: "15m" | "1h" | "4h" | "1d";
  height?: number;
  className?: string;
};

function readCss(varName: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return v || fallback;
}

/**
 * Candles via lightweight-charts + accessible summary table.
 * Chart instance cleaned on unmount / symbol change.
 */
export function PriceChart({
  symbol = "BTCUSDT",
  interval = "1h",
  height = 320,
  className,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [bars, setBars] = useState<Bar[]>([]);
  const t = useTranslations("board");
  const locale = useLocale();
  const tableId = useId();

  useEffect(() => {
    let disposed = false;
    let chart: { remove: () => void; applyOptions: (o: object) => void } | null =
      null;
    let ro: ResizeObserver | null = null;

    async function run() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/chart?symbol=${symbol}&interval=${interval}`,
        );
        if (!res.ok) throw new Error("Falha ao carregar gráfico");
        const data = (await res.json()) as { bars: Bar[] };
        if (disposed || !wrapRef.current) return;
        setBars(data.bars ?? []);

        const { createChart, CandlestickSeries, CrosshairMode } =
          await import("lightweight-charts");

        const up = readCss("--up", "#0a6569");
        const down = readCss("--down", "#8f4200");
        const faint = readCss("--faint", "#6b7680");
        const line = readCss("--line", "rgba(20,24,28,0.1)");
        const cross = readCss("--crosshair", "rgba(26,77,140,0.45)");

        wrapRef.current.replaceChildren();
        const instance = createChart(wrapRef.current, {
          height,
          layout: {
            background: { color: "transparent" },
            textColor: faint,
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
          },
          grid: {
            vertLines: { color: line },
            horzLines: { color: line },
          },
          rightPriceScale: { borderColor: line },
          timeScale: {
            borderColor: line,
            timeVisible: true,
          },
          crosshair: {
            mode: CrosshairMode.Normal,
            vertLine: { color: cross, width: 1 },
            horzLine: { color: cross, width: 1 },
          },
        });
        chart = instance;

        const series = instance.addSeries(CandlestickSeries, {
          upColor: up,
          downColor: down,
          borderUpColor: up,
          borderDownColor: down,
          wickUpColor: up,
          wickDownColor: down,
        });

        series.setData(
          data.bars.map((b) => ({
            time: b.time as import("lightweight-charts").UTCTimestamp,
            open: b.open,
            high: b.high,
            low: b.low,
            close: b.close,
          })),
        );
        instance.timeScale().fitContent();

        ro = new ResizeObserver(() => {
          if (wrapRef.current && chart) {
            chart.applyOptions({ width: wrapRef.current.clientWidth });
          }
        });
        ro.observe(wrapRef.current);
        instance.applyOptions({ width: wrapRef.current.clientWidth });
      } catch (e) {
        if (!disposed) {
          setError(e instanceof Error ? e.message : "Erro no gráfico");
        }
      } finally {
        if (!disposed) setLoading(false);
      }
    }

    void run();

    return () => {
      disposed = true;
      ro?.disconnect();
      chart?.remove();
    };
  }, [symbol, interval, height]);

  const sample = bars.slice(-8);
  const first = bars[0];
  const last = bars[bars.length - 1];
  const change =
    first && last && first.close
      ? ((last.close - first.close) / first.close) * 100
      : null;

  return (
    <div className={`w-full min-w-0 ${className ?? ""}`}>
      {loading && (
        <div
          className="skeleton w-full"
          style={{ height }}
          aria-busy="true"
          aria-label={t("chartLoading")}
        />
      )}
      {error && (
        <p className="px-3 py-2 font-mono text-[0.7rem] text-storm" role="alert">
          {error}
        </p>
      )}
      <div
        ref={wrapRef}
        className="w-full"
        style={{ height: loading ? 0 : height }}
        role="img"
        aria-labelledby={tableId}
      />

      {/* Textual alternative — not color-only */}
      <details className="mt-2 border border-line bg-surface px-3 py-2">
        <summary
          id={tableId}
          className="cursor-pointer text-label text-muted"
        >
          {t("chartTable")} · {symbol} · {interval}
          {change != null && (
            <span className="ml-2 tabular-nums">
              {change >= 0 ? "▲" : "▼"} {change.toFixed(2)}%
            </span>
          )}
        </summary>
        <div className="scroll-x mt-2">
          <table className="w-full min-w-[28rem] text-left text-meta">
            <caption className="sr-only">
              {t("chartCaption", { symbol, interval })}
            </caption>
            <thead>
              <tr className="border-b border-line text-faint">
                <th scope="col" className="py-1 pr-3 font-medium">
                  {t("chartTime")}
                </th>
                <th scope="col" className="py-1 pr-3 font-medium">
                  O
                </th>
                <th scope="col" className="py-1 pr-3 font-medium">
                  H
                </th>
                <th scope="col" className="py-1 pr-3 font-medium">
                  L
                </th>
                <th scope="col" className="py-1 font-medium">
                  C
                </th>
              </tr>
            </thead>
            <tbody>
              {sample.map((b) => (
                <tr key={b.time} className="border-b border-line/60">
                  <td className="py-1 pr-3 tabular-nums text-muted">
                    {new Date(b.time * 1000).toLocaleString(locale, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="py-1 pr-3 tabular-nums">{b.open.toFixed(2)}</td>
                  <td className="py-1 pr-3 tabular-nums">{b.high.toFixed(2)}</td>
                  <td className="py-1 pr-3 tabular-nums">{b.low.toFixed(2)}</td>
                  <td
                    className={`py-1 tabular-nums ${
                      b.close >= b.open ? "delta-up" : "delta-down"
                    }`}
                  >
                    {b.close >= b.open ? "▲ " : "▼ "}
                    {b.close.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
