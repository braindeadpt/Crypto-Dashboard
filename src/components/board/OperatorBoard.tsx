"use client";

import { ActHead } from "@/components/board/boardShared";
import { Concordancia } from "@/components/board/Concordancia";
import { Correntes } from "@/components/board/Correntes";
import { FitaRegime } from "@/components/board/FitaRegime";
import { CorrenteViva } from "@/components/board/CorrenteViva";
import { HeroPanel } from "@/components/board/HeroPanel";
import { MarketMap } from "@/components/board/MarketMap";
import { RegimeHistory } from "@/components/board/RegimeHistory";
import { SinceLastVisit } from "@/components/board/SinceLastVisit";
import { Pulso } from "@/components/instrument/Pulso";
import { DailyRitualCard } from "@/components/ritual/DailyRitualCard";
import { WatchlistPanel } from "@/components/watchlist/WatchlistPanel";
import { useExpertise } from "@/components/expertise/ExpertiseProvider";
import { MotionProvider } from "@/lib/motion/useMotion";
import { useHistoryContexts } from "@/components/history/MetricHistoryHint";
import { Link } from "@/i18n/navigation";
import type { Concordancia as ConcordanciaData } from "@/lib/history/concordancia";
import type { CorrentesData } from "@/lib/history/correntes";
import type { MapLayers } from "@/lib/data/mapLayers";
import type { DailyRitual } from "@/lib/editorial/ritual";
import type { ReadingSet } from "@/lib/reading";
import type { RegimeDay } from "@/lib/regime/history";
import type { VisitVitals } from "@/lib/local/visit";
import type { MarketSnapshot, RegimeResult } from "@/lib/types";
import { useTranslations } from "next-intl";
import { useRefreshOnReturn } from "@/lib/hooks/useRefreshOnReturn";
import { useLiveTicker } from "@/lib/hooks/useLiveTicker";

type Props = {
  market: MarketSnapshot;
  regime: RegimeResult;
  ritual: DailyRitual;
  readings: ReadingSet;
  /** Oldest input behind regime/readings/ritual — the honest data age (F2). */
  asOf: string | null;
  /** Vitals actuais para o diff "desde a tua última visita" (R1). */
  visitVitals: VisitVitals;
  /** Regime com passado — série diária 30–90d + hoje (R2). */
  regimeHistory: { days: RegimeDay[]; updatedAt: string | null };
  /** Camadas de cor do mapa (R4) — null quando as fontes falham. */
  mapLayers: MapLayers | null;
  /** As Correntes — 9 séries de 90d normalizadas à mediana (M5). */
  correntes: CorrentesData | null;
  /** Concordância diária — sinais no mesmo sentido do preço (M6). */
  concordancia: ConcordanciaData | null;
  /** Volatilidade realizada BTC — cadência do Maestro. Null sem série. */
  volRealizedPct?: number | null;
};

/**
 * Entrada — a página do dia como jornal de instrumento.
 *
 * Estrutura editorial, não dashboard: masthead → resposta → tape → mapa →
 * pulso → briefing. Hairlines em vez de caixas; cada secção é um acto
 * numerado com um trabalho só. O detalhe vive nas páginas temáticas.
 */
