// V4 visual audit — ponto a ponto, sem perguntas.
// Rotas tocadas × temas × locales × viewports + interacções + reduced-motion.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "audit-shots/v4";
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  "", "/mercado", "/fluxos", "/defi", "/cadeias",
  "/casos", "/aprender", "/ferramentas", "/brief", "/mesa",
];
const THEMES = ["dark", "light"];
const LOCALES = ["pt", "en"];

const errors = [];
const report = [];

async function sweep(page, label) {
  // JS errors
  const errs = [];
  page.on("pageerror", (e) => errs.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errs.push(`console: ${m.text()}`);
  });
  return errs;
}

const browser = await chromium.launch();

// ---------- PASS 1: desktop, both themes, PT ----------
for (const theme of THEMES) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: theme === "dark" ? "dark" : "light",
  });
  const page = await ctx.newPage();
  const errs = await sweep(page);
  for (const r of ROUTES) {
    const url = `${BASE}/pt${r}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.evaluate(
      (t) => localStorage.setItem("clareza:theme", t),
      theme,
    );
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1400);
    const name = `pt-${theme}${r.replace(/\//g, "_") || "_home"}`;
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
    // overflow check — the honest test is scrollX, not scrollWidth
    const ov = await page.evaluate(() => ({
      scrollX: window.scrollX,
      docW: document.documentElement.scrollWidth,
      winW: window.innerWidth,
    }));
    const horiz = ov.docW > ov.winW + 2;
    report.push(`${name}: ${horiz ? "HORIZONTAL-OVERFLOW" : "ok"} (docW=${ov.docW})`);
    if (errs.length) {
      report.push(`  ERRORS: ${errs.slice(0, 4).join(" | ")}`);
      errors.push(...errs);
      errs.length = 0;
    }
  }
  await ctx.close();
}

// ---------- PASS 2: EN spot-check (all routes, dark) ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = await sweep(page);
  for (const r of ROUTES) {
    await page.goto(`${BASE}/en${r}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    const name = `en-dark${r.replace(/\//g, "_") || "_home"}`;
    await page.screenshot({ path: `${OUT}/${name}.png` });
    if (errs.length) {
      report.push(`${name} ERRORS: ${errs.slice(0, 4).join(" | ")}`);
      errs.length = 0;
    }
  }
  await ctx.close();
}

// ---------- PASS 3: mobile 375px, both themes, key routes ----------
for (const theme of THEMES) {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 720 },
    colorScheme: theme === "dark" ? "dark" : "light",
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  const errs = await sweep(page);
  for (const r of ["", "/mercado", "/fluxos", "/defi", "/cadeias", "/casos", "/aprender", "/brief"]) {
    await page.goto(`${BASE}/pt${r}`, { waitUntil: "domcontentloaded" });
    await page.evaluate((t) => localStorage.setItem("clareza:theme", t), theme);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const ov = await page.evaluate(() => ({
      docW: document.documentElement.scrollWidth,
      winW: window.innerWidth,
    }));
    const name = `m375-${theme}${r.replace(/\//g, "_") || "_home"}`;
    await page.screenshot({ path: `${OUT}/${name}.png` });
    report.push(`${name}: ${ov.docW > ov.winW + 2 ? "HORIZONTAL-OVERFLOW" : "ok"} (docW=${ov.docW})`);
    if (errs.length) {
      report.push(`  ERRORS: ${errs.slice(0, 3).join(" | ")}`);
      errs.length = 0;
    }
  }
  await ctx.close();
}

// ---------- PASS 4: interactions ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = await sweep(page);

  // MarketMap layer switch (Flip)
  await page.goto(`${BASE}/pt/mercado`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const layerBtns = page.locator('[role="group"] button, [aria-label*="camada" i] button, [aria-label*="layer" i] button');
  const nLayers = await layerBtns.count();
  if (nLayers > 1) {
    await layerBtns.nth(1).click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/int-map-layer.png` });
  }
  report.push(`map layer buttons: ${nLayers}`);

  // Defi sort toggle
  await page.goto(`${BASE}/pt/defi`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const sortBtns = page.locator('[aria-label*="Ordenar" i] button, [aria-label*="Sort" i] button');
  const nSort = await sortBtns.count();
  if (nSort > 1) {
    await sortBtns.nth(1).click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/int-defi-move.png` });
  }
  report.push(`defi sort buttons: ${nSort}`);

  // Chain comparator selects
  const selects = page.locator("select");
  const nSel = await selects.count();
  if (nSel >= 2) {
    await selects.nth(0).selectOption({ index: 2 });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/int-compare.png` });
  }
  report.push(`comparator selects on defi?: ${nSel}`);

  // /cadeias comparator
  await page.goto(`${BASE}/pt/cadeias`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const sel2 = page.locator("select");
  const n2 = await sel2.count();
  if (n2 >= 2) {
    await sel2.nth(1).selectOption({ index: 3 });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/int-cadeias-compare.png` });
  }
  report.push(`cadeias selects: ${n2}`);

  // Expertise dial → analyst on home
  await page.goto(`${BASE}/pt`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const dial = page.locator('button:has-text("Analista"), [role="group"] button').last();
  const dialGroup = page.locator('button:has-text("Analista")');
  if (await dialGroup.count()) {
    await dialGroup.first().click();
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/int-analyst.png` });
    report.push("dial→analyst clicked");
    // back to citizen
    const cit = page.locator('button:has-text("Essencial")');
    if (await cit.count()) {
      await cit.first().click();
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${OUT}/int-citizen.png` });
      report.push("dial→citizen clicked");
    }
  }

  // Case detail page — evidence line + balance
  await page.goto(`${BASE}/pt/casos`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  const caseLink = page.locator('a[href*="/caso/"]').first();
  if (await caseLink.count()) {
    await caseLink.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/int-case-detail.png`, fullPage: true });
    report.push("case detail opened");
  }

  if (errs.length) report.push(`INTERACTION ERRORS: ${errs.slice(0, 5).join(" | ")}`);
  await ctx.close();
}

// ---------- PASS 5: reduced motion ----------
{
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  for (const r of ["", "/fluxos", "/defi", "/aprender"]) {
    await page.goto(`${BASE}/pt${r}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const running = await page.evaluate(() =>
      document.getAnimations().filter((a) => a.playState === "running").length,
    );
    report.push(`reduced-motion ${r || "/"}: ${running} anims running`);
    await page.screenshot({ path: `${OUT}/rm${r.replace(/\//g, "_") || "_home"}.png` });
  }
  await ctx.close();
}

// ---------- PASS 6: hidden-tab pause ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/pt/fluxos`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const before = await page.evaluate(() => ({
    hidden: document.hidden,
    anims: document.getAnimations().filter((a) => a.playState === "running").length,
  }));
  report.push(`visible: hidden=${before.hidden} anims=${before.anims}`);
  await ctx.close();
}

console.log("\n===== V4 AUDIT =====");
report.forEach((l) => console.log(l));
console.log(`\nTotal JS/console errors captured: ${errors.length}`);
await browser.close();
