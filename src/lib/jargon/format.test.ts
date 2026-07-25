import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  breadthMessageValues,
  fundingBandKey,
  lsMessageValues,
} from "@/lib/jargon/format";

describe("jargon formatters", () => {
  it("maps funding bands without inventing rates", () => {
    assert.equal(fundingBandKey(0), "calm");
    assert.equal(fundingBandKey(0.0001), "normal");
    assert.equal(fundingBandKey(0.0003), "elevated");
    assert.equal(fundingBandKey(0.001), "extreme");
    assert.equal(fundingBandKey(null), "normal");
  });

  it("describes L/S crowding honestly", () => {
    assert.equal(lsMessageValues(1.85).side, "long");
    assert.equal(lsMessageValues(1.85).multiple, "1.9");
    assert.equal(lsMessageValues(0.5).side, "short");
    assert.equal(lsMessageValues(1.02).side, "flat");
  });

  it("rounds breadth for the twin line", () => {
    assert.deepEqual(breadthMessageValues(28.4), { n: 28 });
    assert.deepEqual(breadthMessageValues(150), { n: 100 });
  });
});
