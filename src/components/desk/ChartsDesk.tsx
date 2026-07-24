"use client";

import { PriceChart } from "@/components/charts/PriceChart";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function ChartsDesk() {
  const t = useTranslations("charts");
  const [symbol, setSymbol] = useState<"BTCUSDT" | "ETHUSDT" | "SOLUSDT">(
    "BTCUSDT",
  );
  const [interval, setInterval] = useState<"15m" | "1h" | "4h" | "1d">("1h");

  return (
    <div className="mx-auto w-full max-w-[1400px] section-pad pb-20 pt-6 enter">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex border border-line">
            {(["BTCUSDT", "ETHUSDT", "SOLUSDT"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSymbol(s)}
                className={`font-mono px-3 py-1.5 text-[0.7rem] uppercase ${
                  symbol === s ? "bg-accent text-bg" : "text-faint hover:text-ink"
                }`}
              >
                {s.replace("USDT", "")}
              </button>
            ))}
          </div>
          <div className="flex border border-line">
            {(["15m", "1h", "4h", "1d"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setInterval(tf)}
                className={`font-mono px-3 py-1.5 text-[0.7rem] uppercase ${
                  interval === tf
                    ? "bg-surface-2 text-accent"
                    : "text-faint hover:text-ink"
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="border border-line bg-surface p-2 md:p-3">
        <PriceChart symbol={symbol} interval={interval} height={480} />
      </div>
      <p className="mt-3 font-mono text-[0.65rem] text-faint">{t("source")}</p>
    </div>
  );
}
