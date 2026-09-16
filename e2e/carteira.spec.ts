import { expect, test } from "@playwright/test";

/**
 * Carteira functional e2e — real API calls, not fixtures.
 * BTC runs without a key (mempool.space public API). EVM is gated on
 * ETHERSCAN_API_KEY — set as a repo secret to enable in CI.
 */
const GENESIS_BTC = "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";
const VITALIK_ETH = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

test.describe("carteira · functional", () => {
  test("bitcoin address loads balance and activity (no key needed)", async ({
    page,
  }) => {
    await page.goto("/pt/ferramentas", { waitUntil: "domcontentloaded" });
    // Controlled input: fill before hydration and React resets state.
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder("0x…").fill(GENESIS_BTC);
    // BTC format auto-selects the Bitcoin network pill
    await expect(
      page.getByRole("radio", { name: "Bitcoin" }),
    ).toHaveAttribute("aria-checked", "true");

    await page.getByRole("button", { name: /^Ver$/ }).click();

    // Genesis address holds ~57-68 BTC depending on donations
    await expect(page.getByText(/^Bitcoin$/).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/BTC/).first()).toBeVisible();
    await expect(page.getByText(/Actividade recente/i)).toBeVisible();
    // Explorer receipt links to mempool.space
    await expect(
      page.locator('a[href*="mempool.space"]').first(),
    ).toBeVisible();
  });

  test("evm address loads balance and tokens", async ({ page }) => {
    test.skip(
      !process.env.ETHERSCAN_API_KEY,
      "needs ETHERSCAN_API_KEY (repo secret)",
    );
    await page.goto("/pt/ferramentas", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");

    await page.getByPlaceholder("0x…").fill(VITALIK_ETH);
    await page.getByRole("button", { name: /^Ver$/ }).click();

    await expect(page.getByText(/^Ethereum$/).first()).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByText(/ETH/).first()).toBeVisible();
    await expect(page.getByText(/Actividade recente/i)).toBeVisible();
  });

  test("invalid address shows a format error, not a crash", async ({
    page,
  }) => {
    await page.goto("/pt/ferramentas", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle");
    await page.getByPlaceholder("0x…").fill("not-an-address");
    await expect(
      page.getByText(/Formato inválido|Invalid format/i),
    ).toBeVisible();
  });
});
