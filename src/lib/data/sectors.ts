import {
  isSnapshotStale,
  readSnapshot,
  writeSnapshot,
} from "@/lib/data/snapshotStore";
import { toApiContext, type MetricContextApi } from "@/lib/history/context";
import { dayKey, utcToday } from "@/lib/history/series";
import { computeMetricContext, type SeriesPoint } from "@/lib/stats";

const CG = "https://api.coingecko.com/api/v3";
const STALE_MS = 30 * 60_000;
const HISTORY_DAYS = 35;
const THEMATIC_COUNT = 24;

/** Mega categories that dwarf thematic rotation — shown aside, not in the map. */
export const MEGA_CATEGORY_IDS = new Set([
  "smart-contract-platform",
  "layer-1",
]);

export type SectorRow = {
  id: string;
  name: string;
  marketCap: number;
  change24h: number;
  volume24h: number;
  /** Share of thematic (or mega) cohort, 0–100 */
  sharePct: number;
  topCoinIds: string[];
  updatedAt: string;
};

export type SectorHistoryDay = {
  date: string;
  /** market cap by category id */
  mcap: Record<string, number>;
  /** thematic share % by id (among thematic cohort that day) */
  share: Record<string, number>;
  change24h: Record<string, number>;
};

export type SectorRotation = {
  id: string;
  name: string;
  /** Percentage-point change in thematic share */
  shareDelta7d: number | null;
  shareDelta30d: number | null;
  /** Market-cap % change vs history point (honest null if missing) */
  mcapChange7d: number | null;
  mcapChange30d: number | null;
  sampleDays: number;
};

export type SectorsSnapshot = {
  thematic: SectorRow[];
  mega: SectorRow[];
  history: SectorHistoryDay[];
  rotation: SectorRotation[];
  readingPt: string;
  readingEn: string;
  /** D2-style context on 24h change for thematic ids */
  changeContext: Partial<Record<string, MetricContextApi>>;
  windowDays: number;
  stale: boolean;
  ingestedAt: string;
};

type CgCategory = {
  id: string;
  name: string;
  market_cap: number | null;
  market_cap_change_24h: number | null;
  volume_24h: number | null;
  top_3_coins_id?: string[];
  updated_at?: string;
};

function cgHeaders(): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  const key =
    process.env.COINGECKO_DEMO_API_KEY ||
    process.env.COINGECKO_API_KEY ||
    "";
  if (key) headers["x-cg-demo-api-key"] = key;
  return headers;
}

function withShares(rows: Omit<SectorRow, "sharePct">[]): SectorRow[] {
  const total = rows.reduce((s, r) => s + r.marketCap, 0);
  return rows.map((r) => ({
    ...r,
    sharePct: total > 0 ? (r.marketCap / total) * 100 : 0,
  }));
}

/**
 * Heavy ingest — NEVER call from page render.
 * Writes slim sectors snapshot + daily history for rotation (7d / 30d).
 */
