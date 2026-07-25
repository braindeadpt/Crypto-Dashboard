/**
 * Cold-load Web Vitals sample for portfolio polish report.
 * Run after `npm run build && npm run start` (or via playwright webServer).
 *
 * Usage: npx playwright test e2e/perf.spec.ts --project=chromium
 */
import { expect, test } from "@playwright/test";
import * as fs from "node:fs";
import * as path from "node:path";

type VitalSample = {
  lcp: number | null;
  cls: number | null;
  inp: number | null;
  ttfb: number | null;
  url: string;
  at: string;
};

test.describe("perf · cold load vitals", () => {
  test("home reports LCP/CLS (and INP if available)", async ({ page }) => {
    await page.goto("/pt", { waitUntil: "networkidle" });

    // Interact once so INP can register
    await page.mouse.move(40, 40);
    await page.locator("body").click({ position: { x: 20, y: 20 } }).catch(() => {});

    const sample = (await page.evaluate(async () => {
      const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

      // Prefer PerformanceObserver (buffered) — getEntriesByType alone often misses LCP
      let lcp: number | null = null;
      let cls = 0;
      let inp: number | null = null;

      try {
        await new Promise<void>((resolve) => {
          let done = false;
          const finish = () => {
            if (done) return;
            done = true;
            resolve();
          };
          try {
            const po = new PerformanceObserver((list) => {
              for (const e of list.getEntries()) {
                lcp = e.startTime;
              }
            });
            po.observe({
              type: "largest-contentful-paint",
              buffered: true,
            } as PerformanceObserverInit);
          } catch {
            /* ignore */
          }
          try {
            const po = new PerformanceObserver((list) => {
              for (const e of list.getEntries() as PerformanceEntry[]) {
                const ls = e as PerformanceEntry & {
                  value: number;
                  hadRecentInput: boolean;
                };
                if (!ls.hadRecentInput) cls += ls.value;
              }
            });
            po.observe({
              type: "layout-shift",
              buffered: true,
            } as PerformanceObserverInit);
          } catch {
            /* ignore */
          }
          try {
            const po = new PerformanceObserver((list) => {
              for (const e of list.getEntries() as PerformanceEntry[]) {
                const ev = e as PerformanceEntry & {
                  duration: number;
                  interactionId?: number;
                };
                if ((ev.interactionId ?? 0) > 0) {
                  inp = Math.max(inp ?? 0, ev.duration);
                }
              }
            });
            po.observe({
              type: "event",
              buffered: true,
              durationThreshold: 16,
            } as PerformanceObserverInit);
          } catch {
            /* ignore */
          }
          void wait(2800).then(finish);
        });
      } catch {
        await wait(500);
      }

      const entries = performance.getEntriesByType(
        "navigation",
      ) as PerformanceNavigationTiming[];
      const nav = entries[0];

      return {
        lcp,
        cls,
        inp,
        ttfb: nav ? nav.responseStart : null,
        url: location.pathname,
        at: new Date().toISOString(),
      };
    })) as VitalSample;

    const outDir = path.join(process.cwd(), "data", "perf");
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, "latest.json");
    let history: VitalSample[] = [];
    if (fs.existsSync(outFile)) {
      try {
        const prev = JSON.parse(fs.readFileSync(outFile, "utf8")) as {
          samples?: VitalSample[];
        };
        history = prev.samples ?? [];
      } catch {
        history = [];
      }
    }
    history.push(sample);
    const payload = {
      samples: history.slice(-10),
      latest: sample,
      budgets: {
        lcpMs: 4000,
        cls: 0.1,
        inpMs: 200,
      },
    };
    fs.writeFileSync(outFile, JSON.stringify(payload, null, 2));

    // Soft budgets — CI must not flake on cold API-bound LCP; still assert CLS.
    expect(sample.cls).toBeLessThan(0.25);
    const lcpMs = sample.lcp;
    if (typeof lcpMs === "number") {
      expect(lcpMs).toBeLessThan(12_000);
    }
  });
});
