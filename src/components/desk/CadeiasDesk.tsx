"use client";

import { ChainComparator } from "@/components/cadeias/ChainComparator";
import { DataAge } from "@/components/explain/DataAge";
import { deltaClass, formatPct, formatUsd } from "@/lib/format";
import { useMotion } from "@/lib/motion/useMotion";
import type { DefiSnapshot } from "@/lib/types";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * CADEIAS — blockchains comparadas pelo que lá vive: TVL DefiLlama,
 * quota do total e tendência agregada dos protocolos por cadeia.
 */
export function CadeiasDesk({ defi }: { defi: DefiSnapshot }) {
  const t = useTranslations("cadeias");
  const total = defi.chains.reduce((s, c) => s + c.tvl, 0);

  // Δ1d ponderado por cadeia: soma dos protocolos que a incluem.
  const chainDelta = new Map<string, { num: number; den: number }>();
  for (const p of defi.protocols) {
    if (p.change1d == null) continue;
    for (const c of p.chains) {
      const cur = chainDelta.get(c) ?? { num: 0, den: 0 };
      cur.num += p.change1d * p.tvl;
      cur.den += p.tvl;
      chainDelta.set(c, cur);
    }
  }

  // TVL total "ontem": cada cadeia com Δ1d recua pelo seu próprio delta;
  // sem Δ a cadeia fica no valor de hoje — não se inventa variação.
  const prevTotal = defi.chains.reduce((s, c) => {
    const d = chainDelta.get(c.name);
    const d1 = d && d.den > 0 ? d.num / d.den : null;
    return s + (d1 != null ? c.tvl / (1 + d1 / 100) : c.tvl);
  }, 0);

  return (
    <div className="obs-shell section-pad pb-16 pt-3 enter-sequence">
      <header className="max-w-2xl pt-2">
        <h1 className="font-display text-display text-ink">{t("title")}</h1>
        <p className="mt-2 text-body text-muted">{t("subtitle")}</p>
        <DataAge
          at={defi.updatedAt}
          stale={defi.stale}
          className="mt-2 block text-meta"
        />
      </header>

      <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[2px] border border-line bg-line sm:grid-cols-3">
        <div className="bg-surface px-4 py-3">
          <dt className="text-label text-faint">{t("totalTvl")}</dt>
          <dd className="mt-1 font-mono text-data text-ink">
            {formatUsd(defi.totalTvl, true)}
            {defi.change1d != null && (
              <span className={`ml-2 text-label ${deltaClass(defi.change1d)}`}>
                {defi.change1d >= 0 ? "▲" : "▼"} {formatPct(defi.change1d)}
              </span>
            )}
          </dd>
        </div>
        <div className="bg-surface px-4 py-3">
          <dt className="text-label text-faint">{t("count")}</dt>
          <dd className="mt-1 font-mono text-data text-ink">
            {defi.chains.length}
          </dd>
        </div>
        <div className="bg-surface px-4 py-3">
          <dt className="text-label text-faint">{t("leader")}</dt>
          <dd className="mt-1 font-mono text-data text-ink">
            {defi.chains[0]?.name ?? "—"}
            <span className="ml-2 text-label text-faint tabular-nums">
              {formatPct(
                total > 0 ? (defi.chains[0]?.tvl ?? 0) / total * 100 : 0,
                1,
              )}
            </span>
          </dd>
        </div>
      </dl>

      <section className="mt-4 overflow-hidden rounded-[2px] border border-line">
        <table className="w-full border-collapse bg-surface text-meta">
          <thead>
            <tr className="border-b border-line text-left text-label text-faint">
              <th className="px-3 py-2 font-medium">#</th>
              <th className="px-3 py-2 font-medium">{t("chain")}</th>
              <th className="hidden px-3 py-2 font-medium sm:table-cell">
                {t("share")}
              </th>
              <th className="px-3 py-2 text-right font-medium">TVL</th>
              <th className="px-3 py-2 text-right font-medium">{t("d1")}</th>
            </tr>
          </thead>
          <tbody>
            {defi.chains.map((c, i) => {
              const share = total > 0 ? (c.tvl / total) * 100 : 0;
              const d = chainDelta.get(c.name);
              const d1 = d && d.den > 0 ? d.num / d.den : null;
              const prevShare =
                d1 != null && prevTotal > 0
                  ? ((c.tvl / (1 + d1 / 100)) / prevTotal) * 100
                  : share;
              return (
                <tr key={c.name} className="border-b border-line last:border-0">
                  <td className="px-3 py-2 font-mono text-faint tabular-nums">
                    {i + 1}
                  </td>
                  <td className="px-3 py-2 font-medium text-ink">{c.name}</td>
                  <td className="hidden px-3 py-2 sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-full max-w-40 rounded-sm bg-surface-3">
                        <GrowBar share={share} prevShare={prevShare} />
                      </div>
                      <span className="font-mono text-label text-faint tabular-nums">
                        {formatPct(share, 1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-ink">
                    {formatUsd(c.tvl, true)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-mono tabular-nums ${d1 == null ? "text-faint" : deltaClass(d1)}`}
                  >
                    {d1 == null ? "—" : formatPct(d1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* O comparador — duas cadeias lado a lado, métricas a interpolar
          na troca. Bump chart fica bloqueado: precisa de série histórica
          por cadeia que ainda não existe (DESENHO-V4 §6). */}
      <ChainComparator defi={defi} />

      <p className="mt-3 text-label text-faint">{t("source")}</p>
    </div>
  );
}

/**
 * Barra de quota que cresce a partir do estado anterior — a animação
 * codifica o Δ1d ponderado (se o mercado mudasse, a barra mudava).
 * Duração do Maestro; reduced-motion mostra o estado final directo.
 */
function GrowBar({ share, prevShare }: { share: number; prevShare: number }) {
  const motion = useMotion();
  const [w, setW] = useState(prevShare);
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setW(share)),
    );
    return () => cancelAnimationFrame(raf);
  }, [share]);
  return (
    <div
      className="h-full rounded-sm bg-accent"
      style={{
        width: `${Math.min(100, Math.max(0, w))}%`,
        transition: motion.subdued
          ? "none"
          : `width ${0.9 * motion.cadence}s var(--ease-out)`,
      }}
    />
  );
}
