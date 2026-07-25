"use client";

import { Link } from "@/i18n/navigation";
import { formatUsd } from "@/lib/format";
import {
  useForceLiquidations,
  type ForceLiqConnection,
} from "@/lib/hooks/useForceLiquidations";
import { useTranslations } from "next-intl";

type Props = {
  compact?: boolean;
  href?: "/fluxos" | null;
};

function connectionLabel(
  t: ReturnType<typeof useTranslations<"board">>,
  c: ForceLiqConnection,
) {
  if (c === "live") return t("liqLive");
  if (c === "reconnecting") return t("liqReconnecting");
  if (c === "offline") return t("liqOffline");
  return t("liqConnecting");
}

export function LiveLiquidations({ compact = false, href = "/fluxos" }: Props) {
  const t = useTranslations("board");
  const data = useForceLiquidations();
  const top = data.events.slice(0, compact ? 4 : 8);

  return (
    <section
      className={`border bg-surface ${
        data.connection === "live" ? "border-line" : "border-warn/35"
      } ${compact ? "p-3" : "p-5"}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2
            className={`font-semibold tracking-tight ${
              compact ? "text-sm" : "text-xl"
            }`}
          >
            {href ? (
              <Link href={href} className="hover:text-accent">
                {t("liquidation")}
              </Link>
            ) : (
              t("liquidation")
            )}
          </h2>
          <span
            className={`font-mono text-[0.62rem] uppercase tracking-wider ${
              data.connection === "live"
                ? "text-accent"
                : data.connection === "offline"
                  ? "text-faint"
                  : "text-warn"
            }`}
          >
            {connectionLabel(t, data.connection)}
          </span>
        </div>
        <span className="font-mono text-[0.58rem] uppercase tracking-wider text-faint">
          {t("liqWindow")}
        </span>
      </div>

      <p className="mt-1 font-mono text-[0.62rem] text-faint">{t("liqSource")}</p>

      <div className={`grid gap-2 ${compact ? "mt-2 grid-cols-2" : "mt-4 sm:grid-cols-3"}`}>
        <Stat
          label={t("liqLongs")}
          value={formatUsd(data.longNotional, true)}
          tone="down"
        />
        <Stat
          label={t("liqShorts")}
          value={formatUsd(data.shortNotional, true)}
          tone="up"
        />
        {!compact && (
          <Stat
            label={t("biasLabel")}
            value={t(`bias.${data.bias}`)}
            tone="neutral"
          />
        )}
      </div>

      {top.length === 0 ? (
        <p className="mt-3 font-mono text-[0.7rem] text-muted">{t("liqWaiting")}</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {top.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-2 font-mono text-[0.7rem]"
            >
              <span className="text-faint">
                {e.symbol.replace("USDT", "")} ·{" "}
                <span className={e.side === "long" ? "text-down" : "text-up"}>
                  {e.side === "long" ? t("liqLongs") : t("liqShorts")}
                </span>
              </span>
              <span className="tabular-nums text-ink">
                {formatUsd(e.notional, true)} @ {formatUsd(e.price)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "up" | "down" | "neutral";
}) {
  return (
    <div className="border border-line/80 bg-bg-elevated p-2.5">
      <p className="font-mono text-[0.58rem] uppercase tracking-wider text-faint">
        {label}
      </p>
      <p
        className={`mt-0.5 font-mono text-sm tabular-nums ${
          tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-ink"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
