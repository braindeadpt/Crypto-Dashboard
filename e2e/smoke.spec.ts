import { expect, test } from "@playwright/test";

/** Soft smoke: shell + brand must render. Live APIs may flake; we still catch 404/crash shells. */
const DESKS = [
  "/pt",
  "/pt/mercado",
  "/pt/graficos",
  "/pt/etf",
  "/pt/sentimento",
  "/pt/defi",
  "/pt/yields",
  "/pt/memes",
  "/pt/lab",
] as const;

async function assertShell(page: import("@playwright/test").Page) {
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(
    page.getByRole("banner").getByText("CLAREZA", { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Navegação" })).toBeVisible();
}

test.describe("smoke · PT desks", () => {
  for (const path of DESKS) {
    test(`loads ${path}`, async ({ page }) => {
      const response = await page.goto(path, {
        waitUntil: "domcontentloaded",
      });
      expect(response, `no response for ${path}`).toBeTruthy();
      expect(
        response!.status(),
        `${path} returned ${response!.status()}`,
      ).toBeLessThan(500);
      await assertShell(page);
    });
  }
});

test.describe("smoke · i18n + nav", () => {
  test("EN locale loads board chrome", async ({ page }) => {
    const response = await page.goto("/en", { waitUntil: "domcontentloaded" });
    expect(response?.status() ?? 500).toBeLessThan(500);
    await assertShell(page);
    await expect(
      page.getByRole("banner").getByText(/Market terminal/i),
    ).toBeVisible();
  });

  test("primary nav reaches mercado", async ({ page }) => {
    await page.goto("/pt", { waitUntil: "domcontentloaded" });
    await assertShell(page);
    await page
      .getByRole("navigation", { name: "Navegação" })
      .getByRole("link", { name: /Mercado/i })
      .click();
    await expect(page).toHaveURL(/\/pt\/mercado/);
    await assertShell(page);
  });
});
