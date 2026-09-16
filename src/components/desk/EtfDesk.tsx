"use client";

import { DataAge } from "@/components/explain/DataAge";
import { Link } from "@/i18n/navigation";
import type { EtfAssetFlows, EtfDailyFlow, EtfSnapshot } from "@/lib/data/etf";
import {
  etfCumulativeSeries,
  etfRecordDays,
  etfWeeklyDelta,
} from "@/lib/data/etfDerived";
import { cn, formatUsdMillions } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";

export function EtfDesk({
  data,
  embedded = false,
}: {
  data: EtfSnapshot;
  embedded?: boolean;
}) {
  const t = useTranslations("etf");
  const locale = useLocale();

  return (
    <div
      className={`obs-shell section-pad pb-20 enter ${embedded ? "pt-8" : "pt-6"}`}
    >
      <header className="max-w-3xl">
        {embedded ? (
          <h2 className="font-display text-title text-ink">{t("title")}</h2>
        ) : (
          <h1 className="text-title">
            {t("title")}
          </h1>
        )}
        <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>
        {data.stale && (
          <p className="mt-2 font-mono text-[0.7rem] text-warn">
            {t("staleAge", {
              date:
                data.btc.latest?.dateLabel ??
                (data.ingestedAt
                  ? new Date(data.ingestedAt).toLocaleDateString(locale)
                  : "—"),
            })}{" "}
            <DataAge at={data.ingestedAt || data.updatedAt} stale />
          </p>
        )}
        {!data.stale && data.btc.latest && (
          <p className="mt-2 font-mono text-[0.65rem] text-faint">
            {t("flowDate", { date: data.btc.latest.dateLabel })} ·{" "}
            <DataAge at={data.updatedAt} />
          </p>
        )}
        <div
          className={cn(
            "mt-4 border px-3 py-3",
            data.signal.tone === "up" && "border-up/35 bg-up/5",
            data.signal.tone === "down" && "border-down/35 bg-down/5",
            data.signal.tone === "warn" && "border-warn/35 bg-warn/5",
            data.signal.tone === "neutral" && "border-line bg-surface",
          )}
        >
          <p className="font-mono text-[0.65rem] uppercase tracking-wider text-faint">
            {t("spotRead")}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink">
            {locale === "pt" ? data.signal.spotBidPt : data.signal.spotBidEn}
          </p>
        </div>
      </header>

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        <AssetCard title={t("spotAsset", { name: "Bitcoin" })} flows={data.btc} />
        <AssetCard title={t("spotAsset", { name: "Ethereum" })} flows={data.eth} />
        {data.sol?.latest ? (
          <AssetCard title={t("spotAsset", { name: "Solana" })} flows={data.sol} />
        ) : (
          <div className="border border-line bg-surface p-4">
            <p className="font-mono text-[0.65rem] uppercase tracking-wider text-faint">
              {t("spotAsset", { name: "Solana" })}
            </p>
            <p className="mt-3 text-sm text-muted">{t("solUnavailable")}</p>
          </div>
        )}
      </div>

      <p className="mt-2 font-mono text-[0.65rem] text-faint">
        {t("recordsNote", { days: data.btc.history.length })}
      </p>

      <CumulativeFlows
        series={[
          { label: "BTC", className: "text-accent", flows: data.btc },
          { label: "ETH", className: "text-accent-2", flows: data.eth },
          ...(data.sol?.latest
            ? [
                {
                  label: "SOL",
                  className: "text-up",
                  flows: data.sol as EtfAssetFlows,
                },
              ]
            : []),
        ]}
      />

      <section className="mt-6 border border-line bg-surface p-4">
        <h2 className="font-mono text-[0.65rem] uppercase tracking-wider text-faint">
          {t("whyItMatters")}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          {t("whyBody")}
        </p>
      </section>

      <HistoryTable title="BTC" flows={data.btc} />
      <HistoryTable title="ETH" flows={data.eth} />

      <p className="mt-4 font-mono text-[0.65rem] text-faint">
        {t("source")}{" "}
        <a
          href={data.btc.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          farside.co.uk/btc
        </a>
        {" · "}
        <a
          href={data.eth.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          farside.co.uk/eth
        </a>
        {" · "}
        {t("unit")}
      </p>

      <p className="mt-3">
        <Link href="/" className="font-mono text-[0.7rem] text-accent">
          ← Board
        </Link>
      </p>
    </div>
  );
}

function AssetCard({ title, flows }: { title: string; flows: EtfAssetFlows }) {
  const t = useTranslations("etf");
  const latest = flows.latest;
  const prev = flows.previous;
  const week = etfWeeklyDelta(flows.history);
  const records = etfRecordDays(flows.history);
  const weekDelta =
    week.last5 != null && week.prev5 != null ? week.last5 - week.prev5 : null;
  const tone = !latest
    ? "text-muted"
    : latest.totalUsdM > 0
      ? "text-up"
      : latest.totalUsdM < 0
        ? "text-down"
        : "text-muted";

  const topTickers = Object.entries(latest?.byTicker ?? {})
    .filter(([, v]) => v != null && Math.abs(v) > 0.01)
    .sort((a, b) => Math.abs(b[1]!) - Math.abs(a[1]!))
    .slice(0, 4);

  return (
    <div className="border border-line bg-surface p-4">
      <p className="font-mono text-[0.65rem] uppercase tracking-wider text-faint">
        {title}
      </p>
      <p className="mt-1 font-mono text-[0.65rem] text-faint">
        {latest?.dateLabel ?? "—"}
      </p>
      <p className={`mt-2 font-mono text-3xl font-medium tabular-nums ${tone}`}>
        {latest ? formatUsdMillions(latest.totalUsdM) : "—"}
      </p>
      <p className="mt-1 font-mono text-[0.7rem] text-faint">{t("net1d")}</p>

      <div className="mt-4 space-y-1.5 border-t border-line pt-3">
        <Metric
          label={t("prev")}
          value={prev ? formatUsdMillions(prev.totalUsdM) : "—"}
          tone={prev ? (prev.totalUsdM >= 0 ? "text-up" : "text-down") : ""}
        />
        <Metric
          label={t("sum5d")}
          value={
            flows.sum5dUsdM != null ? formatUsdMillions(flows.sum5dUsdM) : "—"
          }
          tone={
            flows.sum5dUsdM != null
              ? flows.sum5dUsdM >= 0
                ? "text-up"
                : "text-down"
              : ""
          }
        />
        <Metric
          label={t("sum20d")}
          value={
            flows.sum20dUsdM != null ? formatUsdMillions(flows.sum20dUsdM) : "—"
          }
          tone={
            flows.sum20dUsdM != null
              ? flows.sum20dUsdM >= 0
                ? "text-up"
                : "text-down"
              : ""
          }
        />
        <Metric
          label={t("weekDelta")}
          value={
            weekDelta != null ? formatUsdMillions(weekDelta) : "—"
          }
          tone={
            weekDelta != null
              ? weekDelta >= 0
                ? "text-up"
                : "text-down"
              : ""
          }
        />
        <Metric
          label={t("streak")}
          value={
            flows.streakDays === 0
              ? "—"
              : flows.streakDays > 0
                ? t("streakIn", { days: flows.streakDays })
                : t("streakOut", { days: Math.abs(flows.streakDays) })
          }
        />
        <Metric
          label={t("recordIn")}
          value={
            records.inflow
              ? `${formatUsdMillions(records.inflow.totalUsdM)} · ${records.inflow.dateLabel}`
              : "—"
          }
          tone={records.inflow ? "text-up" : ""}
        />
        <Metric
          label={t("recordOut")}
          value={
            records.outflow
              ? `${formatUsdMillions(records.outflow.totalUsdM)} · ${records.outflow.dateLabel}`
              : "—"
          }
          tone={records.outflow ? "text-down" : ""}
        />
      </div>

      <FlowBars history={flows.history} />

      {topTickers.length > 0 && (
        <ul className="mt-4 space-y-1 border-t border-line pt-3">
          {topTickers.map(([ticker, v]) => (
            <li key={ticker} className="flex justify-between text-sm">
              <span className="font-mono text-muted">{ticker}</span>
              <span
                className={`font-mono tabular-nums ${
                  (v ?? 0) >= 0 ? "text-up" : "text-down"
                }`}
              >
                {formatUsdMillions(v!)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Cumulativo da amostra (R6) — a soma corrida por activo, alinhada por data.
 * A vista que a tabela nua da fonte não tem. A legenda declara o fim da
 * série; o rodapé declara que a amostra não é o total desde o lançamento.
 */
function CumulativeFlows({
  series,
}: {
  series: { label: string; className: string; flows: EtfAssetFlows }[];
}) {
  const t = useTranslations("etf");
  const perSeries = series.map((s) => ({
    ...s,
    points: etfCumulativeSeries(s.flows.history),
  }));

  const dates = [
    ...new Set(perSeries.flatMap((s) => s.points.map((p) => p.date))),
  ].sort();
  if (dates.length < 2) return null;

  const values = perSeries.flatMap((s) => s.points.map((p) => p.cumUsdM));
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const span = Math.max(1, max - min);

  const W = 720;
  const H = 200;
  const PAD = { l: 8, r: 56, t: 10, b: 20 };
  const x = (date: string) => {
    const i = dates.indexOf(date);
    return PAD.l + (i / (dates.length - 1)) * (W - PAD.l - PAD.r);
  };
  const y = (v: number) =>
    PAD.t + (1 - (v - min) / span) * (H - PAD.t - PAD.b);

  return (
    <section className="mt-6 border border-line bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-mono text-[0.65rem] uppercase tracking-wider text-faint">
          {t("cumulativeTitle")}
        </h2>
        <div className="flex gap-3 font-mono text-[0.65rem]">
          {perSeries.map((s) => (
            <span key={s.label} className={s.className}>
              ● {s.label}{" "}
              <span className="tabular-nums">
                {formatUsdMillions(s.points[s.points.length - 1]?.cumUsdM ?? 0)}
              </span>
            </span>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full"
        role="img"
        aria-label={t("cumulativeTitle")}
      >
        <line
          x1={PAD.l}
          y1={y(0)}
          x2={W - PAD.r}
          y2={y(0)}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-line"
        />
        <text
          x={PAD.l}
          y={H - 6}
          className="fill-faint font-mono text-[9px]"
        >
          {dates[0]}
        </text>
        <text
          x={W - PAD.r}
          y={H - 6}
          textAnchor="end"
          className="fill-faint font-mono text-[9px]"
        >
          {dates[dates.length - 1]}
        </text>
        {perSeries.map((s) => (
          <g key={s.label} className={s.className}>
            <polyline
              points={s.points.map((p) => `${x(p.date)},${y(p.cumUsdM)}`).join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            {(() => {
              const last = s.points[s.points.length - 1];
              if (!last) return null;
              return (
                <text
                  x={x(last.date) + 4}
                  y={y(last.cumUsdM) + 3}
                  className="fill-current font-mono text-[9px]"
                >
                  {s.label}
                </text>
              );
            })()}
          </g>
        ))}
      </svg>
      <p className="mt-2 font-mono text-[0.65rem] text-faint">
        {t("cumulativeNote", { days: dates.length })}
      </p>
    </section>
  );
}

/** Daily net-flow bars — last ~20 days, up/down tone. */
function FlowBars({ history }: { history: EtfDailyFlow[] }) {
  const days = history.slice(-20);
  if (days.length < 2) return null;
  const W = 240;
  const H = 48;
  const mid = H / 2;
  const maxAbs = Math.max(...days.map((d) => Math.abs(d.totalUsdM)), 1);
  const bw = W / days.length;
  return (
    <div className="mt-4 border-t border-line pt-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Daily net flows"
      >
        <line
          x1="0"
          y1={mid}
          x2={W}
          y2={mid}
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-line"
        />
        {days.map((d, i) => {
          const h = (Math.abs(d.totalUsdM) / maxAbs) * (H / 2 - 2);
          const up = d.totalUsdM >= 0;
          return (
            <rect
              key={d.date}
              x={i * bw + 1}
              y={up ? mid - h : mid}
              width={Math.max(1, bw - 2)}
              height={Math.max(0.5, h)}
              className={up ? "fill-up" : "fill-down"}
            />
          );
        })}
      </svg>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className={`font-mono tabular-nums ${tone ?? ""}`}>{value}</span>
    </div>
  );
}

function HistoryTable({
  title,
  flows,
}: {
  title: string;
  flows: EtfAssetFlows;
}) {
  const t = useTranslations("etf");
  const rows = [...flows.history].reverse().slice(0, 12);
  return (
    <section className="mt-6">
      <h2 className="font-mono text-[0.65rem] uppercase tracking-wider text-faint">
        {title} · {t("history")}
      </h2>
      <div className="mt-2 overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-[0.62rem] uppercase text-faint">
              <th className="px-3 py-2">{t("date")}</th>
              <th className="px-3 py-2">{t("net")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.date} className="border-b border-line/80">
                <td className="px-3 py-2 font-mono text-muted">{r.dateLabel}</td>
                <td
                  className={`px-3 py-2 font-mono tabular-nums ${
                    r.totalUsdM >= 0 ? "text-up" : "text-down"
                  }`}
                >
                  {formatUsdMillions(r.totalUsdM)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
