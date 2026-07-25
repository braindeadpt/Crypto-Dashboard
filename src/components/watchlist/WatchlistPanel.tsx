"use client";

import { useWatchlist } from "@/components/watchlist/WatchlistProvider";
import { deltaClass, formatPct, formatUsd } from "@/lib/format";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";

type SearchHit = {
  id: string;
  symbol: string;
  name: string;
  marketCapRank: number | null;
};

/**
 * Local watchlist panel — data never leaves the browser.
 */
export function WatchlistPanel({ className = "" }: { className?: string }) {
  const t = useTranslations("watchlist");
  const {
    assets,
    quotes,
    quotesLoading,
    max,
    add,
    remove,
    exportFile,
    importFile,
    has,
  } = useWatchlist();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const quoteById = new Map(quotes.map((x) => [x.id, x]));

  async function onSearch(value: string) {
    setQ(value);
    setMsg(null);
    if (value.trim().length < 2) {
      setHits([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/market/quotes?q=${encodeURIComponent(value.trim())}`,
      );
      if (!res.ok) throw new Error("fail");
      const json = (await res.json()) as { hits: SearchHit[] };
      setHits(json.hits ?? []);
    } catch {
      setHits([]);
    } finally {
      setSearching(false);
    }
  }

  function onAdd(hit: SearchHit) {
    const result = add({
      id: hit.id,
      symbol: hit.symbol,
      name: hit.name,
    });
    if (result === "full") setMsg(t("full", { max }));
    else if (result === "dup") setMsg(t("dup"));
    else {
      setMsg(null);
      setQ("");
      setHits([]);
    }
  }

  async function onImport(file: File | undefined) {
    if (!file) return;
    const ok = await importFile(file);
    setMsg(ok ? t("importOk") : t("importFail"));
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <section className={`border border-line bg-surface p-4 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-title text-ink">{t("title")}</h2>
          <p className="mt-1 max-w-xl text-meta text-muted">{t("privacy")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportFile}
            className="border border-line px-2 py-1 text-label text-muted hover:text-accent"
          >
            {t("export")}
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="border border-line px-2 py-1 text-label text-muted hover:text-accent"
          >
            {t("import")}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => void onImport(e.target.files?.[0])}
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="sr-only" htmlFor="watch-search">
          {t("search")}
        </label>
        <input
          id="watch-search"
          value={q}
          onChange={(e) => void onSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full border border-line bg-bg-elevated px-3 py-2 text-sm text-ink placeholder:text-faint"
          autoComplete="off"
        />
        {(searching || hits.length > 0) && (
          <ul className="mt-1 max-h-48 overflow-auto border border-line bg-bg-elevated">
            {searching && (
              <li className="px-3 py-2 text-meta text-faint">{t("searching")}</li>
            )}
            {!searching &&
              hits.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    disabled={has(h.id)}
                    onClick={() => onAdd(h)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-surface disabled:opacity-40"
                  >
                    <span>
                      <span className="font-medium text-ink">{h.symbol}</span>
                      <span className="ml-2 text-muted">{h.name}</span>
                    </span>
                    {h.marketCapRank != null && (
                      <span className="text-meta text-faint">#{h.marketCapRank}</span>
                    )}
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>

      {msg && <p className="mt-2 text-meta text-warn">{msg}</p>}

      <ul className="mt-4 divide-y divide-line">
        {assets.length === 0 && (
          <li className="py-3 text-meta text-muted">{t("empty")}</li>
        )}
        {assets.map((a) => {
          const qte = quoteById.get(a.id);
          return (
            <li
              key={a.id}
              className="flex items-center justify-between gap-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="font-medium text-ink">
                  {a.symbol}
                  <span className="ml-2 text-meta font-normal text-muted">
                    {a.name}
                  </span>
                </p>
                {quotesLoading && !qte ? (
                  <p className="text-meta text-faint">…</p>
                ) : qte ? (
                  <p className="text-data">
                    <span className="text-ink">{formatUsd(qte.price)}</span>
                    <span className={`ml-2 ${deltaClass(qte.change24h)}`}>
                      {formatPct(qte.change24h)}
                    </span>
                  </p>
                ) : (
                  <p className="text-meta text-faint">{t("noQuote")}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {qte && Math.abs(qte.change24h) >= 3 && (
                  <Link
                    href={`/caso/case-${a.id}`}
                    className="text-label text-accent"
                  >
                    {t("case")}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  className="text-label text-faint hover:text-warn"
                  aria-label={t("remove", { symbol: a.symbol })}
                >
                  ×
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-meta text-faint">
        {t("count", { n: assets.length, max })}
      </p>
    </section>
  );
}