export async function ingestSectorsSnapshot(): Promise<{
  thematic: number;
  historyDays: number;
}> {
  const res = await fetch(`${CG}/coins/categories?order=market_cap_desc`, {
    cache: "no-store",
    headers: cgHeaders(),
  });
  if (!res.ok) throw new Error(`CoinGecko categories ${res.status}`);
  const raw = (await res.json()) as CgCategory[];

  const mapped = raw
    .filter(
      (c) =>
        c.id &&
        c.name &&
        c.market_cap != null &&
        Number.isFinite(c.market_cap) &&
        c.market_cap > 0,
    )
    .map((c) => ({
      id: c.id,
      name: c.name,
      marketCap: c.market_cap!,
      change24h: c.market_cap_change_24h ?? 0,
      volume24h: c.volume_24h ?? 0,
      topCoinIds: (c.top_3_coins_id ?? []).slice(0, 3),
      updatedAt: c.updated_at ?? new Date().toISOString(),
    }));

  const megaRaw = mapped.filter((c) => MEGA_CATEGORY_IDS.has(c.id));
  const thematicRaw = mapped
    .filter((c) => !MEGA_CATEGORY_IDS.has(c.id))
    .slice(0, THEMATIC_COUNT);

  const thematic = withShares(thematicRaw);
  const mega = withShares(megaRaw);

  const prev = await readSnapshot<SectorsSnapshot>("sectors");
  const today = utcToday();
  const dayPoint: SectorHistoryDay = {
    date: today,
    mcap: Object.fromEntries(thematic.map((t) => [t.id, t.marketCap])),
    share: Object.fromEntries(thematic.map((t) => [t.id, t.sharePct])),
    change24h: Object.fromEntries(thematic.map((t) => [t.id, t.change24h])),
  };

  const histMap = new Map<string, SectorHistoryDay>();
  for (const d of prev?.history ?? []) {
    histMap.set(dayKey(d.date), d);
  }
  histMap.set(today, dayPoint);
  const history = [...histMap.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-HISTORY_DAYS)
    .map(([, d]) => d);

  const rotation = computeRotation(thematic, history);
  const changeContext = buildChangeContexts(thematic, history);
  const { readingPt, readingEn } = buildReading(thematic, rotation, history.length);

  await writeSnapshot(
    "sectors",
    {
      thematic,
      mega,
      history,
      rotation,
      readingPt,
      readingEn,
      changeContext,
      windowDays: HISTORY_DAYS,
      stale: false,
      ingestedAt: new Date().toISOString(),
    },
    "CoinGecko /coins/categories (thematic top, history for rotation)",
  );

  return { thematic: thematic.length, historyDays: history.length };
}

function findHistoryDay(
  history: SectorHistoryDay[],
  daysAgo: number,
): SectorHistoryDay | null {
  if (history.length < 2) return null;
  const target = new Date();
  target.setUTCHours(0, 0, 0, 0);
  target.setUTCDate(target.getUTCDate() - daysAgo);
  const key = target.toISOString().slice(0, 10);
  // Nearest day on or before target
  let best: SectorHistoryDay | null = null;
  for (const d of history) {
    if (d.date <= key) best = d;
  }
  // If target is older than our series start, only accept if we have enough span
  if (!best) return null;
  const first = history[0].date;
  const spanDays =
    (Date.parse(history[history.length - 1].date) - Date.parse(first)) /
    86_400_000;
  if (daysAgo >= 7 && spanDays < daysAgo * 0.6) return null;
  return best;
}

export function computeRotation(
  thematic: SectorRow[],
  history: SectorHistoryDay[],
): SectorRotation[] {
  const d7 = findHistoryDay(history, 7);
  const d30 = findHistoryDay(history, 30);
  const sampleDays = new Set(history.map((h) => h.date)).size;

  return thematic.map((t) => {
    const shareDelta7d =
      d7?.share[t.id] != null ? t.sharePct - d7.share[t.id] : null;
    const shareDelta30d =
      d30?.share[t.id] != null ? t.sharePct - d30.share[t.id] : null;
    const mcapChange7d =
      d7?.mcap[t.id] != null && d7.mcap[t.id] > 0
        ? ((t.marketCap - d7.mcap[t.id]) / d7.mcap[t.id]) * 100
        : null;
    const mcapChange30d =
      d30?.mcap[t.id] != null && d30.mcap[t.id] > 0
        ? ((t.marketCap - d30.mcap[t.id]) / d30.mcap[t.id]) * 100
        : null;
    return {
      id: t.id,
      name: t.name,
      shareDelta7d,
      shareDelta30d,
      mcapChange7d,
      mcapChange30d,
      sampleDays,
    };
  });
}

