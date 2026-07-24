import {
  isSnapshotStale,
  readSnapshot,
  writeSnapshot,
} from "@/lib/data/snapshotStore";

export type EtfDailyFlow = {
  date: string;
  dateLabel: string;
  totalUsdM: number;
  byTicker: Record<string, number | null>;
};

export type EtfAssetFlows = {
  asset: "BTC" | "ETH" | "SOL";
  unit: "USDm";
  latest: EtfDailyFlow | null;
  previous: EtfDailyFlow | null;
  streakDays: number;
  sum5dUsdM: number | null;
  sum20dUsdM: number | null;
  history: EtfDailyFlow[];
  source: string;
  sourceUrl: string;
  updatedAt: string;
};

export type EtfSnapshot = {
  btc: EtfAssetFlows;
  eth: EtfAssetFlows;
  sol: EtfAssetFlows | null;
  signal: {
    spotBidPt: string;
    spotBidEn: string;
    tone: "up" | "down" | "neutral" | "warn";
  };
  /** True when snapshot is older than freshness window */
  stale: boolean;
  /** ISO of last successful ingest */
  ingestedAt: string;
  updatedAt: string;
};

const PAGES: {
  asset: "BTC" | "ETH" | "SOL";
  url: string;
  marker: string;
}[] = [
  { asset: "BTC", url: "https://farside.co.uk/btc/", marker: "IBIT" },
  { asset: "ETH", url: "https://farside.co.uk/eth/", marker: "ETHA" },
  { asset: "SOL", url: "https://farside.co.uk/sol/", marker: "FSOL" },
];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const STALE_MS = 12 * 60 * 60_000; // ETF updates after US close — 12h window

/**
 * Pure fetch — no child_process / curl. May fail behind Cloudflare;
 * callers must fall back to last good snapshot.
 */
async function fetchHtml(url: string): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: ctrl.signal,
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) throw new Error(`Farside HTTP ${res.status}`);
    const html = await res.text();
    if (html.includes("Just a moment")) {
      throw new Error("Farside Cloudflare challenge");
    }
    if (!html.includes("<table")) {
      throw new Error("Farside HTML sem tabela");
    }
    return html;
  } finally {
    clearTimeout(timer);
  }
}

function parseNumberCell(raw: string): number | null {
  const s = raw.replace(/\u00a0/g, " ").replace(/,/g, "").trim();
  if (!s || s === "-" || s === "–" || s === "—") return null;
  const neg = /^\((.*)\)$/.exec(s);
  if (neg) {
    const n = Number(neg[1]);
    return Number.isFinite(n) ? -n : null;
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseDateLabel(label: string): string | null {
  const m = label
    .replace(/\u00a0/g, " ")
    .trim()
    .match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (!m) return null;
  const months: Record<string, string> = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };
  const mo = months[m[2]];
  if (!mo) return null;
  return `${m[3]}-${mo}-${m[1].padStart(2, "0")}`;
}

function stripTags(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseFarsideTable(html: string, marker: string): EtfDailyFlow[] {
  const tables = [...html.matchAll(/<table[\s\S]*?<\/table>/gi)].map((m) => m[0]);
  const table =
    tables.find((t) => t.includes(marker) && /Fee/i.test(t)) ??
    tables.find((t) => new RegExp(marker, "i").test(t));
  if (!table) {
    throw new Error(`Farside: tabela com marker ${marker} não encontrada`);
  }

  const rows = [...table.matchAll(/<tr[\s\S]*?<\/tr>/gi)].map((m) => m[0]);
  let tickers: string[] = [];
  const flows: EtfDailyFlow[] = [];

  for (const row of rows) {
    const cells = [...row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) =>
      stripTags(c[1]),
    );
    if (cells.length < 3) continue;

    const first = cells[0];
    if (
      new RegExp(marker, "i").test(cells.join(" ")) &&
      !/Fee|Total|Average/i.test(first) &&
      !parseDateLabel(first)
    ) {
      tickers = cells.slice(1).filter((c) => c && !/^Total$/i.test(c));
      continue;
    }

    if (/^(Fee|Seed|Total|Average|Maximum|Minimum)$/i.test(first)) continue;

    const iso = parseDateLabel(first);
    if (!iso) continue;

    const nums = cells.slice(1).map(parseNumberCell);
    let totalUsdM: number | null = null;
    for (let i = nums.length - 1; i >= 0; i--) {
      if (nums[i] != null) {
        totalUsdM = nums[i];
        break;
      }
    }
    if (totalUsdM == null) continue;

    const defined = nums.filter((n) => n != null).length;
    if (defined <= 1 && totalUsdM === 0) continue;

    const byTicker: Record<string, number | null> = {};
    tickers.forEach((t, i) => {
      if (t && !/^Total$/i.test(t)) byTicker[t] = nums[i] ?? null;
    });

    flows.push({
      date: iso,
      dateLabel: first,
      totalUsdM,
      byTicker,
    });
  }

  if (!flows.length) {
    throw new Error(`Farside ${marker}: zero dias parseáveis`);
  }

  return flows.sort((a, b) => a.date.localeCompare(b.date));
}

function streak(history: EtfDailyFlow[]): number {
  if (!history.length) return 0;
  const last = history[history.length - 1].totalUsdM;
  if (last === 0) return 0;
  const sign = Math.sign(last);
  let n = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const v = history[i].totalUsdM;
    if (v === 0 || Math.sign(v) !== sign) break;
    n++;
  }
  return sign * n;
}

