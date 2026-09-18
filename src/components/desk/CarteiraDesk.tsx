"use client";

import {
  WALLET_CHAINS,
  type WalletView,
  type WalletChainId,
} from "@/lib/data/etherscan";
import {
  addSavedAddress,
  addressesStore,
  getEtherscanKey,
  listSavedAddresses,
  removeSavedAddress,
  setEtherscanKey,
} from "@/lib/local/addresses";
import { TxTimeline, WalletDonut } from "@/components/carteira/WalletViz";
import { DataAge } from "@/components/explain/DataAge";
import { downloadBlob } from "@/lib/local/store";
import { cn, formatUsd } from "@/lib/format";
import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;
const BTC_RE =
  /^(bc1[a-z0-9]{11,71}|tb1[a-z0-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/i;
const NETWORKS: { chainId: WalletChainId; name: string }[] = [
  ...WALLET_CHAINS,
  { chainId: "btc", name: "Bitcoin" },
];
const EXPLORER_BY_CHAIN: Record<WalletChainId, string> = {
  1: "https://etherscan.io",
  8453: "https://basescan.org",
  42161: "https://arbiscan.io",
  btc: "https://mempool.space",
};

/**
 * CARTEIRA — read-only address view (VISION Fase 1).
 * Paste a public address → native balance + token estimate + activity.
 * Nothing is stored server-side; saved addresses/keys live in localStorage.
 */
export function CarteiraDesk() {
  const t = useTranslations("carteira");
  const [input, setInput] = useState("");
  const [chain, setChain] = useState<WalletChainId>(1);
  const [view, setView] = useState<WalletView | null>(null);
  const [allViews, setAllViews] = useState<WalletView[] | null>(null);
  const [agg, setAgg] = useState<{
    n: number;
    native: number;
    symbol: string;
    usd: number | null;
    errors: number;
  } | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showKey, setShowKey] = useState(false);
  const env = useSyncExternalStore(
    addressesStore.subscribe,
    addressesStore.get,
    addressesStore.getServerSnapshot,
  );
  const saved = listSavedAddresses(env);
  const byok = getEtherscanKey(env);
  const trimmed = input.trim();
  const isBtc = BTC_RE.test(trimmed);
  // Auto-detect: a pasted BTC address switches the network for you.
  const effectiveChain: WalletChainId =
    isBtc && chain !== "btc" ? "btc" : chain;
  const valid =
    effectiveChain === "btc" ? isBtc : ADDRESS_RE.test(trimmed);

  async function fetchOne(
    address: string,
    chainId: WalletChainId,
  ): Promise<WalletView> {
    const res = await fetch(
      `/api/wallet?address=${encodeURIComponent(address)}&chain=${chainId}`,
      {
        headers: byok ? { "x-etherscan-key": byok } : undefined,
        cache: "no-store",
      },
    );
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "error");
    return json as WalletView;
  }

  async function lookup(address: string, chainId: WalletChainId) {
    setStatus("loading");
    setErrorMsg("");
    setView(null);
    try {
      setView(await fetchOne(address, chainId));
      setStatus("idle");
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "error");
    }
  }

  async function scanAll(address: string) {
    setStatus("loading");
    setErrorMsg("");
    setView(null);
    setAllViews(null);
    const results = await Promise.allSettled(
      WALLET_CHAINS.map((c) => fetchOne(address, c.chainId)),
    );
    const ok = results
      .filter((r): r is PromiseFulfilledResult<WalletView> => r.status === "fulfilled")
      .map((r) => r.value);
    if (!ok.length) {
      setStatus("error");
      setErrorMsg("Etherscan unavailable");
      return;
    }
    setAllViews(ok);
    setView(ok[0]);
    setChain(ok[0].chainId);
    setStatus("idle");
  }

  /** Sum every saved address that matches the selected network's format. */
  async function sumSaved() {
    const matches = saved.filter((s) =>
      effectiveChain === "btc"
        ? BTC_RE.test(s.address)
        : ADDRESS_RE.test(s.address),
    );
    if (matches.length < 2) return;
    setStatus("loading");
    setAgg(null);
    const results = await Promise.allSettled(
      matches.map((s) => fetchOne(s.address, effectiveChain)),
    );
    let native = 0;
    let usd = 0;
    let anyUsd = false;
    let errors = 0;
    let symbol = "";
    let n = 0;
    for (const r of results) {
      if (r.status !== "fulfilled") {
        errors++;
        continue;
      }
      n++;
      native += r.value.nativeBalance;
      symbol = r.value.nativeSymbol;
      if (r.value.estValueUsd != null) {
        usd += r.value.estValueUsd;
        anyUsd = true;
      }
    }
    setAgg({ n, native, symbol, usd: anyUsd ? usd : null, errors });
    setStatus("idle");
  }

  function saveCurrent() {
    if (!view) return;
    addSavedAddress(view.address);
  }

  /** CSV of the loaded activity + tokens — the seed of the tax export. */
  function exportCsv() {
    if (!view) return;
    const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const rows = [
      ["chain", "date", "hash", "direction", "amount", "symbol", "counterparty", "failed", "url"].join(","),
      ...view.activity.map((a) =>
        [
          view.chainName,
          a.time,
          a.hash,
          a.direction,
          a.amount,
          a.symbol,
          a.counterparty,
          a.failed ? "1" : "0",
          a.url,
        ].map(esc).join(","),
      ),
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    downloadBlob(
      blob,
      `clareza-carteira-${view.chainName.toLowerCase()}-${view.address.slice(0, 8)}-${view.updatedAt.slice(0, 10)}.csv`,
    );
  }

  return (
    <div className="obs-shell section-pad pt-6 enter">
      <header className="max-w-3xl">
        <p className="text-label text-faint">{t("eyebrow")}</p>
        <h1 className="mt-1 font-display text-display text-ink">
          {t("title")}
        </h1>
        <p className="mt-2 text-body text-muted">{t("subtitle")}</p>
        <p className="mt-3 max-w-2xl border border-line bg-surface p-3 text-meta text-muted">
          {t("privacy")}
        </p>
      </header>

      <div className="mt-6 max-w-3xl border border-line bg-surface p-5">
        <label className="text-label text-faint">
          {t("addressLabel")}
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="0x…"
            spellCheck={false}
            autoComplete="off"
            className="w-full border border-line bg-bg px-3 py-2 font-mono text-sm text-ink placeholder:text-faint"
          />
          <button
            type="button"
            disabled={!valid || status === "loading"}
            onClick={() => lookup(trimmed, effectiveChain)}
            className="shrink-0 border border-line bg-accent-dim px-4 py-2 text-label text-accent disabled:opacity-40"
          >
            {status === "loading" ? t("loading") : t("view")}
          </button>
          {!isBtc && (
            <button
              type="button"
              disabled={!valid || status === "loading"}
              onClick={() => scanAll(trimmed)}
              className="shrink-0 border border-line px-4 py-2 text-label text-faint transition hover:text-muted disabled:opacity-40"
            >
              {t("scanAll")}
            </button>
          )}
        </div>
        {input && !valid && (
          <p className="mt-1 text-xs text-down">{t("invalidAddress")}</p>
        )}

        <div className="mt-3 flex flex-wrap gap-1" role="radiogroup">
          {NETWORKS.map((c) => (
            <button
              key={c.chainId}
              type="button"
              role="radio"
              aria-checked={effectiveChain === c.chainId}
              onClick={() => setChain(c.chainId)}
              className={cn(
                "border border-line px-2.5 py-1 text-label transition",
                effectiveChain === c.chainId
                  ? "bg-accent-dim text-accent"
                  : "text-faint hover:text-muted",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>

        {saved.length > 0 && (
          <div className="mt-4">
            <p className="text-label text-faint">
              {t("saved")}
            </p>
            <ul className="mt-2 flex flex-wrap gap-1">
              {saved.map((a) => (
                <li key={a.address} className="flex items-center gap-0">
                  <button
                    type="button"
                    onClick={() => {
                      setInput(a.address);
                      void lookup(
                        a.address,
                        BTC_RE.test(a.address) ? "btc" : chain,
                      );
                    }}
                    className="chip hover:border-accent"
                    title={a.address}
                  >
                    {a.label ||
                      `${a.address.slice(0, 6)}…${a.address.slice(-4)}`}
                  </button>
                  <button
                    type="button"
                    aria-label={t("remove")}
                    onClick={() => removeSavedAddress(a.address)}
                    className="px-1 text-faint hover:text-down"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {saved.filter((s) =>
          effectiveChain === "btc"
            ? BTC_RE.test(s.address)
            : ADDRESS_RE.test(s.address),
        ).length > 1 && (
          <div className="mt-3">
            <button
              type="button"
              disabled={status === "loading"}
              onClick={sumSaved}
              className="border border-line px-3 py-1.5 text-label text-faint transition hover:text-muted disabled:opacity-40"
            >
              {t("sumSaved")}
            </button>
            {agg && (
              <div className="mt-2 border border-line bg-surface p-3">
                <p className="text-label text-faint">
                  {t("sumSavedTitle", { n: agg.n })}
                </p>
                <p className="mt-1 font-mono text-sm text-ink">
                  {agg.native.toLocaleString(undefined, {
                    maximumFractionDigits: 6,
                  })}{" "}
                  {agg.symbol}
                  {agg.usd != null && (
                    <span className="ml-2 text-muted">
                      ≈ {formatUsd(agg.usd)}
                    </span>
                  )}
                </p>
                {agg.errors > 0 && (
                  <p className="mt-1 text-meta text-faint">
                    {t("sumSavedErrors", { n: agg.errors })}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowKey((s) => !s)}
          className="mt-4 text-xs text-faint underline-offset-2 hover:text-muted hover:underline"
        >
          {t("yourKey")}
        </button>
        {showKey && (
          <div className="mt-2 border border-line bg-bg p-3">
            <p className="text-xs text-muted">{t("keyHint")}</p>
            <input
              defaultValue={byok}
              onBlur={(e) => setEtherscanKey(e.target.value.trim())}
              placeholder={t("keyPlaceholder")}
              spellCheck={false}
              autoComplete="off"
              className="mt-2 w-full border border-line bg-surface px-3 py-2 font-mono text-xs text-ink placeholder:text-faint"
            />
          </div>
        )}
      </div>

      {status === "error" && (
        <p className="mt-4 max-w-3xl border border-line bg-surface p-4 text-sm text-down">
          {errorMsg === "no api key" ? t("noKey") : errorMsg}
        </p>
      )}

      {allViews && allViews.length > 1 && (
        <div className="mt-6 grid max-w-5xl gap-2 sm:grid-cols-3">
          {allViews.map((v) => (
            <button
              key={v.chainId}
              type="button"
              onClick={() => {
                setView(v);
                setChain(v.chainId);
              }}
              className={cn(
                "border p-3 text-left transition",
                view?.chainId === v.chainId
                  ? "border-accent bg-accent-dim"
                  : "border-line bg-surface hover:border-accent/50",
              )}
            >
              <p className="text-label text-faint">{v.chainName}</p>
              <p className="mt-1 font-mono text-sm text-ink">
                {v.nativeBalance.toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })}{" "}
                {v.nativeSymbol}
              </p>
              {v.estValueUsd != null && (
                <p className="font-mono text-xs text-muted">
                  ≈ {formatUsd(v.estValueUsd)}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {view && (
        <div className="mt-6 grid max-w-5xl gap-4 md:grid-cols-2">
          <section className="border border-line bg-surface p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-label text-faint">
                {t("balance")} · {view.chainName}
              </h2>
              <a
                href={`${EXPLORER_BY_CHAIN[view.chainId]}/address/${view.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-accent hover:underline"
              >
                {view.address.slice(0, 8)}…{view.address.slice(-6)} ↗
              </a>
            </div>
            <p className="mt-2 font-mono text-2xl text-ink">
              {view.nativeBalance.toLocaleString(undefined, {
                maximumFractionDigits: 6,
              })}{" "}
              <span className="text-muted">{view.nativeSymbol}</span>
            </p>
            {view.nativeUsd != null && (
              <p className="mt-1 font-mono text-sm text-muted">
                ≈ {formatUsd(view.nativeUsd)}
              </p>
            )}
            <DataAge
              at={view.updatedAt}
              warnAfterMs={5 * 60_000}
              className="mt-1 block font-mono text-[0.62rem]"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveCurrent}
                className="border border-line px-2.5 py-1 text-label text-faint hover:text-muted"
              >
                {t("save")}
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="border border-line px-2.5 py-1 text-label text-faint hover:text-muted"
              >
                {t("exportCsv")}
              </button>
            </div>
          </section>

          {/* Composição — donut animado das posições com preço real. */}
          <section className="border border-line bg-surface p-5 md:col-span-2">
            <h2 className="text-label text-faint">{t("composition")}</h2>
            <div className="mt-3">
              <WalletDonut view={view} />
            </div>
          </section>

          <section className="border border-line bg-surface p-5">
            <h2 className="text-label text-faint">
              {t("tokens")}
            </h2>
            {view.tokens.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                {view.chainId === "btc" ? t("tokensBtc") : t("noTokens")}
              </p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {view.tokens.map((tok) => (
                  <li
                    key={tok.contract}
                    className="flex items-baseline justify-between gap-2 text-sm"
                  >
                    <span className="font-medium text-ink">{tok.symbol}</span>
                    <span className="font-mono text-muted">
                      {tok.balanceEst > 0 && tok.balanceEst < 0.0001
                        ? "<0,0001"
                        : tok.balanceEst.toLocaleString(undefined, {
                            maximumFractionDigits: 4,
                          })}
                      {tok.usdValue != null && tok.usdValue >= 0.01 && (
                        <span className="ml-2 text-faint">
                          ≈ {formatUsd(tok.usdValue)}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {view.estValueUsd != null && (
              <p className="mt-3 border-t border-line pt-2 font-mono text-sm text-ink">
                {t("estValue")} ≈ {formatUsd(view.estValueUsd)}
              </p>
            )}
            <p className="mt-3 font-mono text-xs text-faint">
              {t("tokensHint", { n: view.tokenScan.rows })}
            </p>
          </section>

          <section className="border border-line bg-surface p-5 md:col-span-2">
            <h2 className="text-label text-faint">
              {t("activity")}
            </h2>
            {/* Fluxo de transacções — a timeline real antes da lista. */}
            {view.activity.length >= 2 && (
              <div className="mt-3">
                <TxTimeline view={view} />
              </div>
            )}
            {view.activity.length === 0 ? (
              <p className="mt-3 text-sm text-muted">{t("noActivity")}</p>
            ) : (
              <ul className="mt-3 divide-y divide-line">
                {view.activity.map((a, i) => (
                  <li
                    key={`${a.hash}-${a.kind}-${i}`}
                    className="flex items-baseline justify-between gap-3 py-2 text-sm"
                  >
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "font-mono text-xs",
                          a.direction === "in"
                            ? "text-up"
                            : a.direction === "out"
                              ? "text-down"
                              : "text-faint",
                        )}
                      >
                        {a.direction === "in"
                          ? "▼"
                          : a.direction === "out"
                            ? "▲"
                            : "⇄"}
                      </span>{" "}
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline"
                      >
                        {a.counterparty}
                      </a>{" "}
                      <span className="text-faint">
                        {a.failed ? `· ${t("failed")}` : ""}
                        {a.pending ? `· ${t("pending")}` : ""}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-muted">
                      {a.amount.toLocaleString(undefined, {
                        maximumFractionDigits: 6,
                      })}{" "}
                      {a.symbol}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <p className="text-xs text-faint md:col-span-2">
            {t("poweredBy")}{" "}
            <a
              href="https://etherscan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              Etherscan
            </a>
            {" · "}
            {t("disclaimer")}
          </p>
        </div>
      )}
    </div>
  );
}
