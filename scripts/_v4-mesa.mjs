import { chromium } from "playwright";
const b = await chromium.launch();
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await p.goto("http://localhost:3000/pt/mesa", { waitUntil: "domcontentloaded" });
await p.waitForTimeout(1500);
const r = await p.evaluate(() => {
  const docW = document.documentElement.scrollWidth;
  const winW = window.innerWidth;
  const offenders = [];
  for (const el of document.querySelectorAll("*")) {
    const b2 = el.getBoundingClientRect();
    if (b2.right > winW + 2 || b2.left < -2) {
      // only report elements not inside an overflow-x scroller
      let anc = el.parentElement, inScroll = false;
      while (anc) {
        const o = getComputedStyle(anc).overflowX;
        if (o === "auto" || o === "scroll" || o === "hidden") { inScroll = true; break; }
        anc = anc.parentElement;
      }
      if (!inScroll)
        offenders.push(`${el.tagName}.${(el.className + "").slice(0, 60)} right=${Math.round(b2.right)}`);
    }
  }
  return { docW, winW, scrollX: window.scrollX, offenders: offenders.slice(0, 12) };
});
console.log(JSON.stringify(r, null, 2));
await b.close();
