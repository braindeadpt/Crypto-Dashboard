import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const OUT = "audit-shots/v4";
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on("pageerror", (e) => errs.push(`PAGEERROR: ${e.message.slice(0, 140)}`));
page.on("console", (m) => { if (m.type() === "error") errs.push(`console: ${m.text().slice(0, 140)}`); });

// 1. /fluxos dark + light — caudal no poço, sem crash .v
for (const theme of ["dark", "light"]) {
  await page.goto("http://localhost:3000/pt", { waitUntil: "domcontentloaded" });
  await page.evaluate((t) => localStorage.setItem("clareza-theme", t), theme);
  await page.goto("http://localhost:3000/pt/fluxos", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.locator("canvas").first().scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/v2-fluxos-${theme}.png` });
}
// 2. Dial — Essencial vs Analista hero
await page.goto("http://localhost:3000/pt", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1800);
await page.screenshot({ path: `${OUT}/v2-home-essencial.png` });
const analista = page.locator('button:has-text("Analista")');
if (await analista.count()) {
  await analista.first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/v2-home-analista.png` });
}
// 3. MarketMap flip shot (capture mid-transition)
await page.goto("http://localhost:3000/pt/mercado", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1800);
const groups = page.locator('[role="group"]');
const layerBtn = page.locator('button:has-text("Funding"), button:has-text("funding")').first();
if (await layerBtn.count()) {
  await layerBtn.click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${OUT}/v2-map-midflip.png` });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/v2-map-funding.png` });
}
// 4. home corrente live state
await page.goto("http://localhost:3000/pt", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3500);
await page.screenshot({ path: `${OUT}/v2-corrente.png`, clip: { x: 0, y: 0, width: 1440, height: 560 } });
console.log("errors:", errs.length ? errs.join("\n") : "none");
await b.close();
console.log("done");
