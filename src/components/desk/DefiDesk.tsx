"use client";

import { PegWatch } from "@/components/defi/PegWatch";
import { ProtocolRing } from "@/components/defi/ProtocolRing";
import { TvlChart } from "@/components/defi/TvlChart";
import { YieldBars } from "@/components/defi/YieldBars";
import { DataAge } from "@/components/explain/DataAge";
import { ExplainThisNumber } from "@/components/explain/ExplainThisNumber";
import { Link } from "@/i18n/navigation";
import { deltaClass, formatPct, formatUsd } from "@/lib/format";
import type { YieldPool } from "@/lib/data/yields";
import { useMotion } from "@/lib/motion/useMotion";
import type { SeriesPoint } from "@/lib/stats";
import type { DefiSnapshot } from "@/lib/types";
import gsap from "gsap";
import { useLayoutEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

type ProtoSort = "tvl" | "move";

export function DefiDesk({
  data,
  yields = [],
  yieldsAt,
  tvlPoints = [],
  tvlAt = null,
}: {
  data: DefiSnapshot;
  yields?: YieldPool[];
  /** Age of the yields snapshot — separate disk blob (F2). */
  yieldsAt?: string | null;
  /** Série diária de TVL global (90d) — o órgão visto no tempo. */
  tvlPoints?: SeriesPoint[];
  tvlAt?: string | null;
}) {
  const t = useTranslations("defi");
  const motion = useMotion();
  const [sort, setSort] = useState<ProtoSort>("tvl");

  // Ordenação real entre duas leituras honestas: quota (TVL, a ordem da
  // fonte) ou movimento (Δ1d ponderado). Sem Δ o protocolo cai para o fim
  // — nunca se inventa um 0.
  const protocols = [...data.protocols].sort((a, b) =>
    sort === "move"
      ? (b.change1d ?? -Infinity) - (a.change1d ?? -Infinity)
      : b.tvl - a.tvl,
  );

  /* Flip manual (mesmo padrão do MarketMap): regista a posição anterior de
     cada linha e desloca-a fisicamente ao reordenar. A duração vem do
     Maestro; repouso/reduced-motion → reordenação directa, sem deslize. */
  const rowEls = useRef(new Map<string, HTMLLIElement>());
  const prevTops = useRef(new Map<string, number>());
  useLayoutEffect(() => {
    const prev = prevTops.current;
    const next = new Map<string, number>();
    const anims: gsap.core.Tween[] = [];
    for (const [slug, el] of rowEls.current) {
      const top = el.offsetTop;
      next.set(slug, top);
      const p = prev.get(slug);
      if (p == null || Math.abs(p - top) < 0.5 || motion.subdued) continue;
      anims.push(
        gsap.fromTo(
          el,
          { y: p - top },
          {
            y: 0,
            duration: 0.55 * motion.cadence,
            ease: "power2.out",
            overwrite: "auto",
          },
        ),
      );
    }
    prevTops.current = next;
    return () => anims.forEach((a) => a.kill());
  }, [protocols, motion.cadence, motion.subdued]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 md:px-6 enter">
      <header className="max-w-2xl">
        <h1 className="text-display">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted">{t("subtitle")}</p>
        <DataAge
          at={data.updatedAt}
          stale={data.stale}
          className="mt-2 block text-meta"
        />
      </header>

      {/* O órgão no tempo — a série de TVL que se desenha ao entrar. */}
      <section className="card mt-6 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-title">{t("tvlSeries")}</h2>
          {tvlAt && <DataAge at={tvlAt} className="text-meta" />}
        </div>
        <div className="mt-3">
          <TvlChart points={tvlPoints} updatedAt={tvlAt} />
        </div>
      </section>

      <div className="card mt-8 p-6">
        <p className="text-label text-faint">
          {t("tvl")}
        </p>
        <ExplainThisNumber
          value={
            <span className="font-mono text-4xl tabular-nums">
              {formatUsd(data.totalTvl, true)}
            </span>
          }
          meaning={t("tvlMeaning")}
          method={t("tvlMethod")}
          source="DefiLlama"
          updatedAt={data.updatedAt}
        />
        {data.change1d != null && (
          <p className={`mt-1 font-mono text-sm ${deltaClass(data.change1d)}`}>
            {formatPct(data.change1d)} {t("change1d")}
          </p>
        )}
        {data.fees24h != null && (
          <p className="mt-3 font-mono text-sm text-muted">
            {t("fees24h")}:{" "}
            <span className="text-ink">{formatUsd(data.fees24h, true)}</span>
            {data.feesChange1d != null && (
              <span className={`ml-2 ${deltaClass(data.feesChange1d)}`}>
                {formatPct(data.feesChange1d)}
              </span>
            )}
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-title">{t("protocols")}</h2>
            <div
              className="flex gap-1 font-mono text-[0.62rem] uppercase tracking-wider"
              role="group"
              aria-label={t("sortLabel")}
            >
              {(["tvl", "move"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={sort === s}
                  onClick={() => setSort(s)}
                  className={`border px-2 py-1 ${
                    sort === s
                      ? "border-accent/50 text-accent"
                      : "border-line text-faint hover:text-muted"
                  }`}
                >
                  {s === "tvl" ? t("sortTvl") : t("sortMove")}
                </button>
              ))}
            </div>
          </div>
          {/* O anel — quota por protocolo em arcos concêntricos; ao
              reordenar os anéis trocam de raio fisicamente. */}
          <div className="mt-4">
            <ProtocolRing protocols={protocols} sort={sort} />
          </div>
          <ul className="mt-4 divide-y divide-line">
            {protocols.map((p) => (
              <li
                key={p.slug}
                ref={(el) => {
                  if (el) rowEls.current.set(p.slug, el);
                  else rowEls.current.delete(p.slug);
                }}
                className="flex items-baseline justify-between gap-3 py-2.5"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-faint">{p.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">{formatUsd(p.tvl, true)}</p>
                  {p.change1d != null && (
                    <p className={`font-mono text-xs ${deltaClass(p.change1d)}`}>
                      {formatPct(p.change1d)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="text-title">{t("chains")}</h2>
            <ul className="mt-4 divide-y divide-line">
              {data.chains.map((c) => (
                <li key={c.name} className="flex justify-between py-2.5 text-sm">
                  <span>{c.name}</span>
                  <span className="font-mono">{formatUsd(c.tvl, true)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5">
            <h2 className="text-title">{t("stablecoins")}</h2>
            {/* Vigilância de peg — cada stablecoin orbita o 1,00; o desvio
                real afasta o ponto e acende acima do limiar declarado. */}
            <div className="mt-4">
              <PegWatch stables={data.stablecoins} />
            </div>
            <ul className="mt-4 divide-y divide-line border-t border-line pt-2">
              {data.stablecoins.map((s) => (
                <li
                  key={s.symbol}
                  className="flex justify-between py-2.5 text-sm"
                >
                  <span>
                    {s.symbol}{" "}
                    <span className="text-faint">{s.name}</span>
                  </span>
                  <span className="font-mono">
                    {formatUsd(s.circulating, true)}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/atlas/stablecoins"
              className="mt-3 inline-block text-sm font-semibold text-accent"
            >
              Atlas: stablecoins →
            </Link>
          </section>
        </div>
      </div>

      {yields.length > 0 && (
        <section className="card mt-6 p-5">
          <h2 className="text-title">{t("yields")}</h2>
          <p className="mt-1 text-xs text-faint">
            {t("yieldsHint")}
            {yieldsAt && (
              <>
                {" · "}
                <DataAge at={yieldsAt} />
              </>
            )}
          </p>
          {/* Barras ordenáveis — a transição entre critérios é física. */}
          <div className="mt-4">
            <YieldBars pools={yields} />
          </div>
        </section>
      )}
    </div>
  );
}
