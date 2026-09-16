import { test } from "@playwright/test";

/**
 * Audit helper — full-page screenshots of every destination, desktop + mobile.
 * Not part of CI: run with `npx playwright test e2e/shots.spec.ts`.
 */
test.skip(!!process.env.CI, "audit utility — screenshots, not assertions");
const DESKTOP = [
  "/pt",
  "/pt/casos",
  "/pt/fluxos",
  "/pt/aprender",
  "/pt/mesa",
  "/pt/ferramentas",
  "/pt/brief",
  "/pt/atlas/bitcoin",
  "/pt/atlas/seed-phrase",
  "/pt/estilo",
  "/en",
] as const;

const MOBILE = ["/pt", "/pt/aprender", "/pt/ferramentas", "/pt/fluxos"] as const;

const name = (p: string) => p.replaceAll("/", "_").replace(/^_+|_+$/g, "");

test.describe("audit shots", () => {
  for (const path of DESKTOP) {
    test(`desktop ${path}`, async ({ page }) => {
      await page.addInitScript(() => {
        localStorage.setItem("clareza-expertise", "operator");
        localStorage.setItem("clareza-onboarded", "0");
      });
      await page.goto(path, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      await page.screenshot({
        path: `audit-shots/desktop-${name(path)}.png`,
        fullPage: true,
      });
    });
  }

  for (const path of MOBILE) {
    test(`mobile ${path}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.addInitScript(() => {
        localStorage.setItem("clareza-expertise", "citizen");
      });
      await page.goto(path, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      await page.screenshot({
        path: `audit-shots/mobile-${name(path)}.png`,
        fullPage: true,
      });
    });
  }

  // citizen vs analyst aprender — density dial check
  for (const lv of ["citizen", "analyst"] as const) {
    test(`aprender ${lv}`, async ({ page }) => {
      await page.addInitScript((l) => {
        localStorage.setItem("clareza-expertise", l);
      }, lv);
      await page.goto("/pt/aprender", { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      await page.screenshot({
        path: `audit-shots/aprender-${lv}.png`,
        fullPage: true,
      });
    });
  }
});
