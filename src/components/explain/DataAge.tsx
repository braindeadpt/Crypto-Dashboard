"use client";

import { cn } from "@/lib/format";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";

const TICK_MS = 30_000;

function subscribe(onStoreChange: () => void) {
  const id = setInterval(onStoreChange, TICK_MS);
  return () => clearInterval(id);
}

type Props = {
  /** ISO timestamp of when the *data* was produced — never render time. */
  at?: string | null;
  /** Snapshot flagged stale by its fetcher → warn tone + label. */
  stale?: boolean;
  /** Age budget before warn tone, even without an explicit flag. */
  warnAfterMs?: number;
  className?: string;
};

/**
 * Visible data age (F2). Ticks every 30s so the label keeps ageing
 * honestly between server refreshes.
 */
export function DataAge({ at, stale = false, warnAfterMs, className }: Props) {
  const t = useTranslations("age");
  const ts = at ? Date.parse(at) : NaN;

  // Seconds precision: stable snapshot within each second, re-tick every 30s.
  // Server snapshot -1 → renders nothing during SSR/hydration, then fills in.
  const ageSec = useSyncExternalStore(
    subscribe,
    () => Math.max(0, Math.floor((Date.now() - ts) / 1000)),
    () => -1,
  );

  if (!Number.isFinite(ts) || ageSec < 0) return null;

  const ageMs = ageSec * 1000;
  const min = Math.floor(ageSec / 60);
  const label =
    min < 1
      ? t("now")
      : min < 60
        ? t("minutes", { n: min })
        : min < 60 * 24
          ? t("hours", { n: Math.floor(min / 60) })
          : t("days", { n: Math.floor(min / 1440) });

  const warn = stale || (warnAfterMs != null && ageMs > warnAfterMs);

  return (
    <time
      dateTime={new Date(ts).toISOString()}
      title={new Date(ts).toLocaleString()}
      className={cn(
        "tabular-nums",
        warn ? "text-warn" : "text-faint",
        className,
      )}
    >
      {label}
      {stale ? ` · ${t("stale")}` : ""}
    </time>
  );
}
