import { chromium } from "playwright";
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/pt", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);

for (const level of ["Essencial", "Operador", "Analista"]) {
  const btn = page.locator(`header button:has-text("${level}"), nav button:has-text("${level}")`).first();
  // the dial lives in the top bar — try exact role group first
  const dial = page.locator(`[role="group"] >> button:has-text("${level}")`).first();
  const target = (await dial.count()) ? dial : btn;
  await target.click();
  await page.waitForTimeout(900);
  // inspect first reading cell: order of elements + sizes
  const info = await page.evaluate(() => {
    const cells = document.querySelectorAll(".sat-rule");
    const first = cells[0]?.closest("div");
    // find the readings row: look for text-colossal or text-body sentence
    const colossal = document.querySelector(".text-colossal");
    const bodyFirst = [...document.querySelectorAll("p")].find(
      (p) => p.className.includes("text-body") && p.className.includes("font-medium"),
    );
    return {
      colossalText: colossal?.textContent?.slice(0, 30) ?? null,
      bodyFirst: bodyFirst?.textContent?.slice(0, 60) ?? null,
      level: localStorage.getItem("clareza:expertise") ?? localStorage.getItem("clareza-expertise"),
    };
  });
  await page.screenshot({ path: `audit-shots/v4/dial-${level}.png` });
  console.log(level, JSON.stringify(info));
}
await b.close();
