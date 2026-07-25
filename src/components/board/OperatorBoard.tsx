"use client";

import { ActHead } from "@/components/board/boardShared";
import { QuestionCards } from "@/components/board/QuestionCards";
import { ReadingHeadline, ReadingTrio } from "@/components/board/ReadingCards";
import { Pulso } from "@/components/instrument/Pulso";
import { DailyRitualCard } from "@/components/ritual/DailyRitualCard";
import { WatchlistPanel } from "@/components/watchlist/WatchlistPanel";
import { useExpertise } from "@/components/expertise/ExpertiseProvider";
import { useHistoryContexts } from "@/components/history/MetricHistoryHint";
import { Link } from "@/i18n/navigation";
import type { DailyRitual } from "@/lib/editorial/ritual";
import { deltaClass, formatPct, formatUsd } from "@/lib/format";
import type { ReadingSet } from "@/lib/reading";
import type { MarketSnapshot, RegimeResult } from "@/lib/types";
import { useTranslations } from "next-intl";
import { useBoardRefresh } from "@/lib/hooks/useBoardRefresh";
import { useLiveTicker } from "@/lib/hooks/useLiveTicker";

type Props = {
  market: MarketSnapshot;
  regime: RegimeResult;
  ritual: DailyRitual;
  readings: ReadingSet;
};

/**
 * Entrada (E3): Nível 1 responde, Nível 2 mostra a evidência.
 *
 * Ordem deliberada — a resposta primeiro, os números depois. Antes a entrada
 * abria com 105 percentagens e pedia ao leitor que sintetizasse; agora sintetiza
 * o produto e o detalhe vive em /instrumento.
 *
 * Densidade pelo Dial: Essencial = só Nível 1 · Operador/Analista = 1 + 2.
 */
export function OperatorBoard({ market, regime, ritual, readings }: Props) {
  const t = useTranslations("board");
  const ti = useTranslations("instrumento");
  const { level } = useExpertise();

  const sol = market.top.find((a) => a.id === "solana");
  const live = useLiveTicker({
    BTCUSDT: { price: market.btc.price, change24h: market.btc.change24h },
    ETHUSDT: { price: market.eth.price, change24h: market.eth.change24h },
    ...(sol
      ? { SOLUSDT: { price: sol.price, change24h: sol.change24h } }
      : {}),
  });
  useBoardRefresh();
  const hist = useHistoryContexts();

  const btcPx = live.quotes.BTCUSDT?.price ?? market.btc.price;
  const btcChg = live.quotes.BTCUSDT?.change24h ?? market.btc.change24h;
  const ethPx = live.quotes.ETHUSDT?.price ?? market.eth.price;
  const ethChg = live.quotes.ETHUSDT?.change24h ?? market.eth.change24h;
  const solPx = live.quotes.SOLUSDT?.price ?? sol?.price;
  const solChg = live.quotes.SOLUSDT?.change24h ?? sol?.change24h;

  return (
    <div className="mx-auto w-full max-w-[1400px] section-pad pb-16 pt-3 enter">
      {/* NÍVEL 1 — a resposta, antes de qualquer número solto */}
      <ReadingHeadline readings={readings} />
      <ReadingTrio readings={readings} />

      <Pulso regime={regime} hist={hist} className="mt-3" />

      <section className="mt-3 flex flex-wrap items-end justify-between gap-3 border border-line bg-surface px-4 py-3">
        <div>
          <p className="text-label text-faint">{t("marketNow")}</p>
          <p className="mt-1 font-display text-display text-ink">
            BTC{" "}
            <span className={deltaClass(btcChg)}>{formatUsd(btcPx)}</span>
            <span className={`ml-3 text-data ${deltaClass(btcChg)}`}>
              {btcChg >= 0 ? "▲" : "▼"} {formatPct(btcChg)}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <div>
            <p className="text-label text-faint">ETH</p>
            <p className={`text-data ${deltaClass(ethChg)}`}>
              {formatUsd(ethPx)} · {formatPct(ethChg)}
            </p>
          </div>
          {solPx != null && solChg != null && (
            <div>
              <p className="text-label text-faint">SOL</p>
              <p className={`text-data ${deltaClass(solChg)}`}>
                {formatUsd(solPx)} · {formatPct(solChg)}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* NÍVEL 2 — a evidência. Essencial fica-se pelo Nível 1. */}
      {level !== "citizen" && <QuestionCards readings={readings} />}

      {/* O ritual passa para depois da resposta: quem quer o briefing lê-o a
          seguir; quem só quer saber o estado já foi servido acima. */}
      <DailyRitualCard ritual={ritual} className="mt-3" />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border border-line bg-bg-elevated px-4 py-3">
        <div>
          <p className="text-label text-faint">{ti("bridgeEyebrow")}</p>
          <p className="mt-0.5 text-body text-ink">
            {level === "analyst" ? ti("bridgeAnalyst") : ti("bridgeDefault")}
          </p>
        </div>
        <Link
          href="/instrumento"
          className="shrink-0 border border-accent/40 bg-accent-dim px-3 py-2 text-label text-accent transition hover:border-accent"
        >
          {ti("openFull")} →
        </Link>
      </div>

      <div className="board-act">
        <ActHead title={ti("acts.listTitle")} note={ti("acts.listNote")} />
        <WatchlistPanel />
      </div>
    </div>
  );
}
