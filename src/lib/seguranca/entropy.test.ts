import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  diceEntropyBits,
  diceRollsNeeded,
  diceToEntropyHex,
  flipsToEntropyHex,
  mnemonicFromEntropy,
  testVectorHex,
} from "./entropy";

/**
 * Vectors from the official BIP-39 test set (bitcoin/bips → bip-0039.mediawiki,
 * linked JSON vectors used by python-mnemonic and others).
 */
describe("mnemonicFromEntropy — official BIP-39 vectors", () => {
  it("128-bit all-zero entropy → abandon×11 + about", async () => {
    const r = await mnemonicFromEntropy("0".repeat(32));
    assert.equal(r.words.length, 12);
    assert.deepEqual(r.words.slice(0, 11), Array(11).fill("abandon"));
    assert.equal(r.words[11], "about");
  });

  it("128-bit all-ones entropy → zoo×11 + wrong", async () => {
    const r = await mnemonicFromEntropy("f".repeat(32));
    assert.deepEqual(r.words.slice(0, 11), Array(11).fill("zoo"));
    assert.equal(r.words[11], "wrong");
  });

  it("128-bit 0x7f… vector → legal winner … yellow", async () => {
    const r = await mnemonicFromEntropy("7f".repeat(16));
    assert.equal(
      r.words.join(" "),
      "legal winner thank year wave sausage worth useful legal winner thank yellow",
    );
  });

  it("128-bit 0x80… vector → letter advice … above", async () => {
    const r = await mnemonicFromEntropy("80".repeat(16));
    assert.equal(
      r.words.join(" "),
      "letter advice cage absurd amount doctor acoustic avoid letter advice cage above",
    );
  });

  it("256-bit all-zero entropy → abandon×23 + art", async () => {
    const r = await mnemonicFromEntropy("0".repeat(64));
    assert.equal(r.words.length, 24);
    assert.deepEqual(r.words.slice(0, 23), Array(23).fill("abandon"));
    assert.equal(r.words[23], "art");
  });

  it("256-bit known vector → ozone drill … picnic", async () => {
    const r = await mnemonicFromEntropy(
      "9e885d952ad362caeb4efe34a8e91bd2",
    );
    assert.equal(
      r.words.join(" "),
      "ozone drill grab fiber curtain grace pudding thank cruise elder eight picnic",
    );
  });

  it("rejects non-128/256 lengths", async () => {
    await assert.rejects(() => mnemonicFromEntropy("00".repeat(8)));
    await assert.rejects(() => mnemonicFromEntropy("zz"));
  });
});

describe("entropy sources", () => {
  it("dice: all-1 rolls → zero entropy → same vector as all-zero hex", async () => {
    const rolls = "1".repeat(diceRollsNeeded(128));
    const hex = diceToEntropyHex(rolls, 128);
    assert.equal(hex, testVectorHex(128));
    const r = await mnemonicFromEntropy(hex!);
    assert.equal(r.words[11], "about");
  });

  it("dice: rejects invalid digits and short rolls", () => {
    assert.equal(diceToEntropyHex("17023", 128), null);
    assert.equal(diceToEntropyHex("12345", 128), null); // ~12 bits only
  });

  it("dice: entropy accounting matches log2(6)", () => {
    assert.equal(diceRollsNeeded(128), 50);
    assert.equal(diceRollsNeeded(256), 100);
    assert.ok(diceEntropyBits(50) >= 128);
  });

  it("flips: exact bit string → entropy hex", () => {
    const hex = flipsToEntropyHex("1".repeat(128), 128);
    assert.equal(hex, "f".repeat(32));
  });

  it("flips: rejects short/invalid input", () => {
    assert.equal(flipsToEntropyHex("101", 128), null);
    assert.equal(flipsToEntropyHex("12".repeat(64), 128), null);
  });
});
