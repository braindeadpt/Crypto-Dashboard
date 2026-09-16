"use client";

import { ActHead } from "@/components/board/boardShared";
import { HeroPanel } from "@/components/board/HeroPanel";
import { MarketMap } from "@/components/board/MarketMap";
import { Pulso } from "@/components/instrument/Pulso";
import { DailyRitualCard } from "@/components/ritual/DailyRitualCard";
import { WatchlistPanel } from "@/components/watchlist/WatchlistPanel";
import { useExpertise } from "@/components/expertise/ExpertiseProvider";
import { useHistoryContexts } from "@/components/history/MetricHistoryHint";
import { Link } from "@/i18n/navigation";
import type { DailyRitual } from "@/lib/editorial/ritual";
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
 * Entrada — a página do dia como jornal de instrumento.
 *
 * Estrutura editorial, não dashboard: masthead → resposta → tape → mapa →
 * pulso → briefing. Hairlines em vez de caixas; cada secção é um acto
 * numerado com um trabalho só. O detalhe vive nas páginas temáticas.
 */
export function OperatorBoard({ market, regime, ritual, readings }: Props) {
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
    <div className="mx-auto w-full max-w-[1400px] section-pad pb-16 enter-sequence">
      {/* A resposta — masthead, manchete, índice de leituras, tape live */}
      <HeroPanel
        readings={readings}
        date={ritual.date}
        btc={{ px: btcPx, chg: btcChg, spark: market.btc.sparkline7d }}
        eth={{ px: ethPx, chg: ethChg }}
        sol={{ px: solPx, chg: solChg }}
        intensity={regime.score / 100}
        posture={regime.posture}
        vitals={{
          cap: market.global.totalMarketCap,
          capChg: market.global.marketCapChange24h,
          vol: market.global.totalVolume,
          dom: market.global.btcDominance,
        }}
      />

      {/* 01 — o mapa: amplitude e estrutura do mercado inteiro */}
      <section className="mt-10">
        <ActHead title={ti("acts.mapTitle")} note={ti("acts.mapNote")} />
        <MarketMap assets={market.top} tall showTitle={false} />
      </section>

      {/* 02 — o pulso: instrumento de operador; Essencial já teve a resposta */}
      {level !== "citizen" && (
        <section className="mt-10">
          <ActHead title={ti("acts.pulseTitle")} note={ti("acts.pulseNote")} />
          <Pulso regime={regime} hist={hist} />
        </section>
      )}

      {/* 03 — o briefing: cinco entradas fixas, sempre os mesmos slots */}
      <section className="mt-10">
        <ActHead title={ti("acts.briefTitle")} note={ti("acts.briefNote")} />
        <DailyRitualCard ritual={ritual} />
      </section>

      {/* Aprofundar — cada página tem um trabalho; navegar, não re-ler */}
      <nav
        className="mt-10 border-t border-line pt-4"
        aria-label={ti("deeperAria")}
      >
        <p className="text-label text-faint">{ti("deeper")}</p>
        <div className="mt-3 grid gap-px border border-line bg-line sm:grid-cols-3">
          {(
            [
              ["/mercado", ti("deeperMercado")],
              ["/fluxos", ti("deeperFluxos")],
              ["/casos", ti("deeperMundo")],
              ["/aprender", ti("deeperAprender")],
              ["/ferramentas", ti("deeperFerramentas")],
              ["/mesa", ti("deeperInstrumento")],
            ] as const
          ).map(([href, label]) => (
            <Link
              key={href}
              href={href}
              transitionTypes={["nav-forward"]}
              className="group bg-surface px-4 py-3 transition hover:bg-surface-2"
            >
              <span className="text-meta text-ink group-hover:text-accent">
                {label}
              </span>
              <span className="ml-2 text-faint transition group-hover:text-accent">
                →
              </span>
            </Link>
          ))}
        </div>
      </nav>

      {/* 04 — a lista: instrumento pessoal, local e sem servidor */}
      <section className="mt-10 board-act">
        <ActHead title={ti("acts.listTitle")} note={ti("acts.listNote")} />
        <WatchlistPanel />
      </section>
    </div>
  );
}
