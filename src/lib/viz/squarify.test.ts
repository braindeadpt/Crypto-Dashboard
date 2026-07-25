import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { squarify } from "./squarify";

describe("squarify", () => {
  it("fills the canvas without inventing area", () => {
    const rects = squarify(
      [
        { id: "a", value: 60 },
        { id: "b", value: 40 },
      ],
      100,
      100,
    );
    assert.equal(rects.length, 2);
    const area = rects.reduce((s, r) => s + r.w * r.h, 0);
    assert.ok(Math.abs(area - 10_000) < 1);
  });

  it("returns empty for zero total", () => {
    assert.deepEqual(squarify([{ id: "x", value: 0 }], 100, 100), []);
  });
});
