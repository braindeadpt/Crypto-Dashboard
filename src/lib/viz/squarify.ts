/**
 * Squarified treemap layout (Bruls / Huizing / van Wijk style).
 * Pure geometry — no chart library.
 */

export type TreemapItem = {
  id: string;
  value: number;
};

export type TreemapRect = TreemapItem & {
  x: number;
  y: number;
  w: number;
  h: number;
};

function worst(
  row: { value: number }[],
  w: number,
): number {
  if (!row.length) return Infinity;
  const s = row.reduce((a, b) => a + b.value, 0);
  const s2 = s * s;
  const rMax = Math.max(...row.map((r) => r.value));
  const rMin = Math.min(...row.map((r) => r.value));
  const w2 = w * w;
  return Math.max((w2 * rMax) / s2, s2 / (w2 * rMin));
}

function layoutRow(
  row: TreemapItem[],
  x: number,
  y: number,
  w: number,
  h: number,
  horizontal: boolean,
): TreemapRect[] {
  const sum = row.reduce((a, b) => a + b.value, 0);
  const out: TreemapRect[] = [];
  let offset = 0;
  for (const item of row) {
    const frac = item.value / sum;
    if (horizontal) {
      const rw = w * frac;
      out.push({ ...item, x: x + offset, y, w: rw, h });
      offset += rw;
    } else {
      const rh = h * frac;
      out.push({ ...item, x, y: y + offset, w, h: rh });
      offset += rh;
    }
  }
  return out;
}

/**
 * Layout `items` into `width`×`height` starting at (0,0).
 * Values must be > 0.
 */
export function squarify(
  items: TreemapItem[],
  width: number,
  height: number,
): TreemapRect[] {
  const total = items.reduce((s, i) => s + i.value, 0);
  if (total <= 0 || width <= 0 || height <= 0) return [];

  const scaled = items
    .filter((i) => i.value > 0)
    .map((i) => ({ ...i, value: i.value }))
    .sort((a, b) => b.value - a.value);

  const result: TreemapRect[] = [];
  let x = 0;
  let y = 0;
  let w = width;
  let h = height;
  let remaining = [...scaled];
  let row: TreemapItem[] = [];

  const scale = (width * height) / total;
  remaining = remaining.map((i) => ({ ...i, value: i.value * scale }));

  while (remaining.length) {
    const horizontal = w >= h;
    const side = horizontal ? h : w;
    const next = remaining[0];
    const trial = [...row, next];
    if (
      row.length === 0 ||
      worst(trial, side) <= worst(row, side)
    ) {
      row = trial;
      remaining.shift();
    } else {
      // flush row
      const rowSum = row.reduce((a, b) => a + b.value, 0);
      if (horizontal) {
        const rowH = rowSum / w;
        result.push(...layoutRow(row, x, y, w, rowH, true));
        y += rowH;
        h -= rowH;
      } else {
        const rowW = rowSum / h;
        result.push(...layoutRow(row, x, y, rowW, h, false));
        x += rowW;
        w -= rowW;
      }
      row = [];
    }
  }

  if (row.length) {
    const horizontal = w >= h;
    const rowSum = row.reduce((a, b) => a + b.value, 0);
    if (horizontal) {
      const rowH = h > 0 ? rowSum / w : 0;
      result.push(...layoutRow(row, x, y, w, Math.min(rowH, h) || h, true));
    } else {
      const rowW = w > 0 ? rowSum / h : 0;
      result.push(...layoutRow(row, x, y, Math.min(rowW, w) || w, h, false));
    }
  }

  return result;
}
