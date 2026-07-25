import { expect, test, type Page } from "@playwright/test";

const DESTINATIONS = [
  "/pt",
  "/pt/mundo",
  "/pt/fluxos",
  "/pt/contexto",
  "/pt/brief",
  "/pt/estilo",
] as const;

const LEGACY_REDIRECTS = [
  { from: "/pt/mercado", to: /\/pt\/mundo/ },
  { from: "/pt/etf", to: /\/pt\/fluxos/ },
  { from: "/pt/ciclo", to: /\/pt\/contexto/ },
] as const;

async function assertShell(page: Page) {
  await expect(page.getByRole("banner")).toBeVisible();
  // Brand may wrap; CC mark + nav prove chrome mounted
  await expect(
    page.getByRole("banner").getByText("CC", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: /Navegação|Primary/i }),
  ).toBeVisible();
}

test.describe("smoke · destinations", () => {
  for (const path of DESTINATIONS) {
    test(`loads ${path}`, async ({ page }) => {
      const response = await page.goto(path, {
        waitUntil: "domcontentloaded",
      });
      expect(response, `no response for ${path}`).toBeTruthy();
      expect(response!.status()).toBeLessThan(500);
      await assertShell(page);
    });
  }
});

test.describe("smoke · legacy redirects", () => {
  for (const { from, to } of LEGACY_REDIRECTS) {
    test(`${from} → consolidated`, async ({ page }) => {
      await page.goto(from, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(to);
      await assertShell(page);
    });
  }
});

test.describe("smoke · i18n + nav", () => {
  test("EN locale loads board chrome", async ({ page }) => {
    const response = await page.goto("/en", { waitUntil: "domcontentloaded" });
    expect(response?.status() ?? 500).toBeLessThan(500);
    await assertShell(page);
    await expect(page.getByText(/Market observatory/i).first()).toBeVisible();
  });

  test("primary nav reaches Mundo", async ({ page }) => {
    await page.goto("/pt", { waitUntil: "domcontentloaded" });
    await assertShell(page);
    await page
      .getByRole("navigation", { name: /Navegação/i })
      .getByRole("link", { name: /Mundo/i })
      .click();
    await expect(page).toHaveURL(/\/pt\/mundo/);
    await assertShell(page);
  });
});

test.describe("polish · mobile 375", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("no body horizontal scroll; ritual + pulso visible", async ({
    page,
  }) => {
    await page.goto("/pt", { waitUntil: "domcontentloaded" });
    await assertShell(page);

    // Board is SSR via live APIs with disk fallback — wait for ritual anchor
    const ritual = page.locator("#ritual");
    const marketError = page.getByText(
      /Não foi possível obter dados|Could not fetch market/i,
    );
    await expect(ritual.or(marketError)).toBeVisible({ timeout: 45_000 });
    await expect(
      ritual,
      "home must render #ritual (market snapshot fallback if APIs fail)",
    ).toBeVisible();

    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return {
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      };
    });
    expect(
      overflow.scrollWidth,
      `horizontal overflow: scrollWidth ${overflow.scrollWidth} > client ${overflow.clientWidth}`,
    ).toBeLessThanOrEqual(overflow.clientWidth + 1);

    await expect(
      page.getByRole("region", { name: /Pulso|Pulse/i }).or(page.locator(".pulso")),
    ).toBeVisible();
  });
});

test.describe("polish · a11y keyboard + reduced motion", () => {
  test("skip link reaches main", async ({ page }) => {
    await page.goto("/pt", { waitUntil: "domcontentloaded" });
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: /Saltar para o conteúdo|Skip to content/i });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });

  test("expertise dial is keyboard operable", async ({ page }) => {
    await page.goto("/pt", { waitUntil: "domcontentloaded" });
    const dial = page.getByRole("radiogroup", { name: /Densidade|Density/i });
    await expect(dial).toBeVisible();
    const radios = dial.getByRole("radio");
    // Default is Operador (index 1); Space selects focused radio (ARIA pattern)
    await radios.nth(0).focus();
    await page.keyboard.press("Space");
    await expect(radios.nth(0)).toHaveAttribute("aria-checked", "true");
  });

  test("prefers-reduced-motion disables enter animation", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/pt", { waitUntil: "domcontentloaded" });
    const anim = await page.evaluate(() => {
      const el = document.querySelector(".enter");
      if (!el) return "none";
      return getComputedStyle(el).animationName;
    });
    expect(anim === "none" || anim === "").toBeTruthy();
  });
});

test.describe("polish · contrast tokens", () => {
  test("light and dark theme ink/bg meet AA-ish ratio", async ({ page }) => {
    await page.goto("/pt", { waitUntil: "domcontentloaded" });

    async function contrastFor(theme: "light" | "dark") {
      return page.evaluate((th) => {
        document.documentElement.setAttribute("data-theme", th);
        const cs = getComputedStyle(document.documentElement);
        const parse = (v: string) => {
          const hex = v.trim();
          if (hex.startsWith("#") && hex.length === 7) {
            return [
              parseInt(hex.slice(1, 3), 16),
              parseInt(hex.slice(3, 5), 16),
              parseInt(hex.slice(5, 7), 16),
            ] as const;
          }
          const m = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (m) return [+m[1], +m[2], +m[3]] as const;
          return [0, 0, 0] as const;
        };
        const lum = ([r, g, b]: readonly [number, number, number]) => {
          const f = (c: number) => {
            const s = c / 255;
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          };
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const ratio = (a: string, b: string) => {
          const L1 = lum(parse(a));
          const L2 = lum(parse(b));
          const hi = Math.max(L1, L2);
          const lo = Math.min(L1, L2);
          return (hi + 0.05) / (lo + 0.05);
        };
        const ink = cs.getPropertyValue("--ink");
        const bg = cs.getPropertyValue("--bg");
        const muted = cs.getPropertyValue("--muted");
        const up = cs.getPropertyValue("--up");
        const down = cs.getPropertyValue("--down");
        return {
          inkBg: ratio(ink, bg),
          mutedBg: ratio(muted, bg),
          upBg: ratio(up, bg),
          downBg: ratio(down, bg),
        };
      }, theme);
    }

    const light = await contrastFor("light");
    const dark = await contrastFor("dark");

    // WCAG AA normal text ≥ 4.5; muted may be large/meta → ≥ 3 ok for secondary
    expect(light.inkBg).toBeGreaterThanOrEqual(7);
    expect(light.mutedBg).toBeGreaterThanOrEqual(4.5);
    expect(light.upBg).toBeGreaterThanOrEqual(4.5);
    expect(light.downBg).toBeGreaterThanOrEqual(4.5);

    expect(dark.inkBg).toBeGreaterThanOrEqual(7);
    expect(dark.mutedBg).toBeGreaterThanOrEqual(4.5);
    expect(dark.upBg).toBeGreaterThanOrEqual(4.5);
    expect(dark.downBg).toBeGreaterThanOrEqual(4.5);
  });
});
