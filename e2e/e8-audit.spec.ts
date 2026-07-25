/**
 * E8 — structural audit: measure, don't claim.
 * Writes data/audit/e8-latest.json with real counts.
 */
import { expect, test, type Page } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

type PageMetrics = {
  path: string;
  chars: number;
  percentSigns: number;
  sections: number;
  sectionTags: number;
  svgs: number;
  tables: number;
  btcPriceHits: number;
  stressHits: number;
  headline: string;
  posture: string;
  watch: string;
};

async function gotoExpertise(
  page: Page,
  route: string,
  level: "citizen" | "operator" | "analyst",
) {
  await page.addInitScript((lv) => {
    localStorage.setItem("clareza-expertise", lv);
  }, level);
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.locator("#main").waitFor({ state: "visible", timeout: 45_000 });
  await page.locator("#main h1, #main h2").first().waitFor({
    state: "visible",
    timeout: 30_000,
  });
}

async function measureVisible(page: Page): Promise<PageMetrics> {
  return page.evaluate(() => {
    const main = document.querySelector("#main") ?? document.body;
    const text = (main.textContent ?? "").replace(/\s+/g, " ").trim();
    const percentSigns = (text.match(/%/g) ?? []).length;
    const root =
      document.querySelector("#main .enter") ??
      document.querySelector("#main") ??
      document.body;
    const sections = Array.from(root.children).filter((el) => {
      if (!(el instanceof HTMLElement)) return false;
      if (el.hidden || el.getAttribute("aria-hidden") === "true") return false;
      const style = getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden";
    }).length;
    const sectionTags = main.querySelectorAll("section, article").length;
    const svgs = main.querySelectorAll("svg").length;
    const tables = main.querySelectorAll("table").length;
    const btcLoose = (
      text.match(/BTC[\s\u00a0]{0,12}\$?\s?[\d,]{3,}/g) ?? []
    ).length;
    const stressHits = (
      text.match(/Stress\s*\d+|Stress\s*\{?score\}?/gi) ?? []
    ).length;
    // Also count plain "Stress" label near a number in pulso/ritual
    const stressLoose =
      stressHits || (text.match(/\bStress\b/gi) ?? []).length;
    const h1 = document.querySelector("#main h1")?.textContent?.trim() ?? "";
    const postureEl = Array.from(
      document.querySelectorAll("#main p, #main span, #main h2"),
    ).find((el) =>
      /Calmo|Instável|Tempestade|Misto|Calm|Unsettled|Storm|Weird/i.test(
        el.textContent ?? "",
      ),
    );
    const posture = (postureEl?.textContent ?? "").trim().slice(0, 80);
    const watch =
      Array.from(document.querySelectorAll("#main p"))
        .map((el) => el.textContent ?? "")
        .find((t) => /A vigiar|Watching|vigiar/i.test(t))
        ?.trim()
        .slice(0, 160) ?? "";

    return {
      path: location.pathname,
      chars: text.length,
      percentSigns,
      sections,
      sectionTags,
      svgs,
      tables,
      btcPriceHits: btcLoose,
      stressHits: stressLoose,
      headline: h1.slice(0, 240),
      posture,
      watch,
    };
  });
}

async function navTiming(page: Page, route: string): Promise<number> {
  const t0 = Date.now();
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.locator("#main").waitFor({ state: "visible", timeout: 45_000 });
  const client = await page.evaluate(() => {
    const nav = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming | undefined;
    return nav ? nav.domContentLoadedEventEnd : null;
  });
  return client ?? Date.now() - t0;
}

