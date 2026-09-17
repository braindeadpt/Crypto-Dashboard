// Auditoria de interacção — clica TODOS os controlos de cada página e verifica
// efeito observável (aria, DOM, navegação). O que as auditorias anteriores
// nunca fizeram: medir se um clique produz resultado.
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = "http://localhost:3000";
const PAGES = [
  "/pt", "/pt/mercado", "/pt/fluxos", "/pt/defi", "/pt/cadeias",
  "/pt/casos", "/pt/aprender", "/pt/ferramentas", "/pt/mesa",
  "/pt/brief", "/pt/estilo", "/pt/metodologia",
];

const report = [];

for (const path of PAGES) {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  p.on("pageerror", (e) => errors.push(String(e)));

  await p.goto(BASE + path, { waitUntil: "domcontentloaded" });
  await p.waitForLoadState("networkidle").catch(() => {});
  await p.waitForTimeout(1500);

  // Cada controlo visível: button, details>summary, [role=tab], select
  const controls = await p.$$eval(
    "button, summary, [role='tab'], select, input[type='checkbox'], input[type='radio']",
    (els) =>
      els
        .filter((e) => e.offsetParent !== null)
        .map((e, i) => ({
          i,
          tag: e.tagName.toLowerCase(),
          role: e.getAttribute("role") || "",
          name:
            (e.getAttribute("aria-label") ||
              e.textContent ||
              e.getAttribute("value") ||
              "").trim().slice(0, 60),
          pressed: e.getAttribute("aria-pressed"),
          expanded: e.getAttribute("aria-expanded"),
          checked: e.getAttribute("aria-checked"),
        })),
  );

  const results = [];
  for (const c of controls) {
    // localizar pelo índice na lista completa de controlos

    const el = (await p.$$("button, summary, [role='tab'], select"))[c.i];
    if (!el) continue;
    const before = await p.evaluate(() => document.body.innerHTML.length);
    let effect = "none";
    try {
      await el.click({ timeout: 2000 });
      await p.waitForTimeout(400);
      const after = await p.evaluate(() => document.body.innerHTML.length);
      const pressed = await el.getAttribute("aria-pressed");
      const expanded = await el.getAttribute("aria-expanded");
      const checked = await el.getAttribute("aria-checked");
      if (pressed === "true" || expanded === "true" || checked === "true")
        effect = "aria";
      else if (before !== after) effect = "dom";
      else if (p.url() !== BASE + path) effect = "nav";
    } catch {
      effect = "click-failed";
    }
    if (effect === "none" || effect === "click-failed")
      results.push({ name: c.name || c.tag, effect });
  }

  report.push({ path, controls: controls.length, dead: results, errors });
  console.log(
    `${path}: ${controls.length} controlos, ${results.length} sem efeito, ${errors.length} erros`,
  );
  for (const r of results) console.log(`   ✗ ${r.effect} — "${r.name}"`);
  await b.close();
}

writeFileSync("audit-shots/interaction-audit.json", JSON.stringify(report, null, 2));
const total = report.reduce((s, r) => s + r.dead.length, 0);
console.log(`\nTOTAL: ${total} controlos sem efeito observável`);
