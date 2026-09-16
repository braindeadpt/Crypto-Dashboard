"use client";

import {
  diceEntropyBits,
  diceRollsNeeded,
  diceToEntropyHex,
  flipsToEntropyHex,
  mnemonicFromEntropy,
  randomEntropyHex,
  type EntropyBits,
  type MnemonicPipeline,
} from "@/lib/seguranca/entropy";
import { cn } from "@/lib/format";
import { useTranslations } from "next-intl";
import { useState } from "react";

type Source = "vector" | "dice" | "coins" | "csprng";

/**
 * Published BIP-39 test vectors (all-zero entropy) — deterministic, so they
 * can be shown without running crypto. Verified in entropy.test.ts.
 */
const VECTOR_PIPELINES: Record<EntropyBits, MnemonicPipeline> = {
  128: {
    bits: "0".repeat(128),
    checksum: "0011",
    indices: [...Array(11).fill(0), 3],
    words: [...Array(11).fill("abandon"), "about"],
  },
  256: {
    bits: "0".repeat(256),
    checksum: "01100110",
    indices: [...Array(23).fill(0), 102],
    words: [...Array(23).fill("abandon"), "art"],
  },
};

/**
 * Entropy Instrument — visualises the BIP-39 pipeline (bits → words).
 * Demonstration only: browser entropy is not for real funds. No persistence.
 */
