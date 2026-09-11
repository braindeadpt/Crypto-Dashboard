import { BIP39_WORDLIST_EN } from "./wordlist-en";

/**
 * BIP-39 mnemonic pipeline — pure functions for the Entropy Instrument.
 * Educational demonstration: browser-generated seeds are not for real funds.
 */

export type EntropyBits = 128 | 256;

export interface MnemonicPipeline {
  /** Entropy as a "0"/"1" bit string. */
  bits: string;
  /** Checksum bits appended to the entropy (ENT/32 bits of SHA-256). */
  checksum: string;
  /** Indices into the 2048-word list — one per 11-bit group. */
  indices: number[];
  /** The BIP-39 words. */
  words: string[];
}

const HEX_RE = /^[0-9a-f]+$/i;

export function bytesToBits(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += b.toString(2).padStart(8, "0");
  return out;
}

export function hexToBits(hex: string): string {
  return bytesToBits(hexToBytes(hex));
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim().toLowerCase();
  if (!HEX_RE.test(clean) || clean.length % 2 !== 0) {
    throw new Error("invalid hex entropy");
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** First `count` bits of SHA-256(data), as a "0"/"1" string. */
export async function sha256Bits(data: Uint8Array, count: number): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data as BufferSource);
  return bytesToBits(new Uint8Array(digest)).slice(0, count);
}

/**
 * Full BIP-39 pipeline: entropy hex → words.
 * Accepts 16 bytes (128 bits → 12 words) or 32 bytes (256 bits → 24 words).
 */
export async function mnemonicFromEntropy(
  entropyHex: string,
): Promise<MnemonicPipeline> {
  const bytes = hexToBytes(entropyHex);
  if (bytes.length !== 16 && bytes.length !== 32) {
    throw new Error("entropy must be 16 or 32 bytes (128/256 bits)");
  }
  const bits = bytesToBits(bytes);
  const checksum = await sha256Bits(bytes, bytes.length / 4); // ENT/32 bits
  const full = bits + checksum;
  const indices: number[] = [];
  for (let i = 0; i < full.length; i += 11) {
    indices.push(parseInt(full.slice(i, i + 11), 2));
  }
  return { bits, checksum, indices, words: indices.map((i) => BIP39_WORDLIST_EN[i]) };
}

/** Bits of entropy contributed by `n` rolls of a fair d6: floor(n · log2 6). */
export function diceEntropyBits(rollCount: number): number {
  return Math.floor(rollCount * Math.log2(6));
}

/** Minimum d6 rolls to reach `bits` of entropy. */
export function diceRollsNeeded(bits: EntropyBits): number {
  return Math.ceil(bits / Math.log2(6));
}

/**
 * Dice rolls → entropy hex. Each die face 1–6 is a base-6 digit (0–5);
 * the digit string is a base-6 integer of which we take the low `bits` bits.
 * Returns null when the input is invalid or carries less than `bits`.
 */
export function diceToEntropyHex(rolls: string, bits: EntropyBits): string | null {
  const clean = rolls.trim();
  if (!/^[1-6]+$/.test(clean)) return null;
  if (diceEntropyBits(clean.length) < bits) return null;
  let value = BigInt(0);
  for (const ch of clean) {
    value = value * BigInt(6) + BigInt(ch.charCodeAt(0) - 49);
  }
  return bigIntToHex(value % (BigInt(1) << BigInt(bits)), bits);
}

/** Coin flips ("0"/"1" string, heads=1) → entropy hex. Needs at least `bits`. */
export function flipsToEntropyHex(
  flips: string,
  bits: EntropyBits,
): string | null {
  const clean = flips.trim();
  if (!/^[01]+$/.test(clean) || clean.length < bits) return null;
  return bigIntToHex(BigInt(`0b${clean.slice(0, bits)}`), bits);
}

/** CSPRNG entropy via Web Crypto — works in browser and modern Node. */
export function randomEntropyHex(bits: EntropyBits): string {
  const bytes = new Uint8Array(bits / 8);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

/** Official BIP-39 test vector entropy (all-zero) — published, safe by definition. */
export function testVectorHex(bits: EntropyBits): string {
  return "0".repeat(bits / 4);
}

function bigIntToHex(value: bigint, bits: number): string {
  return value.toString(16).padStart(bits / 4, "0");
}

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}
