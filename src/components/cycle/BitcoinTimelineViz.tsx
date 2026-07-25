"use client";

import { BITCOIN_TIMELINE } from "@/lib/content/timeline";
import type { TimelineEvent } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

/**
 * Navigable Bitcoin timeline — horizontal track + selected event detail.
 */
export function BitcoinTimelineViz({ className = "" }: { className?: string }) {
  const t = useTranslations("cycle");
  const locale = useLocale();
  const events = BITCOIN_TIMELINE;
  const [selectedId, setSelectedId] = useState(
    () => events.find((e) => e.id === "2024-h4")?.id ?? events[events.length - 1]!.id,
  );
  const trackRef = useRef<HTMLDivElement>(null);
  const selected = events.find((e) => e.id === selectedId) ?? events[0]!;

  const times = events.map((e) => Date.parse(e.date));
  const t0 = times[0]!;
  const t1 = times[times.length - 1]!;
  const span = Math.max(1, t1 - t0);

  useEffect(() => {
    const el = trackRef.current?.querySelector(`[data-event="${selectedId}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedId]);

  const w = 900;
  const h = 88;
  const padX = 28;

  return (
    <div className={className}>
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-xl font-semibold">{t("timeline")}</h2>
        <p className="text-meta text-faint">{t("timelineNavHint")}</p>
      </div>

      <div
        ref={trackRef}
        className="mt-4 overflow-x-auto scroll-x border border-line bg-surface"
      >
        <svg
          viewBox={`0 0 ${w} ${h}`}
          className="h-24 min-w-[640px] w-full"
          role="img"
          aria-label={t("timelineAria")}
        >
          <title>{t("timeline")}</title>
          <line
            x1={padX}
            x2={w - padX}
            y1={44}
            y2={44}
            stroke="var(--line-strong)"
            strokeWidth="2"
          />
          {events.map((ev, i) => {
            const x = padX + ((times[i]! - t0) / span) * (w - padX * 2);
            const active = ev.id === selectedId;
            const r = ev.importance === "high" ? 7 : 5;
            return (
              <g
                key={ev.id}
                data-event={ev.id}
                className="cursor-pointer"
                onClick={() => setSelectedId(ev.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedId(ev.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={active}
                aria-label={locale === "pt" ? ev.titlePt : ev.titleEn}
              >
                <circle
                  cx={x}
                  cy={44}
                  r={active ? r + 2 : r}
                  fill={active ? "var(--accent)" : "var(--surface)"}
                  stroke={
                    ev.importance === "high" ? "var(--accent)" : "var(--line-strong)"
                  }
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={active ? 22 : 72}
                  textAnchor="middle"
                  fill={active ? "var(--ink)" : "var(--muted)"}
                  style={{ fontSize: 9, fontFamily: "var(--font-mono)" }}
                >
                  {ev.date.slice(0, 4)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="border border-line bg-surface px-2 py-1 text-meta text-muted hover:border-accent/40"
          onClick={() => step(events, selectedId, -1, setSelectedId)}
        >
          ← {t("timelinePrev")}
        </button>
        <button
          type="button"
          className="border border-line bg-surface px-2 py-1 text-meta text-muted hover:border-accent/40"
          onClick={() => step(events, selectedId, 1, setSelectedId)}
        >
          {t("timelineNext")} →
        </button>
      </div>

      <article className="mt-4 border border-line bg-surface p-4">
        <p className="font-mono text-xs text-faint">{selected.date}</p>
        <h3 className="mt-1 text-xl font-semibold">
          {locale === "pt" ? selected.titlePt : selected.titleEn}
          {selected.priceHint && (
            <span className="ml-2 text-sm font-normal text-muted">
              {selected.priceHint}
            </span>
          )}
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          {locale === "pt" ? selected.bodyPt : selected.bodyEn}
        </p>
      </article>
    </div>
  );
}

function step(
  events: TimelineEvent[],
  id: string,
  dir: -1 | 1,
  set: (id: string) => void,
) {
  const i = events.findIndex((e) => e.id === id);
  const next = events[Math.min(events.length - 1, Math.max(0, i + dir))];
  if (next) set(next.id);
}
