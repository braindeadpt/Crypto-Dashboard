import { readSnapshot } from "@/lib/data/snapshotStore";
import { computeMetricContext } from "@/lib/stats";
import type { SeriesPoint } from "@/lib/stats";
import {
  HISTORY_METRIC_IDS,
  type HistoryMetricId,
  type HistorySnapshot,
} from "@/lib/history/metrics";

/**
 * AS CORRENTES — nove séries de 90 dias num só olhar.
 *
 * Cada série é normalizada ao DESVIO FACE À SUA PRÓPRIA MEDIANA — nunca
 * valores absolutos — para que unidades diferentes (dólares, taxas,
 * índices) se comparem de forma justa. O motor de percentil/mediana é
 * computeMetricContext, o mesmo que alimenta a Régua — não inventamos um
 * segundo.
 *
 * Amostra curta (< MIN_DAYS): a série não vira banda — vai para
 * `shortSample` e o ecrã diz "amostra insuficiente". Nunca fingimos
 * história que não existe.
 */

export const CORRENTES_IDS = [
  "price_btc",
  "volume_btc",
  "vol_realized_btc",
  "funding_btc",
  "oi_btc",
  "fear_greed",
  "tvl",
  "stablecoin_supply",
  "etf_btc_flow",
] as const satisfies readonly HistoryMetricId[];

/** Série precisa de pelo menos duas semanas para ser uma "corrente". */
export const MIN_DAYS = 14;

export type CorrenteSeries = {
  id: HistoryMetricId;
  /** Pontos reais, ordenados — sem preenchimento de lacunas. */
  points: SeriesPoint[];
  /** Mediana da janela — a linha-zero da banda. */
  median: number | null;
  /** max |v − mediana| na janela; 0 quando a série é plana. */
  scale: number;
  latest: number | null;
  percentile: number | null;
  /** Dias reais observados na janela — nunca inflado. */
  days: number;
  source: string;
};

export type CorrentesData = {
  updatedAt: string | null;
  windowDays: number;
  series: CorrenteSeries[];
  /** IDs presentes mas com amostra curta — assinalados no rodapé. */
  shortSample: HistoryMetricId[];
};

export function buildCorrentes(
  snap: HistorySnapshot | null,
): CorrentesData {
  const windowDays = snap?.windowDays ?? 90;
  const series: CorrenteSeries[] = [];
  const shortSample: HistoryMetricId[] = [];

  // Bandas na ordem editorial (preço primeiro — o BTC é a âncora);
  // as restantes métricas entram em shortSample se existirem.
  for (const id of HISTORY_METRIC_IDS) {
    const blob = snap?.series?.[id];
    const pts = (blob?.points ?? [])
      .filter((p) => Number.isFinite(p.v))
      .slice()
      .sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
    if (!pts.length) continue;

    const ctx = computeMetricContext(pts, { windowDays });
    const days = ctx?.sampleDays ?? pts.length;
    const inBands = (CORRENTES_IDS as readonly string[]).includes(id);

    if (!inBands || days < MIN_DAYS) {
      shortSample.push(id);
      continue;
    }

    const median = ctx?.median ?? null;
    const scale =
      median == null
        ? 0
        : Math.max(...pts.map((p) => Math.abs(p.v - median)), 0);

    series.push({
      id,
      points: pts,
      median,
      scale,
      latest: ctx?.value ?? pts[pts.length - 1].v,
      percentile: ctx?.percentile ?? null,
      days,
      source: blob!.source,
    });
  }

  series.sort(
    (a, b) =>
      CORRENTES_IDS.indexOf(a.id as (typeof CORRENTES_IDS)[number]) -
      CORRENTES_IDS.indexOf(b.id as (typeof CORRENTES_IDS)[number]),
  );

  return {
    updatedAt: null, // o loader injecta a idade real do ficheiro
    windowDays,
    series,
    shortSample,
  };
}

/** Disk-only loader for server components. */
export async function getCorrentes(): Promise<CorrentesData> {
  const snap =
    await readSnapshot<HistorySnapshot & { updatedAt?: string }>("history");
  const data = buildCorrentes(snap);
  return { ...data, updatedAt: snap?.updatedAt ?? null };
}
