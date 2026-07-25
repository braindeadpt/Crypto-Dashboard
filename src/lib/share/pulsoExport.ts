/**
 * Client-only PNG export for O Pulso — no server upload.
 * Draws SVG silhouette + textual reading onto a canvas.
 */

export type PulsoSharePayload = {
  date: string;
  postureLabel: string;
  stress: number;
  headline: string;
  summary: string;
  brand: string;
  /** Serialized SVG markup (viewBox 0 0 320 320) */
  svgMarkup: string;
};

function cssColor(varName: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return v || fallback;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
): number {
  const words = text.split(/\s+/);
  let line = "";
  let yy = y;
  let lines = 0;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy);
      line = w;
      yy += lineHeight;
      lines++;
      if (lines >= maxLines) {
        ctx.fillText(line.slice(0, Math.max(0, line.length - 1)) + "…", x, yy);
        return yy + lineHeight;
      }
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, yy);
    yy += lineHeight;
  }
  return yy;
}

export async function exportPulsoPng(
  payload: PulsoSharePayload,
): Promise<void> {
  const W = 1200;
  const H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");

  const bg = cssColor("--bg-elevated", "#f4f6f8");
  const ink = cssColor("--ink", "#1a1f24");
  const muted = cssColor("--muted", "#5c6670");
  const faint = cssColor("--faint", "#8a939c");
  const accent = cssColor("--accent", "#2b6cb0");
  const line = cssColor("--line", "#d5dbe0");
  const surface = cssColor("--surface", "#ffffff");

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = surface;
  ctx.fillRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  // Load SVG as image
  const svgBlob = new Blob([payload.svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = await loadImage(url);
    const size = 420;
    ctx.drawImage(img, 80, 105, size, size);
  } finally {
    URL.revokeObjectURL(url);
  }

  // Text column
  const tx = 540;
  ctx.fillStyle = faint;
  ctx.font = "500 18px IBM Plex Mono, ui-monospace, monospace";
  ctx.fillText(payload.date, tx, 120);

  ctx.fillStyle = accent;
  ctx.font = "600 22px IBM Plex Sans, system-ui, sans-serif";
  ctx.fillText(payload.postureLabel.toUpperCase(), tx, 160);

  ctx.fillStyle = muted;
  ctx.font = "400 18px IBM Plex Mono, ui-monospace, monospace";
  ctx.fillText(`stress ${payload.stress}`, tx, 190);

  ctx.fillStyle = ink;
  ctx.font = "600 36px Fraunces, Georgia, serif";
  const y = wrapText(ctx, payload.headline, tx, 250, 560, 44, 3);

  ctx.fillStyle = muted;
  ctx.font = "400 20px IBM Plex Sans, system-ui, sans-serif";
  wrapText(ctx, payload.summary, tx, y + 12, 560, 28, 4);

  // Brand footer
  ctx.fillStyle = faint;
  ctx.font = "500 16px IBM Plex Sans, system-ui, sans-serif";
  ctx.fillText(payload.brand, 80, H - 70);
  ctx.font = "400 14px IBM Plex Mono, ui-monospace, monospace";
  ctx.fillText("clareza.crypto · observatório", 80, H - 48);

  const a = document.createElement("a");
  a.download = `clareza-pulso-${payload.date}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Inline CSS variables into SVG so export is self-contained. */
export function serializePulsoSvg(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
  style.textContent = `
    :root, svg {
      color: ${cssColor("--ink", "#1a1f24")};
    }
  `;
  clone.insertBefore(style, clone.firstChild);

  // Replace CSS vars with computed colours in attributes
  const replacements: [RegExp, string][] = [
    [/var\(--line\)/g, cssColor("--line", "#d5dbe0")],
    [/var\(--faint\)/g, cssColor("--faint", "#8a939c")],
    [/var\(--muted\)/g, cssColor("--muted", "#5c6670")],
    [/var\(--ink\)/g, cssColor("--ink", "#1a1f24")],
    [/var\(--accent\)/g, cssColor("--accent", "#2b6cb0")],
    [/var\(--bg\)/g, cssColor("--bg", "#eef1f4")],
    [/var\(--calm\)/g, cssColor("--calm", "#2f7d5b")],
    [/var\(--storm\)/g, cssColor("--storm", "#b45309")],
    [/var\(--weird\)/g, cssColor("--weird", "#7c3aed")],
    [/var\(--unsettled\)/g, cssColor("--unsettled", "#a16207")],
    [/color-mix\([^)]+\)/g, cssColor("--accent", "#2b6cb0") + "22"],
  ];

  let html = new XMLSerializer().serializeToString(clone);
  for (const [re, val] of replacements) {
    html = html.replace(re, val);
  }
  return html;
}
