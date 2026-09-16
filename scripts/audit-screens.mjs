// Full-route visual audit — screenshots every canonical page.
// Usage: node scripts/audit-screens.mjs  (needs prod server on :3000)
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "audit-shots";
mkdirSync(OUT, { recursive: true });

const DESKTOP = [
  "/pt", "/pt/mercado", "/pt/fluxos", "/pt/defi", "/pt/cadeias",
  "/pt/casos", "/pt/aprender", "/pt/ferramentas", "/pt/mesa",
  "/pt/brief", "/pt/estilo", "/pt/atlas/bitcoin",
  "/en", "/en/mercado", "/en/defi",
];
const MOBILE = ["/pt", "/pt/mercado", "/pt/casos", "/pt/aprender", "/pt/ferramentas", "/pt/fluxos"];

const slug = (p) => p.replaceAll("/", "_").replace(/^_+|_+$/g, "") || "home";

const browser = await chromium.launch();

async function shoot(page, path, file) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`PAGEERROR ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`CONSOLE ${m.text()}`);
  });
  const res = await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
  // content is SSR with client hydration; give charts/treemap time
  await page.waitForSelector("#main", { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${OUT}/${file}.png`, fullPage: true });
  console.log(`${file} :: ${res?.status()} :: ${errors.length ? "ERRORS: " + errors.slice(0, 3).join(" | ") : "clean"}`);
}

const dctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const dp = await dctx.newPage();
for (const r of DESKTOP) await shoot(dp, r, `d-${slug(r)}`);
await dp.close(); await dctx.close();

const mctx = await browser.newContext({
  viewport: { width: 375, height: 812 },
  isMobile: true,
  hasTouch: true,
});
const mp = await mctx.newPage();
for (const r of MOBILE) await shoot(mp, r, `m-${slug(r)}`);

await browser.close();
console.log("done");