export function OperatorBoard({
  market,
  regime,
  ritual,
  readings,
  asOf,
  visitVitals,
  regimeHistory,
  mapLayers,
  correntes = null,
  concordancia = null,
  volRealizedPct = null,
}: Props) {
  const ti = useTranslations("instrumento");
  const { level, show } = useExpertise();

  const sol = market.top.find((a) => a.id === "solana");
  const live = useLiveTicker({
    BTCUSDT: { price: market.btc.price, change24h: market.btc.change24h },
    ETHUSDT: { price: market.eth.price, change24h: market.eth.change24h },
    ...(sol
      ? { SOLUSDT: { price: sol.price, change24h: sol.change24h } }
      : {}),
  });
  useRefreshOnReturn();
  const hist = useHistoryContexts();

  const btcPx = live.quotes.BTCUSDT?.price ?? market.btc.price;
  const btcChg = live.quotes.BTCUSDT?.change24h ?? market.btc.change24h;
  const ethPx = live.quotes.ETHUSDT?.price ?? market.eth.price;
  const ethChg = live.quotes.ETHUSDT?.change24h ?? market.eth.change24h;
  const solPx = live.quotes.SOLUSDT?.price ?? sol?.price;
  const solChg = live.quotes.SOLUSDT?.change24h ?? sol?.change24h;

  return (
    <MotionProvider readings={readings} realizedVolPct={volRealizedPct}>
    <div className="obs-shell section-pad pb-16 enter-sequence">
      {/* A resposta — a corrente viva por cima do masthead: uma só peça.
          A corrente é a primeira coisa que se vê e a única que nunca pára. */}
      <div>
        <CorrenteViva live={live} className="-mx-[var(--pad-x,1rem)] mb-2" />
        <HeroPanel
        readings={readings}
        date={ritual.date}
        btc={{ px: btcPx, chg: btcChg, spark: market.btc.sparkline7d }}
        eth={{ px: ethPx, chg: ethChg }}
        sol={{ px: solPx, chg: solChg }}
        intensity={regime.score / 100}
        posture={regime.posture}
        snapshotAt={market.updatedAt}
        snapshotStale={market.stale ?? false}
        readingsAt={asOf}
        live={{
          connection: live.connection,
          lastUpdate: live.lastUpdate,
        }}
        vitals={{
          cap: market.global.totalMarketCap,
          capChg: market.global.marketCapChange24h,
          vol: market.global.totalVolume,
          dom: market.global.btcDominance,
        }}
      />
      </div>

      {/* Contexto temporal sob o herói — uma única faixa fina que junta a
          duração do regime e o apoio do movimento. Concordância é
          análise → operador+. */}
      <div>
        <FitaRegime days={regimeHistory.days} />
        {level !== "citizen" && concordancia && (
          <Concordancia data={concordancia} />
        )}
      </div>

      {/* Entrada — o que mudou desde a última visita (só aparece com passado) */}
      <SinceLastVisit vitals={visitVitals} />

      {/* Placa I — a constelação: amplitude e estrutura do mercado inteiro */}
      <section className="board-act">
        <ActHead
          num="I"
          title={ti("acts.mapTitle")}
          note={ti("acts.mapNote")}
          coord={ti("acts.mapCoord", { count: market.top.length })}
          ageAt={market.updatedAt}
        />
        <div className="plate-frame">
          <MarketMap
            assets={market.top}
            layers={mapLayers}
            tall
            showTitle={false}
            liveTicks={live.quotes}
          />
        </div>
      </section>

      {/* Placa II — as correntes: nove séries de 90d ao desvio da mediana */}
      {level !== "citizen" && correntes && (
        <section className="board-act">
          <ActHead
            num="II"
            title={ti("acts.currentsTitle")}
            note={ti("acts.currentsNote")}
            coord={ti("acts.currentsCoord", { count: correntes.series.length })}
            ageAt={correntes.updatedAt}
          />
          <Correntes data={correntes} />
        </section>
      )}

      {/* Placa III — o pulso: instrumento de operador; Essencial já teve a resposta */}
      {level !== "citizen" && (
        <section className="board-act">
          <ActHead
            num="III"
            title={ti("acts.pulseTitle")}
            note={ti("acts.pulseNote")}
            coord={ti("acts.pulseCoord", { days: regimeHistory.days.length })}
            ageAt={asOf}
          />
          <Pulso regime={regime} hist={hist} />
          <RegimeHistory
            days={regimeHistory.days}
            updatedAt={regimeHistory.updatedAt}
          />
        </section>
      )}

      {/* Placa IV — o briefing: cinco entradas fixas, sempre os mesmos slots.
          R8 — Essencial é hero + mapa + leituras; o briefing fica no Operador. */}
      {show("boardSecondary") && (
        <section className="board-act">
          <ActHead
            num="IV"
            title={ti("acts.briefTitle")}
            note={ti("acts.briefNote")}
            coord={ti("acts.briefCoord")}
            ageAt={asOf}
          />
          <DailyRitualCard ritual={ritual} />
        </section>
      )}

      {/* Aprofundar — cada página tem um trabalho; navegar, não re-ler */}
      <nav
        className="mt-10 border-t border-line pt-4"
        aria-label={ti("deeperAria")}
      >
        <p className="text-label text-faint">{ti("deeper")}</p>
        <div className="mt-3 grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3">
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
        {!show("boardSecondary") && (
          <p className="mt-3 text-meta text-faint">{ti("citizenMore")}</p>
        )}
      </nav>

      {/* Placa V — a lista: instrumento pessoal, local e sem servidor.
          R8 — fora do Essencial; o dial sobe para a ter de volta. */}
      {show("boardSecondary") && (
        <section className="board-act">
          <ActHead
            num="V"
            title={ti("acts.listTitle")}
            note={ti("acts.listNote")}
            coord={ti("acts.listCoord")}
          />
          <WatchlistPanel />
        </section>
      )}
    </div>
    </MotionProvider>
  );
}
