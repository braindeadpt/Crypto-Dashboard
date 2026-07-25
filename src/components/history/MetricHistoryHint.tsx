"use client";

import { PercentileTwin } from "@/components/jargon/PercentileTwin";
import type { HistoryMetricId } from "@/lib/history/metrics";
import type { MetricContextApi } from "@/lib/history/context";
import { formatContextSentence } from "@/lib/history/format";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";

type HistoryApiResponse = {
  updatedAt: string | null;
  windowDays: number;
  metrics: Partial<Record<HistoryMetricId, MetricContextApi>>;
};

let cache: HistoryApiResponse | null = null;
let inflight: Promise<HistoryApiResponse | null> | null = null;

async function loadHistoryContexts(): Promise<HistoryApiResponse | null> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = fetch("/api/history/context")
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as HistoryApiResponse;
      cache = data;
      return data;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** Client-only: loads persisted contexts after paint — zero SSR/network on render path. */
export function useHistoryContexts(): Partial<
  Record<HistoryMetricId, MetricContextApi>
> {
  const [metrics, setMetrics] = useState<
    Partial<Record<HistoryMetricId, MetricContextApi>>
  >(cache?.metrics ?? {});

  useEffect(() => {
    let cancelled = false;
    loadHistoryContexts().then((data) => {
      if (!cancelled && data?.metrics) setMetrics(data.metrics);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return metrics;
}

type HintProps = {
  metric: HistoryMetricId;
  liveValue?: number;
  stretched?: boolean;
  className?: string;
  /** Instrument tape: allow p71 · 90d; elsewhere prefer plain sentence */
  technical?: boolean;
};

/** Compact history twin under a tape/row number — jargon dictionary, not bare pN. */
export function MetricHistoryHint({
  metric,
  stretched = true,
  className = "",
  technical = false,
}: HintProps) {
  const locale = useLocale();
  const metrics = useHistoryContexts();
  const ctx = metrics[metric];
  if (!ctx) return null;

  const title = formatContextSentence(ctx, locale === "pt" ? "pt" : "en", {
    stretchedLabel: stretched,
  });

  return (
    <span className={className} title={title}>
      <PercentileTwin context={ctx} technical={technical} />
    </span>
  );
}
