import { readSnapshot } from "@/lib/data/snapshotStore";
import { dayKey } from "@/lib/history/series";
import type { HistorySnapshot } from "@/lib/history/metrics";
import { computeRegime } from "@/lib/regime/engine";
import type { MarketPosture } from "@/lib/types";

/**
 * R2 — o regime como objecto com passado.
 *
 * Recomputa o motor de stress para cada dia do snapshot de histórico,
 * usando só os sinais realmente gravados nesse dia. Sinais em falta
 * contribuem 0 (contrato do motor) e baixam a cobertura — nunca são
 * estimados. Dias com menos de 2 sinais ficam de fora: um "regime"
 * calculado de um único input seria um número inventado.
 */
export type RegimeDay = {
  /** YYYY-MM-DD (UTC) */
  t: string;
  /** Stress 0–100, mesmo motor do regime ao vivo. */
  score: number;
  posture: MarketPosture;
  /** 0–1 — quantos dos 6 sinais base existiam nesse dia. */
  coverage: number;
};

const CORE_SIGNALS = 6;
const MIN_SIGNALS = 2;

function toMap(
  points: { t: string; v: number }[] | undefined,
): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of points ?? []) {
    if (Number.isFinite(p.v)) m.set(dayKey(p.t), p.v);
  }
  return m;
}

function prevDay(day: string): string {
  const t = Date.parse(`${day}T00:00:00Z`) - 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** Δ% face ao dia anterior — só quando o dia anterior existe (lacuna ≠ 24h). */
function dayOverDayPct(map: Map<string, number>, day: string): number | null {
  const cur = map.get(day);
  const prev = map.get(prevDay(day));
  if (cur == null || prev == null || prev === 0) return null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}

export function computeRegimeHistory(
  series: HistorySnapshot["series"] | undefined,
): RegimeDay[] {
  if (!series) return [];

  const fng = toMap(series.fear_greed?.points);
  const price = toMap(series.price_btc?.points);
  const funding = toMap(series.funding_btc?.points);
  const breadth = toMap(series.breadth?.points);
  const oi = toMap(series.oi_btc?.points);
  const etf = toMap(series.etf_btc_flow?.points);
  const dominance = toMap(series.btc_dominance?.points);

  const days = new Set<string>([
    ...fng.keys(),
    ...price.keys(),
    ...funding.keys(),
    ...breadth.keys(),
  ]);

  const out: RegimeDay[] = [];
  for (const day of [...days].sort()) {
    const fearGreed = fng.get(day);
    const btcChange24h = dayOverDayPct(price, day);
    const fundingRate = funding.get(day);
    const breadthPct = breadth.get(day);
    const oiChange24hPct = dayOverDayPct(oi, day);
    // Histórico só tem o fluxo BTC — o combinado BTC+ETH fica subestimado,
    // declarado na cobertura como sinal presente mas parcial.
    const etfUsdM = etf.get(day);

    const present = [
      fearGreed,
      btcChange24h,
      fundingRate,
      breadthPct,
      oiChange24hPct,
      etfUsdM,
    ].filter((v) => v != null).length;
    if (present < MIN_SIGNALS) continue;

    // Campos obrigatórios do motor recebem neutros quando não há dado —
    // neutro = 0 pontos de stress, nunca um valor estimado.
    const r = computeRegime({
      fearGreed: fearGreed ?? 50,
      btcChange24h: btcChange24h ?? 0,
      fundingRate: fundingRate ?? 0,
      breadthPct: breadthPct ?? null,
      oiChange24hPct,
      dominance: dominance.get(day) ?? 0,
      marketCapChange24h: 0,
      ethChange24h: null,
      solChange24h: null,
      oiChangeMaxAbsPct: null,
      longShortRatio: null,
      etfCombinedUsdM: etfUsdM ?? null,
      maxPegDeviationPct: null,
    });

    out.push({
      t: day,
      score: r.score,
      posture: r.posture,
      coverage: present / CORE_SIGNALS,
    });
  }

  return out;
}

/** Disk-only — lê o snapshot de histórico, sem rede. */
export async function getRegimeHistory(): Promise<{
  days: RegimeDay[];
  updatedAt: string | null;
}> {
  const snap = await readSnapshot<HistorySnapshot>("history");
  return {
    days: computeRegimeHistory(snap?.series),
    updatedAt: snap?.updatedAt ?? null,
  };
}
