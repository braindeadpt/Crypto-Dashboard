"use client";

import { DataAge } from "@/components/explain/DataAge";
import { deltaClass } from "@/lib/format";
import {
  recordVisit,
  visitStore,
  type VisitVitals,
} from "@/lib/local/visit";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useSyncExternalStore } from "react";

type Item = { key: string; text: string; dir: number };

/**
 * R1 — "desde a tua última visita". Tira fina de entrada: o que mudou
 * desde a leitura anterior guardada no browser. Primeira visita (ou
 * localStorage vazio) não renderiza nada — nunca um diff inventado.
 */
export function SinceLastVisit({ vitals }: { vitals: VisitVitals }) {
  const t = useTranslations("visit");
  const tp = useTranslations("pulso");
  const env = useSyncExternalStore(
    visitStore.subscribe,
    visitStore.get,
    visitStore.getServerSnapshot,
  );
  const prev = env.data.prev;

  // Regista depois do mount; `prev` fica estável durante toda a sessão.
  const recorded = useRef(false);
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    recordVisit(vitals);
  }, [vitals]);

  if (!prev) return null;

  const items: Item[] = [];
  const push = (
    key: string,
    delta: number | null,
    threshold: number,
    text: string,
  ) => {
    if (delta != null && Math.abs(delta) >= threshold) {
      items.push({ key, text, dir: delta });
    }
  };

  if (prev.breadthPct != null && vitals.breadthPct != null) {
    push(
      "breadth",
      vitals.breadthPct - prev.breadthPct,
      5,
      `${t("breadth")} ${Math.round(prev.breadthPct)}%→${Math.round(vitals.breadthPct)}%`,
    );
  }
  if (prev.fearGreed != null && vitals.fearGreed != null) {
    push(
      "fng",
      vitals.fearGreed - prev.fearGreed,
      4,
      `${t("fng")} ${Math.round(prev.fearGreed)}→${Math.round(vitals.fearGreed)}`,
    );
  }
  if (prev.fundingBps != null && vitals.fundingBps != null) {
    push(
      "funding",
      vitals.fundingBps - prev.fundingBps,
      1,
      `${t("funding")} ${prev.fundingBps.toFixed(1)}→${vitals.fundingBps.toFixed(1)} bps`,
    );
  }
  if (prev.btcChange24h != null && vitals.btcChange24h != null) {
    push(
      "btc",
      vitals.btcChange24h - prev.btcChange24h,
      1.5,
      `${t("btc")} ${prev.btcChange24h >= 0 ? "+" : ""}${prev.btcChange24h.toFixed(1)}%→${vitals.btcChange24h >= 0 ? "+" : ""}${vitals.btcChange24h.toFixed(1)}%`,
    );
  }
  if (prev.dominance != null && vitals.dominance != null) {
    push(
      "dom",
      vitals.dominance - prev.dominance,
      0.4,
      `${t("dominance")} ${prev.dominance.toFixed(1)}→${vitals.dominance.toFixed(1)}`,
    );
  }
  if (prev.etfUsdM != null && vitals.etfUsdM != null) {
    const fmt = (v: number) => `${v >= 0 ? "+" : ""}${Math.round(v)}M`;
    push(
      "etf",
      vitals.etfUsdM - prev.etfUsdM,
      100,
      `${t("etf")} ${fmt(prev.etfUsdM)}→${fmt(vitals.etfUsdM)}`,
    );
  }

  const postureChanged = prev.posture !== vitals.posture;
  if (!postureChanged && items.length === 0) {
    return (
      <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-y border-line py-2">
        <span className="text-label text-faint">{t("title")}</span>
        <DataAge at={prev.seenAt} className="text-meta" />
        <span className="text-meta text-muted">{t("noChange")}</span>
      </div>
    );
  }

  return (
    <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-y border-line py-2">
      <span className="flex items-baseline gap-2 text-label text-faint">
        {t("title")}
        <DataAge at={prev.seenAt} className="text-meta" />
      </span>
      {postureChanged && (
        <span className="text-meta">
          <span className={`chip chip-${prev.posture}`}>
            {tp(`posture.${prev.posture}`)}
          </span>
          <span className="mx-1 text-faint">→</span>
          <span className={`chip chip-${vitals.posture}`}>
            {tp(`posture.${vitals.posture}`)}
          </span>
        </span>
      )}
      {items.map((i) => (
        <span key={i.key} className="text-meta text-muted">
          <span className={`tabular-nums ${deltaClass(i.dir)}`}>
            {i.dir >= 0 ? "▲" : "▼"}
          </span>{" "}
          {i.text}
        </span>
      ))}
    </div>
  );
}
