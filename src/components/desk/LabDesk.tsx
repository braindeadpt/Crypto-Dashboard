"use client";

import { Link } from "@/i18n/navigation";
import { formatPct, formatUsd } from "@/lib/format";
import type {
  MarketSnapshot,
  RegimeResult,
  SentimentSnapshot,
} from "@/lib/types";
import { useTranslations } from "next-intl";

export function LabDesk({
  regime,
  market,
  sentiment,
}: {
  regime: RegimeResult;
  market: MarketSnapshot;
  sentiment: SentimentSnapshot;
}) {
  const t = useTranslations("lab");

  return (
    <div className="mx-auto max-w-[1400px] section-pad pb-20 pt-6 enter">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted">{t("subtitle")}</p>
      </header>

      <div className="mt-6 grid gap-2 font-mono text-sm sm:grid-cols-2 lg:grid-cols-4">
        <Cell label="Posture" value={regime.posture} />
        <Cell label="Stress" value={`${regime.score}/100`} />
        <Cell label="BTC" value={formatUsd(market.btc.price)} />
        <Cell label="BTC 24h" value={formatPct(market.btc.change24h)} />
        <Cell label="ETH" value={formatUsd(market.eth.price)} />
        <Cell label="Dom" value={`${market.global.btcDominance.toFixed(2)}%`} />
        <Cell label="F&G" value={String(sentiment.fearGreed.value)} />
        <Cell
          label="Funding"
          value={`${(sentiment.funding.rate * 100).toFixed(4)}%`}
        />
        <Cell
          label="OI est."
          value={formatUsd(sentiment.openInterest.value, true)}
        />
        <Cell
          label="Liq intensity"
          value={String(sentiment.liquidationWeather.intensity)}
        />
        <Cell label="Liq bias" value={sentiment.liquidationWeather.bias} />
        <Cell
          label="Force $"
          value={formatUsd(
            sentiment.liquidationWeather.recentForceNotional,
            true,
          )}
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold">
        <Link href="/sentimento" className="text-accent">
          Sentimento →
        </Link>
        <Link href="/mercado" className="text-accent">
          Mercado →
        </Link>
        <Link href="/graficos" className="text-accent">
          Gráficos →
        </Link>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-surface p-3">
      <p className="font-sans text-xs text-faint">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
