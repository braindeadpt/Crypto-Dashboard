"use client";

import { Regua } from "@/components/instrument/Regua";
import { Link } from "@/i18n/navigation";
import type { MetricContextApi } from "@/lib/history/context";
import { deltaClass, formatPct, formatUsdMillions } from "@/lib/format";
import type { LiveTickerConnection } from "@/lib/hooks/useLiveTicker";
import type { MarketSnapshot } from "@/lib/types";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Cabeçalho de acto. A board lê-se em actos — sem estas âncoras a página é uma
 * pilha de painéis do mesmo peso.
 */
export function ActHead({ title, note }: { title: string; note?: string }) {
  return (
    <div className="act-head">
      <h2 className="act-head__title">{title}</h2>
      {note && <span className="act-head__note">{note}</span>}
    </div>
  );
}

export function LiveStatus({
  connection,
  lastUpdate,
  labelLive,
  labelConnecting,
  labelReconnecting,
  labelOffline,
}: {
  connection: LiveTickerConnection;
  lastUpdate: number | null;
  labelLive: string;
  labelConnecting: string;
  labelReconnecting: string;
  labelOffline: string;
}) {
  const label =
    connection === "live"
      ? labelLive
      : connection === "reconnecting"
        ? labelReconnecting
        : connection === "offline"
          ? labelOffline
          : labelConnecting;
  const tone =
    connection === "live"
      ? "text-accent"
      : connection === "offline"
        ? "text-faint"
        : "text-warn";
  const time =
    lastUpdate != null
      ? new Date(lastUpdate).toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : null;

  return (
    <div className="flex shrink-0 items-center gap-2 border-r border-line px-3 py-2">
      <span
        className={`live-dot ${
          connection === "live"
            ? "live-dot--on"
            : connection === "offline"
              ? "live-dot--off"
              : "live-dot--warn"
        }`}
      />
      <span
        className={`font-mono text-[0.62rem] uppercase tracking-[0.14em] ${tone}`}
      >
        {label}
      </span>
      {time && connection === "live" && (
        <span className="hidden font-mono text-[0.58rem] text-faint sm:inline">
          {time}
        </span>
      )}
    </div>
  );
}

export function TapeItem({
  label,
  value,
  change,
  changeIsAbs,
  flashKey,
  history,
  historyLocale = "pt",
  historyStretched = false,
  watched = false,
}: {
  label: string;
  value: string;
  change?: number;
  changeIsAbs?: boolean;
  flashKey?: number | string;
  history?: MetricContextApi | null;
  historyLocale?: "pt" | "en";
  historyStretched?: boolean;
  watched?: boolean;
}) {
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prev = useRef<number | string | undefined>(flashKey);

  useEffect(() => {
    if (flashKey == null || prev.current == null) {
      prev.current = flashKey;
      return;
    }
    if (flashKey === prev.current) return;
    const dir =
      typeof flashKey === "number" && typeof prev.current === "number"
        ? flashKey > prev.current
          ? "up"
          : flashKey < prev.current
            ? "down"
            : null
        : "up";
    prev.current = flashKey;
    if (!dir) return;
    setFlash(dir);
    const id = window.setTimeout(() => setFlash(null), 450);
    return () => window.clearTimeout(id);
  }, [flashKey]);

  return (
    <div
      className={`flex min-w-[6.25rem] shrink-0 flex-col border-r border-line px-2.5 py-2 last:border-r-0 sm:min-w-[7.5rem] sm:px-3 ${
        flash === "up"
          ? "tape-flash-up"
          : flash === "down"
            ? "tape-flash-down"
            : ""
      }`}
    >
      <span
        className={`text-label ${
          historyStretched
            ? "lum-extreme"
            : watched
              ? "text-accent"
              : "text-faint"
        }`}
      >
        {label}
        {watched ? " ·" : ""}
      </span>
      <span
        className={`text-data font-medium ${
          changeIsAbs && change != null
            ? change > 0
              ? "text-up"
              : change < 0
                ? "text-down"
                : ""
            : ""
        }`}
        aria-live="polite"
        aria-atomic="false"
      >
        {change != null && !changeIsAbs && (
          <span className="sr-only">
            {change > 0 ? "up" : change < 0 ? "down" : "flat"}{" "}
            {formatPct(change)}
          </span>
        )}
        {value}
      </span>
      {history && (
        <Regua
          context={history}
          variant="inline"
          locale={historyLocale}
          stretched={historyStretched}
          className="mt-0.5"
        />
      )}
      {change != null && !changeIsAbs && (
        <span
          className={`text-meta tabular-nums ${
            change > 0 ? "lum-up" : change < 0 ? "lum-down" : deltaClass(change)
          }`}
          aria-hidden="true"
        >
          {change > 0 ? "▲ " : change < 0 ? "▼ " : ""}
          {formatPct(change)}
        </span>
      )}
    </div>
  );
}

