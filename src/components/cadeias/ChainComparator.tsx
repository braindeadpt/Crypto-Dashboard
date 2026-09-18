"use client";

import { AnimatedNumber } from "@/components/board/AnimatedNumber";
import { deltaClass, formatPct, formatUsd } from "@/lib/format";
import type { DefiSnapshot } from "@/lib/types";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * COMPARADOR DE CADEIAS — duas estruturas lado a lado.
 * Métricas reais por cadeia: TVL, quota, Δ1d ponderado, nº de protocolos e
 * maior protocolo residente. Ao trocar de cadeia os números fazem tween
 * (AnimatedNumber) — nunca saltam, nunca se inventam.
 */

type ChainStat = {
  name: string;
  tvl: number;
  share: number;
  d1: number | null;
  nProtocols: number;
  topProto: string | null;
};

export function ChainComparator({ defi }: { defi: DefiSnapshot }) {
  const t = useTranslations("cadeias");

  const total = useMemo(
    () => defi.chains.reduce((s, c) => s + c.tvl, 0),
    [defi.chains],
  );

  const stats = useMemo(() => {
    const delta = new Map<string, { num: number; den: number }>();
    const count = new Map<string, number>();
    const top = new Map<string, { name: string; tvl: number }>();
    for (const p of defi.protocols) {
      for (const c of p.chains) {
        count.set(c, (count.get(c) ?? 0) + 1);
        const cur = top.get(c);
        if (!cur || p.tvl > cur.tvl) top.set(c, { name: p.name, tvl: p.tvl });
        if (p.change1d != null) {
          const d = delta.get(c) ?? { num: 0, den: 0 };
          d.num += p.change1d * p.tvl;
          d.den += p.tvl;
          delta.set(c, d);
        }
      }
    }
    const m = new Map<string, ChainStat>();
    for (const c of defi.chains) {
      const d = delta.get(c.name);
      m.set(c.name, {
        name: c.name,
        tvl: c.tvl,
        share: total > 0 ? (c.tvl / total) * 100 : 0,
        d1: d && d.den > 0 ? d.num / d.den : null,
        nProtocols: count.get(c.name) ?? 0,
        topProto: top.get(c.name)?.name ?? null,
      });
    }
    return m;
  }, [defi, total]);

  const [a, setA] = useState(defi.chains[0]?.name ?? "");
  const [b, setB] = useState(defi.chains[1]?.name ?? "");
  const sa = stats.get(a);
  const sb = stats.get(b);

  return (
    <section className="mt-6 overflow-hidden rounded-[2px] border border-line">
      <div className="border-b border-line bg-surface-2 px-4 py-2.5">
        <h2 className="text-label text-faint">{t("compareTitle")}</h2>
      </div>
      <div className="grid grid-cols-2 gap-px bg-line">
        {([
          { sel: a, set: setA, s: sa, side: "a" },
          { sel: b, set: setB, s: sb, side: "b" },
        ] as const).map(({ sel, set, s, side }) => (
          <div key={side} className="bg-surface p-4">
            <label className="block">
              <span className="sr-only">
                {t("comparePick", { side: side === "a" ? "A" : "B" })}
              </span>
              <select
                value={sel}
                onChange={(e) => set(e.target.value)}
                className="w-full border border-line bg-bg px-2 py-1.5 font-display text-title text-ink"
              >
                {defi.chains.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            {s ? (
              <dl className="mt-4 space-y-3">
                <div>
                  <dt className="text-label text-faint">TVL</dt>
                  <dd className="mt-0.5 font-mono text-title tabular-nums text-ink">
                    <AnimatedNumber
                      value={s.tvl}
                      format={(n) => formatUsd(n, true)}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-label text-faint">{t("share")}</dt>
                  <dd className="mt-0.5 font-mono text-data tabular-nums text-ink">
                    <AnimatedNumber
                      value={s.share}
                      format={(n) => formatPct(n, 1)}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-label text-faint">{t("d1")}</dt>
                  <dd
                    className={`mt-0.5 font-mono text-data tabular-nums ${
                      s.d1 == null ? "text-faint" : deltaClass(s.d1)
                    }`}
                  >
                    {s.d1 == null ? (
                      "—"
                    ) : (
                      <AnimatedNumber
                        value={s.d1}
                        format={(n) =>
                          `${n >= 0 ? "+" : ""}${formatPct(n)}`
                        }
                      />
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-label text-faint">
                    {t("compareProtocols")}
                  </dt>
                  <dd className="mt-0.5 font-mono text-data tabular-nums text-ink">
                    <AnimatedNumber
                      value={s.nProtocols}
                      format={(n) => Math.round(n).toString()}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-label text-faint">
                    {t("compareTopProto")}
                  </dt>
                  <dd className="mt-0.5 text-meta text-ink">
                    {s.topProto ?? "—"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-meta text-faint">—</p>
            )}
          </div>
        ))}
      </div>
      <p className="border-t border-line px-4 py-2 text-meta text-faint">
        {t("compareNote")}
      </p>
    </section>
  );
}
