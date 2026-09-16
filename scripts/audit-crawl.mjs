/**
 * Crawl de auditoria — visita todas as rotas internas a partir de /pt e /en,
 * segue cada link, verifica âncoras, regista erros de consola, requests
 * falhados e marcadores de dados em falta.
 *
 * Uso: `npx next start -p 3100` noutro terminal, depois
 * `node scripts/audit-crawl.mjs`
 * Saída: data/audit/crawl-report.md + .json (gitignored)
 */
import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const BASE = process.env.AUDIT_BASE ?? "http://localhost:3100";
const SEEDS = ["/pt", "/en"];
const MAX_PAGES = 200;
const NAV_TIMEOUT = 45_000;

/** @type {Map<string, {status:number, consoleErrors:string[], pageErrors:string[], failedRequests:string[], missing:{unavailable:number, error:number}, ids:Set<string>}>} */
const pages = new Map();
/** @type {Map<string, Set<string>>} link target (sem hash) -> origens */
const linkSources = new Map();
/** @type {Map<string, Set<string>>} "page#anchor" -> origens */
const anchorRefs = new Map();
/** @type {Map<string, Set<string>>} url externo -> origens */
const external = new Map();

const queue = [...SEEDS];
const seen = new Set();

const browser = await chromium.launch();
const page = await browser.newPage();

while (queue.length && pages.size < MAX_PAGES) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  seen.add(path);

  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const onConsole = (m) => {
    if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200));
  };
  const onPageError = (e) => pageErrors.push(String(e).slice(0, 200));
  const onResponse = (r) => {
    if (r.status() >= 400 && r.url() !== `${BASE}${path}`)
      failedRequests.push(`${r.status()} ${r.url().slice(0, 140)}`);
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("response", onResponse);

  let status = 0;
  try {
    const resp = await page.goto(`${BASE}${path}`, {
      waitUntil: "domcontentloaded",
      timeout: NAV_TIMEOUT,
    });
    status = resp?.status() ?? 0;
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    await page.waitForTimeout(600);
  } catch (e) {
    pageErrors.push(`navigation: ${String(e).slice(0, 160)}`);
  }

  let links = [];
  let ids = [];
  let missing = { unavailable: 0, error: 0 };
  try {
    links = await page.$$eval("a[href]", (as) =>
      as.map((a) => a.getAttribute("href")),
    );
    ids = await page.$$eval("[id]", (els) => els.map((e) => e.id));
    missing = await page.evaluate(() => {
      const t = document.body?.innerText ?? "";
      return {
        unavailable: (t.match(/indisponível|unavailable|sem dados/gi) ?? [])
          .length,
        error: (
          t.match(/não foi possível|could not (fetch|load)|error loading/gi) ??
          []
        ).length,
      };
    });
  } catch {
    /* página não renderizou */
  }

  pages.set(path, {
    status,
    consoleErrors,
    pageErrors,
    failedRequests,
    missing,
    ids: new Set(ids),
  });

  for (const href of links) {
    if (!href || href.startsWith("mailto:") || href.startsWith("tel:"))
      continue;
    let u;
    try {
      u = new URL(href, `${BASE}${path}`);
    } catch {
      continue;
    }
    if (u.origin !== BASE) {
      if (!external.has(u.href)) external.set(u.href, new Set());
      external.get(u.href).add(path);
      continue;
    }
    const clean = u.pathname.replace(/\/+$/, "") || "/";
    if (!linkSources.has(clean)) linkSources.set(clean, new Set());
    linkSources.get(clean).add(path);
    if (u.hash) {
      const key = `${clean}${u.hash}`;
      if (!anchorRefs.has(key)) anchorRefs.set(key, new Set());
      anchorRefs.get(key).add(path);
    }
    if (
      !seen.has(clean) &&
      !queue.includes(clean) &&
      /^\/(pt|en|api)?/.test(clean)
    ) {
      queue.push(clean);
    }
  }

  page.off("console", onConsole);
  page.off("pageerror", onPageError);
  page.off("response", onResponse);
  process.stdout.write(
    `\rcrawled ${pages.size} páginas · fila ${queue.length}   `,
  );
}
await browser.close();