test.describe("E8 · structural audit", () => {
  test("measure home / mundo / contexto and write report", async ({
    page,
    browser,
  }) => {
    test.setTimeout(240_000);

    await gotoExpertise(page, "/pt", "operator");
    const home = await measureVisible(page);

    await gotoExpertise(page, "/pt/mundo", "operator");
    const mundo = await measureVisible(page);

    await gotoExpertise(page, "/pt/contexto", "operator");
    const contexto = await measureVisible(page);

    await gotoExpertise(page, "/pt", "citizen");
    const homeCitizen = await measureVisible(page);
    await gotoExpertise(page, "/pt", "operator");
    const homeOperator = await measureVisible(page);
    await gotoExpertise(page, "/pt", "analyst");
    // Stay on home even if dial prefers instrumento
    await page.goto("/pt", { waitUntil: "domcontentloaded" });
    await page.locator("#main").waitFor({ state: "visible", timeout: 45_000 });
    const homeAnalyst = await measureVisible(page);

    await gotoExpertise(page, "/pt/mundo", "citizen");
    const mundoCitizen = await measureVisible(page);
    await gotoExpertise(page, "/pt/mundo", "analyst");
    const mundoAnalyst = await measureVisible(page);

    const coldCtx = await browser.newContext();
    const coldPage = await coldCtx.newPage();
    const coldMs = await navTiming(coldPage, "/pt");
    const warmMs = await navTiming(coldPage, "/pt");
    await coldCtx.close();

    await page.setViewportSize({ width: 375, height: 812 });
    await gotoExpertise(page, "/pt", "citizen");
    const mobile = await page.evaluate(() => {
      const el = document.documentElement;
      const h1 = document.querySelector("#main h1")?.textContent?.trim() ?? "";
      return {
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        overflow: el.scrollWidth > el.clientWidth + 1,
        h1: h1.slice(0, 200),
      };
    });

    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/pt", { waitUntil: "domcontentloaded" });
    const motion = await page.evaluate(() => {
      const el = document.querySelector(".enter");
      if (!el) return { animationName: "none" };
      return { animationName: getComputedStyle(el).animationName };
    });

    const contrast = await page.evaluate(() => {
      const ratio = (a: string, b: string) => {
        const parse = (v: string) => {
          const hex = v.trim();
          if (hex.startsWith("#") && hex.length === 7) {
            return [
              parseInt(hex.slice(1, 3), 16),
              parseInt(hex.slice(3, 5), 16),
              parseInt(hex.slice(5, 7), 16),
            ] as const;
          }
          return [0, 0, 0] as const;
        };
        const lum = ([r, g, b]: readonly [number, number, number]) => {
          const f = (c: number) => {
            const s = c / 255;
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const L1 = lum(parse(a));
        const L2 = lum(parse(b));
        return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      };
      const measure = (theme: string) => {
        document.documentElement.setAttribute("data-theme", theme);
        const cs = getComputedStyle(document.documentElement);
        return {
          inkBg: ratio(
            cs.getPropertyValue("--ink").trim(),
            cs.getPropertyValue("--bg").trim(),
          ),
          mutedBg: ratio(
            cs.getPropertyValue("--muted").trim(),
            cs.getPropertyValue("--bg").trim(),
          ),
        };
      };
      return { light: measure("light"), dark: measure("dark") };
    });

    const readingBlob = `${home.headline} ${home.posture} ${home.watch}`;
    const readingOk =
      home.headline.length >= 12 &&
      /calmo|tenso|instáv|tempestade|risco|alavanc|entrar|sair|lado|stress|misto|mercado|calm|storm|unsettled|tense|risk|lever|money|sideways/i.test(
        readingBlob,
      );

    const before = {
      homePercentSigns: 105,
      homeSections: 15,
      homeChars: 6820,
      homeSvgs: 21,
      mundoChars: 1445,
      contextoSvgs: 0,
      coldMsApprox: 5000,
      warmMsApprox: 300,
    };

    const report = {
      at: new Date().toISOString(),
      before,
      after: {
        home,
        mundo,
        contexto,
        dial: {
          homeCitizen: {
            chars: homeCitizen.chars,
            sections: homeCitizen.sections,
          },
          homeOperator: {
            chars: homeOperator.chars,
            sections: homeOperator.sections,
          },
          homeAnalyst: {
            chars: homeAnalyst.chars,
            sections: homeAnalyst.sections,
            path: homeAnalyst.path,
          },
          mundoCitizen: {
            chars: mundoCitizen.chars,
            sections: mundoCitizen.sections,
          },
          mundoAnalyst: {
            chars: mundoAnalyst.chars,
            sections: mundoAnalyst.sections,
          },
        },
        perf: { coldMs, warmMs },
        mobile,
        motion,
        contrast,
        readingTest: {
          pass: readingOk,
          headline: home.headline,
          posture: home.posture,
          watch: home.watch,
          note: readingOk
            ? "Nível 1 exposes a natural-language posture/headline a newcomer can skim."
            : "Nível 1 failed the 5s reading test — headline/posture not clear enough.",
        },
        targets: {
          homePercentSigns: {
            target: "< 30",
            value: home.percentSigns,
            pass: home.percentSigns < 30,
          },
          homeSections: {
            target: "≤ 8",
            value: home.sections,
            pass: home.sections <= 8,
          },
          mundoCharsGrew: {
            target: `> ${before.mundoChars} ×1.5`,
            value: mundo.chars,
            pass: mundo.chars >= before.mundoChars * 1.5,
          },
          contextoSvgs: {
            target: "> 0",
            value: contexto.svgs,
            pass: contexto.svgs > 0,
          },
          btcPriceHits: {
            target: "1×",
            value: home.btcPriceHits,
            pass: home.btcPriceHits <= 1,
          },
          stressHits: {
            target: "1×",
            value: home.stressHits,
            pass: home.stressHits <= 1,
          },
          coldPerf: {
            target: "< 12s DOMContentLoaded (base ~5s)",
            value: coldMs,
            pass: coldMs < 12_000,
          },
          warmPerf: {
            target: "< 5s (base ~0.3s class)",
            value: warmMs,
            pass: warmMs < 5_000,
          },
        },
      },
    };

    const outDir = path.join(process.cwd(), "data", "audit");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(
      path.join(outDir, "e8-latest.json"),
      JSON.stringify(report, null, 2),
    );

    expect(home.percentSigns, "home % count").toBeLessThan(30);
    expect(contexto.svgs, "contexto SVGs").toBeGreaterThan(0);
    expect(mundo.chars, "mundo chars grew").toBeGreaterThanOrEqual(
      before.mundoChars * 1.5,
    );
    expect(mobile.overflow, "no horizontal overflow at 375").toBe(false);
    expect(contrast.light.inkBg).toBeGreaterThanOrEqual(4.5);
    expect(contrast.dark.inkBg).toBeGreaterThanOrEqual(4.5);
    expect(
      motion.animationName === "none" || motion.animationName === "",
    ).toBeTruthy();
    expect(
      homeCitizen.sections !== homeOperator.sections ||
        homeCitizen.chars !== homeOperator.chars,
      "dial changes home density",
    ).toBeTruthy();
    expect(
      mundoCitizen.chars !== mundoAnalyst.chars ||
        mundoCitizen.sections !== mundoAnalyst.sections,
      "dial changes mundo density",
    ).toBeTruthy();
    expect(home.btcPriceHits, "BTC price not tripled").toBeLessThanOrEqual(1);
    expect(home.stressHits, "Stress once on entrance (Pulso only)").toBeLessThanOrEqual(1);
    expect(home.sections, "home major blocks ≤ 8").toBeLessThanOrEqual(8);
    expect(readingOk, report.after.readingTest.note).toBeTruthy();
  });
});
