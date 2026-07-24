import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { parseFarsideTable, type EtfAssetFlows, type EtfSnapshot } from "../src/lib/data/etf";
import { refreshHeavySnapshots } from "../src/lib/data/refreshHeavy";

const execFileAsync = promisify(execFile);

const PAGES = [
  { asset: "BTC" as const, url: "https://farside.co.uk/btc/", marker: "IBIT" },
  { asset: "ETH" as const, url: "https://farside.co.uk/eth/", marker: "ETHA" },
  { asset: "SOL" as const, url: "https://farside.co.uk/sol/", marker: "FSOL" },
];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Seed helper only (not used on the render path).
 * Farside blocks plain fetch with CF; system curl often works for offline ingest.
 */
async function curlHtml(url: string): Promise<string> {
  const curlBin = process.platform === "win32" ? "curl.exe" : "curl";
  const { stdout } = await execFileAsync(
    curlBin,
    [
      "-sL",
      "--max-time",
      "25",
      "-A",
      UA,
      "-H",
      "Accept: text/html,application/xhtml+xml",
      url,
    ],
    { maxBuffer: 5 * 1024 * 1024, windowsHide: true },
  );
  if (!stdout.includes("<table") || stdout.includes("Just a moment")) {
    throw new Error(`curl seed failed for ${url}`);
  }
  return stdout;
}

function streak(history: { totalUsdM: number }[]): number {
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

function sumLast(history: { totalUsdM: number }[], n: number): number | null {
  if (!history.length) return null;
  return history.slice(-n).reduce((s, d) => s + d.totalUsdM, 0);
}

async function seedEtfViaCurl(): Promise<boolean> {
  try {
    const flows: Partial<Record<"BTC" | "ETH" | "SOL", EtfAssetFlows>> = {};
    for (const p of PAGES) {
      try {
        const html = await curlHtml(p.url);
        const history = parseFarsideTable(html, p.marker).slice(-40);
        const latest = history[history.length - 1];
        if (!latest) continue;
        flows[p.asset] = {
          asset: p.asset,
          unit: "USDm",
          latest,
          previous: history[history.length - 2] ?? null,
          streakDays: streak(history),
          sum5dUsdM: sumLast(history, 5),
          sum20dUsdM: sumLast(history, 20),
          history,
          source: "Farside Investors",
          sourceUrl: p.url,
          updatedAt: new Date().toISOString(),
        };
      } catch (e) {
        console.warn(`[etf curl seed] ${p.asset}`, e);
      }
    }
    if (!flows.BTC || !flows.ETH) return false;

    const b = flows.BTC.latest!.totalUsdM;
    const e = flows.ETH.latest!.totalUsdM;
    const combined = b + e;
    const b5 = flows.BTC.sum5dUsdM ?? 0;
    let signal: EtfSnapshot["signal"];
    if (combined > 50 && b5 > 0) {
      signal = {
        tone: "up",
        spotBidPt:
          "Fluxos ETF spot positivos — procura institucional via canais spot.",
        spotBidEn: "Positive spot ETF flows — institutional spot demand.",
      };
    } else if (combined < -50 && b5 < 0) {
      signal = {
        tone: "down",
        spotBidPt: "Saídas líquidas nos ETF spot — pressão de venda institucional.",
        spotBidEn: "Net spot ETF outflows — institutional selling pressure.",
      };
    } else if (Math.abs(combined) < 20) {
      signal = {
        tone: "neutral",
        spotBidPt: "Fluxos ETF próximos de neutro.",
        spotBidEn: "ETF flows near flat.",
      };
    } else {
      signal = {
        tone: "warn",
        spotBidPt: "Sinal misto entre ETF de BTC e ETH.",
        spotBidEn: "Mixed BTC vs ETH ETF signal.",
      };
    }

    const snap: EtfSnapshot = {
      btc: flows.BTC,
      eth: flows.ETH,
      sol: flows.SOL ?? null,
      signal,
      stale: false,
      ingestedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: "farside.co.uk (curl seed script)",
    } as EtfSnapshot & { source: string };

    const dir = path.join(process.cwd(), "data", "snapshots");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, "etf.json"),
      JSON.stringify({ ...snap, source: "farside.co.uk (curl seed script)" }, null, 0),
      "utf8",
    );
    console.log("ETF snapshot seeded via curl");
    return true;
  } catch (e) {
    console.warn("[etf curl seed]", e);
    return false;
  }
}

async function main() {
  console.log("Refreshing heavy DefiLlama snapshots…");
  const started = Date.now();
  const result = await refreshHeavySnapshots();
  console.log(
    `Done in ${((Date.now() - started) / 1000).toFixed(1)}s — yields=${result.yieldsPools} protocols=${result.defiProtocols} etfOk=${result.etfOk} TVL=${result.tvlSource}`,
  );
  if (!result.etfOk) {
    console.log("Retrying ETF via curl seed (offline ingest only)…");
    await seedEtfViaCurl();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
