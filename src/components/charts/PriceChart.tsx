"use client";

import { useEffect, useRef, useState } from "react";

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

export function PriceChart({
  symbol = "BTCUSDT",
  interval = "1h",
  height = 320,
  className,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

        const { createChart, CandlestickSeries, CrosshairMode } =
          await import("lightweight-charts");

        wrapRef.current.replaceChildren();
        const instance = createChart(wrapRef.current, {
          height,
          layout: {
            background: { color: "transparent" },
            textColor: "#6d7585",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 11,
          },
          grid: {
            vertLines: { color: "rgba(255,255,255,0.04)" },
            horzLines: { color: "rgba(255,255,255,0.04)" },
          },
          rightPriceScale: { borderColor: "rgba(255,255,255,0.08)" },
          timeScale: {
            borderColor: "rgba(255,255,255,0.08)",
            timeVisible: true,
          },
          crosshair: {
            mode: CrosshairMode.Normal,
            vertLine: { color: "rgba(61,255,168,0.35)", width: 1 },
            horzLine: { color: "rgba(61,255,168,0.35)", width: 1 },
          },
        });
        chart = instance;

        const series = instance.addSeries(CandlestickSeries, {
          upColor: "#3dffa8",
          downColor: "#ff5c6a",
          borderUpColor: "#3dffa8",
          borderDownColor: "#ff5c6a",
          wickUpColor: "#3dffa8",
          wickDownColor: "#ff5c6a",
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

  return (
    <div className={`w-full min-w-0 ${className ?? ""}`}>
      {loading && (
        <p className="px-3 py-2 font-mono text-[0.7rem] text-faint">
          A carregar candles…
        </p>
      )}
      {error && (
        <p className="px-3 py-2 font-mono text-[0.7rem] text-storm">{error}</p>
      )}
      <div ref={wrapRef} className="w-full" style={{ height }} />
    </div>
  );
}
