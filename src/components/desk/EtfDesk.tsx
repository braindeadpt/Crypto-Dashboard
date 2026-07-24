"use client";

import { Link } from "@/i18n/navigation";
import type { EtfAssetFlows, EtfSnapshot } from "@/lib/data/etf";
import { cn, formatUsdMillions } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";

export function EtfDesk({ data }: { data: EtfSnapshot }) {
  const t = useTranslations("etf");
  const locale = useLocale();

  return (
    <div className="mx-auto max-w-[1400px] section-pad pb-20 pt-6 enter">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted">{t("subtitle")}</p>
        {data.stale && (
          <p className="mt-2 font-mono text-[0.7rem] text-warn">
            {t("staleAge", {
              date:
                data.btc.latest?.dateLabel ??
                (data.ingestedAt
                  ? new Date(data.ingestedAt).toLocaleDateString(locale)
                  : "—"),
            })}
          </p>
        )}
        {!data.stale && data.btc.latest && (
          <p className="mt-2 font-mono text-[0.65rem] text-faint">
            {t("flowDate", { date: data.btc.latest.dateLabel })}
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
        <AssetCard title="Bitcoin spot" flows={data.btc} />
        <AssetCard title="Ethereum spot" flows={data.eth} />
        {data.sol?.latest ? (
          <AssetCard title="Solana spot" flows={data.sol} />
        ) : (
          <div className="border border-line bg-surface p-4">
            <p className="font-mono text-[0.65rem] uppercase tracking-wider text-faint">
              Solana spot
            </p>
            <p className="mt-3 text-sm text-muted">{t("solUnavailable")}</p>
          </div>
        )}
      </div>

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
          label={t("streak")}
          value={
            flows.streakDays === 0
              ? "—"
              : flows.streakDays > 0
                ? t("streakIn", { days: flows.streakDays })
                : t("streakOut", { days: Math.abs(flows.streakDays) })
          }
        />
      </div>

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