function sumLast(history: EtfDailyFlow[], n: number): number | null {
  if (!history.length) return null;
  return history.slice(-n).reduce((s, d) => s + d.totalUsdM, 0);
}

async function scrapeAsset(
  asset: "BTC" | "ETH" | "SOL",
  url: string,
  marker: string,
): Promise<EtfAssetFlows> {
  const html = await fetchHtml(url);
  const history = parseFarsideTable(html, marker).slice(-40);
  const latest = history[history.length - 1] ?? null;
  const previous = history[history.length - 2] ?? null;
  if (!latest) throw new Error(`Farside ${asset}: sem latest`);

  return {
    asset,
    unit: "USDm",
    latest,
    previous,
    streakDays: streak(history),
    sum5dUsdM: sumLast(history, 5),
    sum20dUsdM: sumLast(history, 20),
    history,
    source: "Farside Investors",
    sourceUrl: url,
    updatedAt: new Date().toISOString(),
  };
}

function buildSignal(btc: EtfAssetFlows, eth: EtfAssetFlows): EtfSnapshot["signal"] {
  const b = btc.latest?.totalUsdM ?? 0;
  const e = eth.latest?.totalUsdM ?? 0;
  const combined = b + e;
  const b5 = btc.sum5dUsdM ?? 0;

  if (combined > 50 && b5 > 0) {
    return {
      tone: "up",
      spotBidPt:
        "Fluxos ETF spot positivos — procura institucional via canais spot (criar unidades ≈ comprar BTC/ETH).",
      spotBidEn:
        "Positive spot ETF flows — institutional demand via spot channels (creating shares ≈ buying BTC/ETH).",
    };
  }
  if (combined < -50 && b5 < 0) {
    return {
      tone: "down",
      spotBidPt:
        "Saídas líquidas nos ETF spot — pressão de venda no spot institucional (resgatar ≈ vender o activo subjacente).",
      spotBidEn:
        "Net spot ETF outflows — institutional spot selling pressure (redeem ≈ sell underlying).",
    };
  }
  if (Math.abs(combined) < 20) {
    return {
      tone: "neutral",
      spotBidPt:
        "Fluxos ETF próximos de neutro — pouca confirmação de procura spot institucional hoje.",
      spotBidEn:
        "ETF flows near flat — little confirmation of institutional spot bid today.",
    };
  }
  return {
    tone: "warn",
    spotBidPt:
      "Sinal misto entre ETF de BTC e ETH — lê o total e a série de 5 dias antes de concluir.",
    spotBidEn:
      "Mixed BTC vs ETH ETF signal — read the total and 5-day series before concluding.",
  };
}

/** Cron/ingest only — never call from page render. */
export async function ingestEtfSnapshot(): Promise<EtfSnapshot> {
  const results = await Promise.allSettled(
    PAGES.map((p) => scrapeAsset(p.asset, p.url, p.marker)),
  );

  const byAsset = {
    BTC: null as EtfAssetFlows | null,
    ETH: null as EtfAssetFlows | null,
    SOL: null as EtfAssetFlows | null,
  };
  const errors: string[] = [];
  results.forEach((r, i) => {
    const asset = PAGES[i].asset;
    if (r.status === "fulfilled") byAsset[asset] = r.value;
    else errors.push(`${asset}: ${r.reason instanceof Error ? r.reason.message : r.reason}`);
  });

  if (!byAsset.BTC || !byAsset.ETH) {
    throw new Error(
      `ETF ingest falhou (BTC/ETH obrigatórios). ${errors.join("; ")}`,
    );
  }

  const snap: EtfSnapshot = {
    btc: byAsset.BTC,
    eth: byAsset.ETH,
    sol: byAsset.SOL,
    signal: buildSignal(byAsset.BTC, byAsset.ETH),
    stale: false,
    ingestedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await writeSnapshot("etf", snap, "farside.co.uk (fetch, no curl)");
  if (errors.length) {
    console.warn("[etf ingest partial]", errors.join("; "));
  }
  return snap;
}

/**
 * Render path: read slim snapshot only. Never scrapes Farside.
 */
export async function fetchEtfSnapshot(): Promise<EtfSnapshot | null> {
  const snap = await readSnapshot<EtfSnapshot>("etf");
  if (!snap?.btc?.latest || !snap?.eth?.latest) return null;
  return {
    ...snap,
    stale: isSnapshotStale(snap.ingestedAt || snap.updatedAt, STALE_MS),
  };
}
