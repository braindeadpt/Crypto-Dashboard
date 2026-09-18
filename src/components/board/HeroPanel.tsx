"use client";

import { AmbientField } from "@/components/ambient/AmbientField";
import { AnimatedNumber } from "@/components/board/AnimatedNumber";
import { Sparkline } from "@/components/board/Sparkline";
import { DataAge } from "@/components/explain/DataAge";
import { Link } from "@/i18n/navigation";
import {
  LOW_CONFIDENCE,
  READING_METHOD_ANCHOR,
  type ReadingSet,
} from "@/lib/reading";
import { cn, deltaClass, formatPct, formatUsd } from "@/lib/format";
import type { LiveTickerConnection } from "@/lib/hooks/useLiveTicker";
import type { MarketPosture } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";
import { Fragment, useState } from "react";

type Ticker = {
  px: number | undefined;
  chg: number | undefined;
  spark?: number[];
};

/**
 * Nível 0 — o cabeçalho do dia. Estrutura editorial, não painel:
 * masthead (data + regime) → a resposta (manchete + índice de leituras) →
 * a tape (preço live + vitals numa régua dividida por hairlines).
 */
export function HeroPanel({
  readings,
  date,
  btc,
  eth,
  sol,
  intensity = 0.5,
  posture,
  vitals,
  snapshotAt,
  readingsAt,
  live,
}: {
  readings: ReadingSet;
  date: string;
  btc: Ticker;
  eth: Ticker;
  sol: Ticker;
  /** Regime score 0..1 — o campo ambiental reage (calmo = esparso, tempestade = denso). */
  intensity?: number;
  posture?: MarketPosture;
  vitals?: {
    cap: number;
    capChg: number | null;
    vol: number;
    dom: number;
  };
  /** CoinGecko snapshot age — seed dos preços e fonte dos vitals (F2). */
  snapshotAt?: string | null;
  /** Idade das três leituras — input mais velho do bundle (F2). */
  readingsAt?: string | null;
  /** Estado do ticker live — quando "live", a tape mostra o último tick. */
  live?: { connection: LiveTickerConnection; lastUpdate: number | null };
}) {
  const t = useTranslations("readings");
  const ta = useTranslations("age");
  const tp = useTranslations("pulso");
  const locale = useLocale();
  const isPt = locale === "pt";
  // R5 — a afirmação aberta no recibo (índice em headlineClaims).
  const [openClaim, setOpenClaim] = useState<number | null>(null);
  const claims = readings.headlineClaims ?? [];
  const caveat = isPt ? readings.headlineCaveatPt : readings.headlineCaveatEn;

  return (
    <section>
      {/* Masthead — o cabeçalho do jornal: data, nome do dia, regime */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2">
        <p className="text-label text-faint">{t("todayEyebrow")}</p>
        <p className="flex items-center gap-3 text-label text-faint tabular-nums">
          {posture && (
            <span className={`chip chip-${posture}`}>
              {tp(`posture.${posture}`)}
            </span>
          )}
          {date}
        </p>
      </div>

      {/* A resposta — manchete de primeira página + faixa das três leituras */}
      <div className="relative overflow-hidden">
        <AmbientField intensity={intensity} />
        <div className="relative py-12 md:py-20">
          <div>
            {/* Brutal: alinhada à esquerda e a ocupar o ecrã. Centrada e
                estreita era a voz de publicação — esta é a voz do produto. */}
            <h1 className="max-w-[18ch] text-brutal text-ink">
              {claims.length
                ? claims.map((c, i) => (
                    <Fragment key={i}>
                      {i > 0 && " "}
                      <button
                        type="button"
                        aria-expanded={openClaim === i}
                        aria-label={`${t("claimAria")}: ${isPt ? c.textPt : c.textEn}`}
                        onClick={() =>
                          setOpenClaim(openClaim === i ? null : i)
                        }
                        className={cn(
                          "claim-mark cursor-pointer transition-colors hover:text-accent-2",
                          openClaim === i && "text-accent-2",
                        )}
                        style={{ font: "inherit", letterSpacing: "inherit" }}
                      >
                        {isPt ? c.textPt : c.textEn}
                        <sup
                          aria-hidden
                          className="ml-1 font-mono text-[0.42em] font-medium text-accent-2"
                        >
                          {i + 1}
                        </sup>
                      </button>
                    </Fragment>
                  ))
                : isPt
                  ? readings.headlinePt
                  : readings.headlineEn}
              {caveat ? ` ${caveat}` : ""}
            </h1>
            {claims.length > 0 && (
              <p className="mt-4 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-faint">
                {t("claimsHint")}
              </p>
            )}
            {openClaim != null && claims[openClaim] && (
              <div className="mx-auto max-w-xl text-left">
                <ClaimReceipt
                  reading={readings[claims[openClaim].reading]}
                />
              </div>
            )}
            <p className="mx-auto mt-8 max-w-xl border-l-2 border-accent-2 pl-4 text-left text-body text-muted">
              <span className="text-label text-accent-2">{t("watch")} </span>
              {isPt ? readings.watchPt : readings.watchEn}
            </p>
          </div>
        </div>

        {/* Índice — as três leituras como faixa de instrumentos dividida
            por hairlines, não uma coluna lateral */}
        <div className="relative grid divide-y divide-line border-t border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {(
            [
              ["01", readings.direction],
              ["02", readings.risk],
              ["03", readings.money],
            ] as const
          ).map(([n, r]) => (
            <ReadingRow key={r.id} n={n} reading={r} cell />
          ))}
        </div>
        {readingsAt && (
          <p className="relative border-t border-line pt-2 text-right text-meta">
            <DataAge at={readingsAt} />
          </p>
        )}
      </div>

      {/* A tape — preço live e vitals numa régua dividida, sem caixa */}
      <div className="border-y border-line">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x lg:divide-line">
          {/* BTC — célula dominante com sparkline */}
          <div className="col-span-2 py-4 sm:col-span-3 lg:col-span-2 lg:pr-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-tag text-faint">BTC</p>
                <p className="mt-2 text-colossal text-ink">
                  {btc.px != null ? (
                    <AnimatedNumber
                      value={btc.px}
                      format={formatUsd}
                      className={deltaClass(btc.chg ?? 0)}
                    />
                  ) : (
                    "—"
                  )}
                  {btc.chg != null && (
                    <span className={`ml-3 text-data ${deltaClass(btc.chg)}`}>
                      {btc.chg >= 0 ? "▲" : "▼"} {formatPct(btc.chg)}
                    </span>
                  )}
                </p>
              </div>
              {btc.spark && btc.spark.length > 1 && (
                <div className="min-w-32 flex-1">
                  <p className="mb-1 text-label text-faint">{t("spark7d")}</p>
                  <Sparkline
                    points={btc.spark}
                    up={(btc.chg ?? 0) >= 0}
                    className="block w-full"
                    height={40}
                  />
                </div>
              )}
            </div>
          </div>
          <TapeCell
            label="ETH"
            value={eth.px}
            format={formatUsd}
            delta={eth.chg}
          />
          <TapeCell
            label="SOL"
            value={sol.px}
            format={formatUsd}
            delta={sol.chg}
          />
          {vitals && (
            <>
              <TapeCell
                label={t("vitalsCap")}
                value={vitals.cap}
                format={(n) => formatUsd(n, true)}
                delta={vitals.capChg}
              />
              <TapeCell
                label={t("vitalsDom")}
                value={vitals.dom}
                format={(n) => formatPct(n, 1)}
              />
            </>
          )}
        </div>
        {(snapshotAt || live) && (
          <div className="flex items-center justify-between gap-3 border-t border-line px-1 py-1.5">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-faint">
              CoinGecko <DataAge at={snapshotAt} />
            </span>
            {live?.connection === "live" && live.lastUpdate != null && (
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-accent">
                {ta("live")} ·{" "}
                {new Date(live.lastUpdate).toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function TapeCell({
  label,
  value,
  format,
  delta,
}: {
  label: string;
  value: number | null | undefined;
  format: (n: number) => string;
  delta?: number | null;
}) {
  return (
    <div className="py-4 lg:pl-6">
      <p className="text-label text-faint">{label}</p>
      <p className="mt-1 font-mono text-data text-ink">
        <AnimatedNumber value={value} format={format} flash />
        {delta != null && (
          <span className={`ml-1.5 text-label ${deltaClass(delta)}`}>
            {formatPct(delta)}
          </span>
        )}
      </p>
    </div>
  );
}

function ReadingRow({
  n,
  reading,
  cell = false,
}: {
  n: string;
  reading: ReadingSet["direction"];
  /** Na faixa horizontal do hero a leitura é uma célula, não uma linha. */
  cell?: boolean;
}) {
  const t = useTranslations("readings");
  const locale = useLocale();
  const isPt = locale === "pt";
  const sentence = isPt ? reading.sentencePt : reading.sentenceEn;
  const tone =
    reading.id === "risk"
      ? reading.value >= 70
        ? "text-storm"
        : reading.value >= 45
          ? "text-warn"
          : "text-up"
      : reading.band === "muito-positivo" || reading.band === "positivo"
        ? "text-up"
        : reading.band === "muito-negativo" || reading.band === "negativo"
          ? "text-down"
          : "text-ink";
  const isRisk = reading.id === "risk";
  const pos = isRisk ? reading.value : (reading.value + 100) / 2;

  return (
    <div
      className={
        cell
          ? "py-5 sm:px-6 sm:first:pl-0 sm:last:pr-0"
          : "border-b border-line py-4 last:border-0 first:pt-0 lg:first:pt-0"
      }
    >
      {/* Brutal: o rótulo encolhe, o número domina. O contraste de escala é o
          instrumento — um valor que importa é enorme, o que o nomeia é tag. */}
      <p className="text-tag text-faint">
        <span className="mr-2 text-accent">{n}</span>
        {t(`${reading.id}.label`)}
      </p>
      <p className={`mt-1 text-colossal ${tone}`}>
        {reading.confidence === 0
          ? "—"
          : isRisk
            ? reading.value
            : `${reading.value > 0 ? "+" : ""}${reading.value}`}
      </p>
      {reading.confidence > 0 && (
        <div
          className="mt-3 h-2 w-full bg-line/40"
          role="presentation"
        >
          {/* Régua em massa, não em filete: a cor chega em bloco. */}
          <div
            className={`sat-rule ${tone}`}
            style={{ width: `${Math.max(2, Math.min(100, pos))}%` }}
          />
        </div>
      )}
      <p className="mt-3 text-meta leading-snug text-muted">{sentence}</p>
      {reading.confidence > 0 && reading.confidence < LOW_CONFIDENCE && (
        <p className="mt-1 text-meta text-warn">
          {t("partial", {
            missing: reading.gaps
              .map((g) => (isPt ? g.labelPt : g.labelEn))
              .join(", "),
          })}
        </p>
      )}

      {/* R3/R9 — a leitura audita-se: ingredientes, lacunas e a regra publicada */}
      <details className="group/audit mt-2">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-meta text-faint transition hover:text-muted">
          <span
            aria-hidden
            className="font-mono transition-transform group-open/audit:rotate-90"
          >
            ▸
          </span>
          {t("audit")}
        </summary>
        <div className="mt-2 border border-line">
          <ReadingAuditBody reading={reading} />
        </div>
      </details>
    </div>
  );
}

/**
 * O rasto auditável de uma leitura — partilhado entre o detalhe de cada
 * índice e o recibo das afirmações da manchete (R5).
 */
function ReadingAuditBody({
  reading,
}: {
  reading: ReadingSet["direction"];
}) {
  const t = useTranslations("readings");
  const locale = useLocale();
  const isPt = locale === "pt";
  return (
    <>
      <ul>
        {reading.contributors.map((c) => (
          <li
            key={c.id}
            className="flex items-baseline justify-between gap-3 border-b border-line/60 px-2 py-1 text-meta last:border-0"
          >
            <span className="min-w-0">
              <span className="text-ink">
                {isPt ? c.labelPt : c.labelEn}
              </span>
              {c.detailPt && (
                <span className="ml-1.5 text-faint">
                  {isPt ? c.detailPt : c.detailEn}
                </span>
              )}
            </span>
            <span
              className={`shrink-0 font-mono tabular-nums ${
                c.points >= 0 ? "text-up" : "text-down"
              }`}
            >
              {c.points > 0 ? "+" : ""}
              {c.points}
            </span>
          </li>
        ))}
        {reading.gaps.map((g) => (
          <li
            key={g.id}
            className="flex items-baseline justify-between gap-3 border-b border-line/60 px-2 py-1 text-meta last:border-0"
          >
            <span className="min-w-0">
              <span className="text-faint">
                {isPt ? g.labelPt : g.labelEn}
              </span>
              <span className="ml-1.5 text-warn">{t("auditMissing")}</span>
            </span>
            <span className="shrink-0 font-mono tabular-nums text-faint">
              {t("auditWeight", { weight: g.weight })}
            </span>
          </li>
        ))}
      </ul>
      <p className="flex items-baseline justify-between gap-3 border-t border-line px-2 py-1.5 text-meta text-faint">
        <span>
          {t("auditCoverage", {
            pct: Math.round(reading.confidence * 100),
          })}
        </span>
        <Link
          href={`/metodologia#${READING_METHOD_ANCHOR[reading.id]}`}
          className="text-accent-2 transition hover:text-accent"
        >
          {t("auditMethod")}
        </Link>
      </p>
    </>
  );
}

/**
 * Recibo de uma afirmação da manchete (R5): abre a leitura que a sustenta
 * — ingredientes, lacunas, cobertura e a metodologia publicada.
 */
function ClaimReceipt({
  reading,
}: {
  reading: ReadingSet["direction"];
}) {
  const t = useTranslations("readings");
  const isRisk = reading.id === "risk";
  return (
    <div
      className="mt-4 max-w-xl border border-line bg-surface"
      data-testid="claim-receipt"
    >
      <p className="flex items-baseline justify-between gap-3 border-b border-line px-2 py-2">
        <span className="text-label text-faint">
          {t(`${reading.id}.label`)} · {t("claimReceipt")}
        </span>
        <span className="font-mono text-meta tabular-nums text-ink">
          {isRisk
            ? reading.value
            : `${reading.value > 0 ? "+" : ""}${reading.value}`}
        </span>
      </p>
      <ReadingAuditBody reading={reading} />
    </div>
  );
}