function buildChangeContexts(
  thematic: SectorRow[],
  history: SectorHistoryDay[],
): Partial<Record<string, MetricContextApi>> {
  const out: Partial<Record<string, MetricContextApi>> = {};
  for (const t of thematic) {
    const points: SeriesPoint[] = history
      .filter((h) => h.change24h[t.id] != null)
      .map((h) => ({ t: h.date, v: h.change24h[t.id] }));
    const ctx = computeMetricContext(points, {
      windowDays: 90,
      value: t.change24h,
    });
    if (ctx) out[t.id] = toApiContext(ctx);
  }
  return out;
}

/**
 * Observation-only copy — never causal claims or recommendations.
 */
export function buildReading(
  thematic: SectorRow[],
  rotation: SectorRotation[],
  historyDays: number,
): { readingPt: string; readingEn: string } {
  if (!thematic.length) {
    return {
      readingPt: "Sem dados de sectores neste momento.",
      readingEn: "No sector data right now.",
    };
  }

  const byShare = [...thematic].sort((a, b) => b.sharePct - a.sharePct);
  const top = byShare.slice(0, 3);
  const topNames = top.map((t) => t.name).join(", ");
  const topShare = top.reduce((s, t) => s + t.sharePct, 0);

  const with7 = rotation.filter((r) => r.shareDelta7d != null);
  const gainers = [...with7]
    .sort((a, b) => (b.shareDelta7d ?? 0) - (a.shareDelta7d ?? 0))
    .slice(0, 2);
  const losers = [...with7]
    .sort((a, b) => (a.shareDelta7d ?? 0) - (b.shareDelta7d ?? 0))
    .slice(0, 2);

  const hottest = [...thematic].sort(
    (a, b) => Math.abs(b.change24h) - Math.abs(a.change24h),
  )[0];

  const histNotePt =
    historyDays < 7
      ? ` Histórico ainda curto (${historyDays} dias) — a rotação de 7/30 dias fica incompleta até a série crescer.`
      : historyDays < 30
        ? ` Série com ${historyDays} dias — a vista a 30 dias permanece parcial.`
        : "";
  const histNoteEn =
    historyDays < 7
      ? ` History is still short (${historyDays} days) — 7/30-day rotation stays incomplete until the series grows.`
      : historyDays < 30
        ? ` Series spans ${historyDays} days — the 30-day view remains partial.`
        : "";

  let rotPt = "";
  let rotEn = "";
  if (gainers.length && losers.length && gainers[0].shareDelta7d != null) {
    rotPt = ` Em 7 dias, ${gainers.map((g) => g.name).join(" e ")} ganharam quota relativa; ${losers.map((l) => l.name).join(" e ")} perderam força.`;
    rotEn = ` Over 7 days, ${gainers.map((g) => g.name).join(" and ")} gained relative share; ${losers.map((l) => l.name).join(" and ")} lost force.`;
  }

  const dayPt = hottest
    ? ` No dia, a variação de capitalização mais marcada no mapa está em ${hottest.name} (${hottest.change24h >= 0 ? "+" : ""}${hottest.change24h.toFixed(1)}%).`
    : "";
  const dayEn = hottest
    ? ` On the day, the sharpest market-cap move on the map is ${hottest.name} (${hottest.change24h >= 0 ? "+" : ""}${hottest.change24h.toFixed(1)}%).`
    : "";

  return {
    readingPt: `Capital concentrado em ${topNames} (juntos ${topShare.toFixed(0)}% do mapa temático).${rotPt}${dayPt}${histNotePt}`,
    readingEn: `Capital concentrated in ${topNames} (together ${topShare.toFixed(0)}% of the thematic map).${rotEn}${dayEn}${histNoteEn}`,
  };
}

/** Disk-only reader for pages / API — no upstream fetch. */
export async function fetchSectorsSnapshot(): Promise<SectorsSnapshot | null> {
  const snap = await readSnapshot<SectorsSnapshot>("sectors");
  if (!snap?.thematic?.length) return null;
  return {
    ...snap,
    stale: isSnapshotStale(snap.updatedAt, STALE_MS),
  };
}
