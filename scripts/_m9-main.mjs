import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

// Auditoria principal M9 — fps, render frio/quente, pausa em oculto,
// reduced-motion, 375px real, teclado, dados inventados, stress de leitura.
const BASE = "http://localhost:3000";
const PAGES = ["/pt", "/pt/mercado", "/pt/fluxos", "/pt/defi", "/pt/cadeias", "/pt/casos", "/pt/aprender", "/pt/mesa"];
const report = { generatedAt: new Date().toISOString(), fps: {}, render: {}, reducedMotion: {}, hidden: {}, mobile: {}, keyboard: {}, dataIntegrity: {}, stress: {} };
mkdirSync("data/audit", { recursive: true });
const browser = await chromium.launch();

// ---------- 1+2. fps na interacção mais pesada + render frio/quente ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const fps = async (ms) => page.evaluate((dur) => new Promise((res) => {
    let n = 0; const t0 = performance.now();
    const tick = () => { n += 1; if (performance.now() - t0 < dur) requestAnimationFrame(tick); else res(+(n / ((performance.now() - t0) / 1000)).toFixed(1)); };
    requestAnimationFrame(tick);
  }), ms);

  for (const path of PAGES) {
    // frio: primeira navegação completa
    const t0 = Date.now();
    await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
    const coldMs = Date.now() - t0;
    const timing = await page.evaluate(() => {
      const n = performance.getEntriesByType("navigation")[0];
      const lcp = performance.getEntriesByType("largest-contentful-paint").at(-1);
      return { dcl: Math.round(n?.domContentLoadedEventEnd ?? 0), load: Math.round(n?.loadEventEnd ?? 0), lcp: lcp ? Math.round(lcp.startTime) : null };
    });
    // quente: re-navegação (cache quente da app)
    const t1 = Date.now();
    await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => {});
    const warmMs = Date.now() - t1;
    report.render[path] = { coldMs, warmMs, ...timing };
    report.fps[path] = await fps(1200);
  }

  // fps sob stress: troca de camada no mapa de /mercado
  await page.goto(BASE + "/pt/mercado", { waitUntil: "networkidle", timeout: 30000 });
  await page.locator("button", { hasText: /Funding/i }).first().scrollIntoViewIfNeeded().catch(() => {});
  const layerBtn = page.locator("button", { hasText: /^Funding$/i }).first();
  const p1 = fps(1500);
  await layerBtn.click().catch(() => {});
  await p1.then((v) => (report.fps["mercado-layer-switch"] = v));
  const p2 = fps(1500);
  await page.locator("button", { hasText: /^Volume$/i }).first().click().catch(() => {});
  await p2.then((v) => (report.fps["mercado-layer-switch-2"] = v));
  await ctx.close();
}

// ---------- 4. pausa com página oculta ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/pt", { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(1500);
  const running = () => page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  const before = await running();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { value: true, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(800);
  const afterHidden = await running();
  const subdued = await page.evaluate(() => document.querySelectorAll(".map-tile-vibe, [style*='animation']").length);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { value: false, configurable: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(800);
  const afterVisible = await running();
  report.hidden = { runningBefore: before, runningAfterHidden: afterHidden, runningAfterVisible: afterVisible, animatedElsAfterHidden: subdued };
  await ctx.close();
}

// ---------- 5. reduced-motion — nada contínuo pode mexer ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(1600);
    report.reducedMotion[path] = await page.evaluate(() => ({
      running: document.getAnimations().filter((a) => a.playState === "running").length,
      infinite: document.getAnimations().filter((a) => a.playState === "running" && a.effect?.getTiming?.().iterations === Infinity).length,
    }));
  }
  await ctx.close();
}

// ---------- 6. legibilidade sob stress — amplitude + texto estável ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/pt", { waitUntil: "networkidle", timeout: 30000 });
  report.stress = await page.evaluate(() => {
    const vib = getComputedStyle(document.querySelector("[style*='--vib-amp']") ?? document.body).getPropertyValue("--vib-amp").trim();
    let maxAmp = vib || "n/a";
    let transformedText = 0;
    document.querySelectorAll("p, h1, h2, h3, span, td, th").forEach((el) => {
      const tf = getComputedStyle(el).transform;
      if (tf && tf !== "none") transformedText++;
    });
    // animações infinitas activas agora
    const infiniteNow = document.getAnimations().filter((a) => a.playState === "running" && a.effect?.getTiming?.().iterations === Infinity).length;
    return { vibAmp: maxAmp, transformedTextEls: transformedText, infiniteAnimationsNow: infiniteNow };
  });
  await ctx.close();
}

// ---------- 7. 375px — scroll horizontal REAL ----------
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 760 } });
  const page = await ctx.newPage();
  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(900);
    report.mobile[path] = await page.evaluate(() => {
      const before = window.scrollX;
      window.scrollTo(60, 0);
      const can = window.scrollX > 0;
      window.scrollTo(before, 0);
      return { canScrollX: can };
    });
  }
  await ctx.close();
}

// ---------- 9. teclado + nomes acessíveis ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  for (const path of ["/pt", "/pt/mercado", "/pt/fluxos", "/pt/casos"]) {
    await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
    const r = await page.evaluate(() => {
      const els = [...document.querySelectorAll("button, a[href], [role='button'], [tabindex]:not([tabindex='-1'])")];
      const noName = els.filter((el) => !(el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.textContent.trim() || el.getAttribute("title"))).length;
      return { interactive: els.length, missingName: noName };
    });
    // Tab: o foco é visível?
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const focusVisible = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return "body";
      const cs = getComputedStyle(el);
      return cs.outlineStyle !== "none" || cs.boxShadow !== "none" || cs.outlineWidth !== "0px" ? "visible" : "maybe-hidden";
    });
    report.keyboard[path] = { ...r, focusVisible };
  }
  await ctx.close();
}

// ---------- 10. dados inventados — varrimento de texto ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(800);
    report.dataIntegrity[path] = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        nan: (text.match(/\bNaN\b/g) || []).length,
        undefined: (text.match(/\bundefined\b/g) || []).length,
        nullWord: (text.match(/\bnull\b/g) || []).length,
        dashes: (text.match(/—/g) || []).length,
        staleFlags: (text.match(/desactualizad|stale|indisponív|unavailable/gi) || []).length,
      };
    });
  }
  await ctx.close();
}

await browser.close();
writeFileSync("data/audit/m9-main.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
