import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

// Amostrador de memória M9 — JS heap usado a cada 30s durante ~10 min,
// alternando entre /pt (socket ticker) e /fluxos (socket liquidações),
// as duas páginas com streams vivos. Crescimento contínuo = fuga.
const BASE = "http://localhost:3000";
const SAMPLES = 20;
const INTERVAL_MS = 30_000;

mkdirSync("data/audit", { recursive: true });
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();

const out = { startedAt: new Date().toISOString(), samples: [] };

await page.goto(BASE + "/pt", { waitUntil: "networkidle", timeout: 30000 });
for (let i = 0; i < SAMPLES; i++) {
  // alterna rotas para exercitar mount/unmount de sockets e animações
  const path = i % 2 === 0 ? "/pt/fluxos" : "/pt";
  await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const mem = await page.evaluate(() => {
    const m = performance.memory;
    return m ? { usedMB: +(m.usedJSHeapSize / 1048576).toFixed(1), totalMB: +(m.totalJSHeapSize / 1048576).toFixed(1) } : null;
  }).catch(() => null);
  out.samples.push({ i, path, t: new Date().toISOString(), ...mem });
  console.log(`[${i}] ${path} heap=${mem?.usedMB}MB`);
  if (i < SAMPLES - 1) await page.waitForTimeout(INTERVAL_MS - 1500 > 0 ? INTERVAL_MS - 1500 : 0);
}
out.finishedAt = new Date().toISOString();
const first = out.samples[0]?.usedMB, last = out.samples.at(-1)?.usedMB;
out.deltaMB = first != null && last != null ? +(last - first).toFixed(1) : null;
writeFileSync("data/audit/m9-memory.json", JSON.stringify(out, null, 2));
await browser.close();
console.log("DONE delta=" + out.deltaMB + "MB");