// Âncoras: o alvo existe no DOM da página de destino?
const brokenAnchors = [];
for (const [key, sources] of anchorRefs) {
  const [target, hash] = key.split("#");
  const pg = pages.get(target);
  if (!pg) {
    brokenAnchors.push({ key, reason: "target page not crawled", sources });
  } else if (!pg.ids.has(hash)) {
    brokenAnchors.push({ key, reason: "id not found", sources });
  }
}

// Links internos que apontam a páginas com erro
const brokenLinks = [];
for (const [target, sources] of linkSources) {
  const pg = pages.get(target);
  if (pg && pg.status >= 400) {
    brokenLinks.push({ target, status: pg.status, sources: [...sources] });
  }
}

// Links externos — HEAD/GET com timeout
const externalResults = [];
for (const [url, sources] of external) {
  let status = 0;
  let note = "";
  try {
    const r = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(10_000),
      redirect: "follow",
    });
    status = r.status;
    if (status === 405 || status === 403) {
      const g = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(10_000),
        redirect: "follow",
      });
      status = g.status;
      note = "HEAD refused; GET used";
    }
  } catch (e) {
    note = String(e).slice(0, 100);
  }
  externalResults.push({ url, status, note, sources: [...sources] });
}

// ——— Relatório ———
const lines = [];
lines.push(`# Crawl audit — ${new Date().toISOString()}`);
lines.push(`Base: ${BASE} · ${pages.size} páginas visitadas\n`);

const bad = [...pages.entries()].filter(([, p]) => p.status >= 400 || p.status === 0);
lines.push(`## Páginas com erro de status (${bad.length})`);
for (const [p, d] of bad) lines.push(`- ${p} → HTTP ${d.status}`);

lines.push(`\n## Links internos partidos (${brokenLinks.length})`);
for (const l of brokenLinks)
  lines.push(`- ${l.target} → ${l.status} · linkado de: ${l.sources.join(", ")}`);

lines.push(`\n## Âncoras partidas (${brokenAnchors.length})`);
for (const a of brokenAnchors)
  lines.push(`- ${a.key} (${a.reason}) · linkado de: ${[...a.sources].join(", ")}`);

const conErr = [...pages.entries()].filter(([, p]) => p.consoleErrors.length || p.pageErrors.length);
lines.push(`\n## Erros de consola/página (${conErr.length} páginas)`);
for (const [p, d] of conErr) {
  lines.push(`- ${p}`);
  for (const e of d.consoleErrors.slice(0, 4)) lines.push(`  - console: ${e}`);
  for (const e of d.pageErrors.slice(0, 4)) lines.push(`  - pageerror: ${e}`);
}

const failed = [...pages.entries()].filter(([, p]) => p.failedRequests.length);
lines.push(`\n## Requests falhados dentro das páginas (${failed.length} páginas)`);
for (const [p, d] of failed)
  for (const r of d.failedRequests.slice(0, 6)) lines.push(`- ${p} → ${r}`);

const miss = [...pages.entries()].filter(([, p]) => p.missing.unavailable + p.missing.error > 0);
lines.push(`\n## Marcadores de dados em falta (${miss.length} páginas)`);
for (const [p, d] of miss)
  lines.push(`- ${p} → indisponível×${d.missing.unavailable}, erro×${d.missing.error}`);

const extBad = externalResults.filter((e) => e.status >= 400 || e.status === 0);
lines.push(`\n## Links externos falhados (${extBad.length}/${externalResults.length})`);
for (const e of extBad)
  lines.push(`- ${e.url} → ${e.status || e.note} · de: ${e.sources.join(", ")}`);

const report = lines.join("\n");
await mkdir("data/audit", { recursive: true });
await writeFile("data/audit/crawl-report.md", report);
await writeFile(
  "data/audit/crawl-report.json",
  JSON.stringify(
    {
      pages: Object.fromEntries(
        [...pages.entries()].map(([k, v]) => [
          k,
          { ...v, ids: [...v.ids] },
        ]),
      ),
      brokenLinks,
      brokenAnchors,
      externalResults,
    },
    null,
    2,
  ),
);
console.log(`\n\n${report}`);