export function EntropyInstrument() {
  const t = useTranslations("seguranca.entropy");
  const [source, setSource] = useState<Source>("vector");
  const [bits, setBits] = useState<EntropyBits>(128);
  const [diceInput, setDiceInput] = useState("");
  const [flips, setFlips] = useState("");
  const [result, setResult] = useState<MnemonicPipeline | null>(
    VECTOR_PIPELINES[128],
  );
  const [error, setError] = useState<string | null>(null);

  const sources: Source[] = ["vector", "dice", "coins", "csprng"];
  const sourceKey: Record<Source, string> = {
    vector: "sourceVector",
    dice: "sourceDice",
    coins: "sourceCoins",
    csprng: "sourceCsprng",
  };

  async function run(hex: string | null) {
    if (hex === null) {
      setResult(null);
      setError(source === "dice" ? t("invalidDice") : t("empty"));
      return;
    }
    try {
      setResult(await mnemonicFromEntropy(hex));
      setError(null);
    } catch {
      setResult(null);
      setError(t("empty"));
    }
  }

  function selectSource(s: Source) {
    setSource(s);
    setError(null);
    setResult(s === "vector" ? VECTOR_PIPELINES[bits] : null);
  }

  function selectBits(b: EntropyBits) {
    setBits(b);
    setError(null);
    setResult(source === "vector" ? VECTOR_PIPELINES[b] : null);
  }

  function compute() {
    if (source === "csprng") void run(randomEntropyHex(bits));
    else if (source === "dice") void run(diceToEntropyHex(diceInput, bits));
    else if (source === "coins") void run(flipsToEntropyHex(flips, bits));
  }

  function clear() {
    setDiceInput("");
    setFlips("");
    setError(null);
    setResult(source === "vector" ? VECTOR_PIPELINES[bits] : null);
  }

  const diceBits = diceEntropyBits(diceInput.replace(/[^1-6]/g, "").length);

  return (
    <section className="border border-line bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-title">{t("title")}</h3>
        <p className="font-mono text-xs text-faint">BIP-39</p>
      </div>
      <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>

      <p className="mt-3 border-l-2 border-accent/40 pl-3 text-sm text-muted">
        <span className="font-semibold text-ink">{t("warning")}</span>
      </p>

      <div className="mt-4">
        <p className="text-label text-faint">
          {t("source")}
        </p>
        <div className="mt-2 flex flex-wrap gap-1" role="radiogroup">
          {sources.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={source === s}
              onClick={() => selectSource(s)}
              className={cn(
                "border border-line px-2.5 py-1 text-label transition",
                source === s
                  ? "bg-accent-dim text-accent"
                  : "text-faint hover:text-muted",
              )}
            >
              {t(sourceKey[s])}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1" role="radiogroup">
        {([128, 256] as const).map((b) => (
          <button
            key={b}
            type="button"
            role="radio"
            aria-checked={bits === b}
            onClick={() => selectBits(b)}
            className={cn(
              "border border-line px-2.5 py-1 font-mono text-xs transition",
              bits === b
                ? "bg-accent-dim text-accent"
                : "text-faint hover:text-muted",
            )}
          >
            {t(b === 128 ? "bits128" : "bits256")}
          </button>
        ))}
      </div>

      {source === "dice" && (
        <div className="mt-3">
          <p className="text-xs text-muted">{t("diceHint")}</p>
          <input
            value={diceInput}
            onChange={(e) => setDiceInput(e.target.value)}
            placeholder={t("dicePlaceholder")}
            inputMode="numeric"
            className="mt-2 w-full border border-line bg-bg px-3 py-2 font-mono text-sm text-ink placeholder:text-faint"
          />
          <p className="mt-1 font-mono text-xs text-faint">
            {diceBits}/{bits} bits · {t("sourceDice")}: {diceRollsNeeded(bits)}+
          </p>
        </div>
      )}

      {source === "coins" && (
        <div className="mt-3">
          <p className="text-xs text-muted">{t("coinsHint")}</p>
          <div className="mt-2 flex items-center gap-2">
            <input
              value={flips}
              onChange={(e) => setFlips(e.target.value)}
              placeholder="010011…"
              inputMode="numeric"
              className="w-full border border-line bg-bg px-3 py-2 font-mono text-sm text-ink placeholder:text-faint"
            />
            <button
              type="button"
              onClick={() =>
                setFlips(
                  (f) =>
                    f + String(crypto.getRandomValues(new Uint8Array(1))[0] % 2),
                )
              }
              className="shrink-0 border border-line px-2.5 py-2 text-label text-faint hover:text-muted"
            >
              {t("flip")}
            </button>
          </div>
          <p className="mt-1 font-mono text-xs text-faint">
            {flips.replace(/[^01]/g, "").length}/{bits} bits
          </p>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {source !== "vector" && (
          <button
            type="button"
            onClick={compute}
            className="border border-line bg-accent-dim px-3 py-2 text-label text-accent hover:opacity-90"
          >
            {t("generate")}
          </button>
        )}
        <button
          type="button"
          onClick={clear}
          className="border border-line px-3 py-2 text-label text-faint hover:text-muted"
        >
          {t("clear")}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-down">{error}</p>}

      {result && (
        <div className="mt-5 space-y-4">
          <div>
            <p className="text-label text-faint">
              {t("bitsLabel")} · {result.bits.length}
            </p>
            <p className="mt-1 break-all border border-line bg-bg p-2 font-mono text-xs leading-relaxed text-muted">
              {result.bits}
              <span className="text-accent">{result.checksum}</span>
            </p>
            <p className="mt-1 font-mono text-xs text-faint">
              {t("checksumLabel")}: {result.checksum}
            </p>
          </div>

          <div>
            <p className="text-label text-faint">
              {t("indicesLabel")}
            </p>
            <p className="mt-1 break-all border border-line bg-bg p-2 font-mono text-xs text-muted">
              {result.indices.join(" · ")}
            </p>
          </div>

          <div>
            <p className="text-label text-faint">
              {t("wordsLabel")}
            </p>
            <ol className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-4">
              {result.words.map((w, i) => (
                <li
                  key={i}
                  className="border border-line bg-bg px-2 py-1.5 font-mono text-sm text-ink"
                >
                  <span className="text-faint">{i + 1}.</span> {w}
                </li>
              ))}
            </ol>
            <p className="mt-2 text-xs text-faint">{t("demoNote")}</p>
          </div>
        </div>
      )}
    </section>
  );
}