export function ExpandedMetric({
  label,
  value,
  history,
  locale,
  stretched,
}: {
  label: string;
  value: string;
  history?: MetricContextApi | null;
  locale: "pt" | "en";
  stretched?: boolean;
}) {
  return (
    <div className="border border-line/80 bg-bg-elevated p-2.5">
      <p className="text-label text-faint">{label}</p>
      <p className="mt-0.5 text-data font-medium tabular-nums text-ink">{value}</p>
      <Regua
        context={history}
        variant="expanded"
        locale={locale}
        stretched={stretched}
        className="mt-2"
      />
    </div>
  );
}

export function EtfMini({
  label,
  value,
  sum5,
}: {
  label: string;
  value?: number | null;
  sum5?: number | null;
}) {
  const t = useTranslations("board");
  if (value == null) {
    return (
      <div className="border border-line/80 bg-surface p-2">
        <p className="font-mono text-[0.58rem] text-faint">{label}</p>
        <p className="mt-0.5 text-sm text-muted">—</p>
      </div>
    );
  }
  return (
    <div className="border border-line/80 bg-surface p-2">
      <p className="font-mono text-[0.58rem] text-faint">{label} · 1d</p>
      <p
        className={`mt-0.5 font-mono text-base font-medium tabular-nums ${
          value > 0 ? "text-up" : value < 0 ? "text-down" : "text-muted"
        }`}
      >
        {formatUsdMillions(value)}
      </p>
      {sum5 != null && (
        <p
          className={`font-mono text-[0.62rem] tabular-nums ${
            sum5 >= 0 ? "text-up" : "text-down"
          }`}
        >
          5d {formatUsdMillions(sum5)} · {t("etfUnit")}
        </p>
      )}
    </div>
  );
}

export function Panel({
  title,
  href,
  children,
  warn,
}: {
  title: string;
  href?: string;
  children: ReactNode;
  warn?: boolean;
}) {
  return (
    <section className={`panel-secondary p-3 ${warn ? "border-warn/30" : ""}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-label text-faint">{title}</h2>
        {href && (
          <Link href={href} className="text-meta text-accent">
            →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function Row({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line/70 py-1.5 last:border-0">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-right">
        <span className="font-mono text-sm tabular-nums">{value}</span>
        {hint && (
          <span className="ml-2 font-mono text-[0.6rem] uppercase text-faint">
            {hint}
          </span>
        )}
      </span>
    </div>
  );
}

export function MoverCol({
  title,
  items,
  watchedIds = [],
}: {
  title: string;
  items: MarketSnapshot["movers"]["gainers"];
  watchedIds?: string[];
}) {
  const watched = new Set(watchedIds);
  return (
    <div>
      <p className="mb-1 font-mono text-[0.6rem] uppercase text-faint">{title}</p>
      <ul className="space-y-1">
        {items.map((m) => (
          <li key={m.id} className="text-sm">
            <div className="flex justify-between gap-2">
              <Link
                href={`/caso/${m.caseId}`}
                className={`font-medium hover:text-accent ${
                  watched.has(m.id) ? "text-accent" : ""
                }`}
              >
                {m.symbol}
                {watched.has(m.id) ? " ·" : ""}
              </Link>
              <span className={`font-mono tabular-nums ${deltaClass(m.change24h)}`}>
                {formatPct(m.change24h)}
              </span>
            </div>
            <p className="font-mono text-[0.58rem] text-faint">
              {m.change1h != null && (
                <span className={deltaClass(m.change1h)}>
                  1h {formatPct(m.change1h)}
                </span>
              )}
              {m.change7d != null && (
                <span className={`ml-2 ${deltaClass(m.change7d)}`}>
                  7d {formatPct(m.change7d)}
                </span>
              )}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
