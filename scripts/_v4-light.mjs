import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
const OUT = "audit-shots/v4";
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const ROUTES = ["", "/mercado", "/fluxos", "/defi", "/cadeias", "/casos", "/aprender", "/ferramentas", "/brief", "/mesa"];

// Desktop light — all routes
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(`pageerror: ${e.message}`));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 120)); });
  await page.goto("http://localhost:3000/pt", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.setItem("clareza-theme", "light"));
  for (const r of ROUTES) {
    await page.goto(`http://localhost:3000/pt${r}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const theme = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    const name = `pt-light${r.replace(/\//g, "_") || "_home"}`;
    await page.screenshot({ path: `${OUT}/${name}.png` });
    const ov = await page.evaluate(() => ({
      docW: document.documentElement.scrollWidth, winW: window.innerWidth, sx: window.scrollX,
    }));
    console.log(`${name}: theme=${theme} ${ov.docW > ov.winW + 2 ? `OVERFLOW(docW=${ov.docW},sx=${ov.sx})` : "ok"}`);
  }
  if (errs.length) console.log("ERRS:", errs.slice(0, 6).join(" | "));
  await ctx.close();
}
// Mobile light — key routes
{
  const ctx = await b.newContext({ viewport: { width: 375, height: 720 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000/pt", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.setItem("clareza-theme", "light"));
  for (const r of ["", "/mercado", "/fluxos", "/defi", "/casos", "/brief"]) {
    await page.goto(`http://localhost:3000/pt${r}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);
    const ov = await page.evaluate(() => ({
      theme: document.documentElement.getAttribute("data-theme"),
      docW: document.documentElement.scrollWidth, winW: window.innerWidth,
    }));
    await page.screenshot({ path: `${OUT}/m375-light${r.replace(/\//g, "_") || "_home"}.png` });
    console.log(`m375-light${r || "/"}: theme=${ov.theme} ${ov.docW > ov.winW + 2 ? `OVERFLOW(${ov.docW})` : "ok"}`);
  }
  await ctx.close();
}
await b.close();
console.log("done");
