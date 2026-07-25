"use client";

import type { ReactNode } from "react";

type Stroke = {
  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;
  strokeLinecap?: "butt" | "round" | "square";
  strokeDasharray?: string;
};

/**
 * Simple educational SVG per atlas slug — diagram first, prose second.
 */
export function AtlasDiagram({
  slug,
  title,
  className = "",
}: {
  slug: string;
  title: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 160 96"
      className={`h-auto w-full max-w-[200px] border border-line bg-surface ${className}`}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {diagramFor(slug)}
    </svg>
  );
}

function ink(extra: Stroke = {}): Stroke {
  return { fill: "none", stroke: "var(--ink)", strokeWidth: 1.5, ...extra };
}

function muted(extra: Stroke = {}): Stroke {
  return { fill: "none", stroke: "var(--muted)", strokeWidth: 1.2, ...extra };
}

function accent(extra: Stroke = {}): Stroke {
  return { fill: "none", stroke: "var(--accent)", strokeWidth: 1.5, ...extra };
}

function label(x: number, y: number, text: string, faint = false) {
  return (
    <text
      x={x}
      y={y}
      fill={faint ? "var(--faint)" : "var(--muted)"}
      style={{ fontSize: 8, fontFamily: "var(--font-mono)" }}
    >
      {text}
    </text>
  );
}

function diagramFor(slug: string): ReactNode {
  switch (slug) {
    case "bitcoin":
      return (
        <>
          <circle cx="80" cy="48" r="28" {...ink()} />
          <text
            x="80"
            y="53"
            textAnchor="middle"
            fill="var(--ink)"
            style={{ fontSize: 18, fontFamily: "var(--font-display)" }}
          >
            ₿
          </text>
          {label(52, 88, "21M cap", true)}
        </>
      );
    case "halving":
      return (
        <>
          <rect x="20" y="30" width="50" height="28" {...ink()} />
          <rect x="90" y="38" width="50" height="20" {...accent()} />
          {label(28, 48, "50")}
          {label(100, 52, "25")}
          <path d="M72 44 H86" {...accent()} />
          {label(55, 78, "÷2 / ~4y", true)}
        </>
      );
    case "ciclo-de-4-anos":
      return (
        <>
          <circle cx="80" cy="48" r="30" {...muted()} />
          <path
            d="M80 18 A30 30 0 0 1 110 48"
            {...accent({ strokeWidth: 6, strokeLinecap: "round" })}
          />
          <circle cx="110" cy="48" r="4" fill="var(--accent)" />
          {label(58, 88, "map ≠ GPS", true)}
        </>
      );
    case "volatilidade":
      return (
        <>
          <path d="M16 60 L40 28 L64 70 L88 22 L112 55 L144 35" {...ink()} />
          {label(50, 88, "amplitude", true)}
        </>
      );
    case "medo-e-ganancia":
      return (
        <>
          <rect x="24" y="40" width="112" height="12" {...muted()} />
          <rect
            x="24"
            y="40"
            width="72"
            height="12"
            fill="color-mix(in srgb, var(--accent) 40%, transparent)"
            stroke="var(--accent)"
            strokeWidth="1"
          />
          {label(24, 32, "0")}
          {label(128, 32, "100")}
          {label(60, 72, "coincidente", true)}
        </>
      );
    case "funding-rate":
      return (
        <>
          <path d="M40 70 V30 H70" {...ink()} />
          <path d="M120 30 V70 H90" {...muted()} />
          {label(28, 24, "L→S")}
          {label(96, 88, "S→L", true)}
        </>
      );
    case "open-interest":
      return (
        <>
          <rect x="30" y="55" width="20" height="20" {...muted()} />
          <rect x="58" y="40" width="20" height="35" {...muted()} />
          <rect x="86" y="28" width="20" height="47" {...accent()} />
          <rect x="114" y="35" width="20" height="40" {...ink()} />
          {label(48, 88, "OI open", true)}
        </>
      );
    case "liquidacao":
      return (
        <>
          <path d="M20 30 L70 30 L70 70 L140 70" {...muted()} />
          <path d="M70 30 L110 70" {...accent({ strokeWidth: 2 })} />
          <circle cx="110" cy="70" r="4" fill="var(--down)" />
          {label(70, 88, "margin fail", true)}
        </>
      );
    case "alavancagem":
      return (
        <>
          <rect x="50" y="50" width="24" height="24" {...ink()} />
          <rect x="40" y="28" width="80" height="16" {...accent()} />
          {label(44, 88, "1× → 10×", true)}
        </>
      );
    case "dominancia-btc":
      return (
        <>
          <circle
            cx="80"
            cy="48"
            r="32"
            fill="color-mix(in srgb, var(--accent) 25%, transparent)"
            stroke="var(--accent)"
            strokeWidth="1.5"
          />
          <path
            d="M80 48 L80 16 A32 32 0 0 1 108 64 Z"
            fill="color-mix(in srgb, var(--ink) 12%, transparent)"
            stroke="var(--ink)"
            strokeWidth="1"
          />
          {label(55, 88, "BTC share", true)}
        </>
      );
    case "altcoins":
      return (
        <>
          <circle cx="50" cy="48" r="18" {...accent()} />
          <circle cx="90" cy="36" r="10" {...muted()} />
          <circle cx="108" cy="58" r="12" {...muted()} />
          <circle cx="78" cy="68" r="8" {...muted()} />
          {label(28, 24, "BTC")}
          {label(100, 88, "alts", true)}
        </>
      );
    case "ethereum":
      return (
        <>
          <path d="M80 18 L110 48 L80 58 L50 48 Z" {...ink()} />
          <path d="M80 58 L110 48 L80 82 L50 48 Z" {...muted()} />
          {label(62, 94, "ETH", true)}
        </>
      );
    case "defi":
      return (
        <>
          <circle cx="40" cy="48" r="12" {...ink()} />
          <circle cx="80" cy="32" r="12" {...ink()} />
          <circle cx="120" cy="48" r="12" {...ink()} />
          <circle cx="80" cy="68" r="12" {...ink()} />
          <path
            d="M50 42 L70 36 M90 36 L110 42 M90 60 L110 54 M50 54 L70 60"
            {...muted()}
          />
          {label(60, 92, "protocols", true)}
        </>
      );
    case "tvl":
      return (
        <>
          <rect x="40" y="24" width="80" height="52" {...muted()} />
          <rect
            x="48"
            y="40"
            width="64"
            height="28"
            fill="color-mix(in srgb, var(--accent) 30%, transparent)"
            stroke="var(--accent)"
            strokeWidth="1.2"
          />
          {label(62, 58, "locked")}
          {label(58, 88, "≠ quality", true)}
        </>
      );
    case "stablecoins":
      return (
        <>
          <rect x="36" y="28" width="88" height="40" rx="2" {...ink()} />
          <text
            x="80"
            y="54"
            textAnchor="middle"
            fill="var(--ink)"
            style={{ fontSize: 14, fontFamily: "var(--font-mono)" }}
          >
            ≈ $1
          </text>
          {label(48, 84, "peg attempt", true)}
        </>
      );
    case "dex":
      return (
        <>
          <circle cx="55" cy="48" r="16" {...ink()} />
          <circle cx="105" cy="48" r="16" {...accent()} />
          <path d="M71 48 H89" {...muted()} />
          {label(42, 84, "swap / AMM", true)}
        </>
      );
    case "gas":
      return (
        <>
          <path d="M40 70 H120" {...muted()} />
          <rect x="50" y="40" width="14" height="30" {...ink()} />
          <rect x="78" y="28" width="14" height="42" {...accent()} />
          <rect x="106" y="48" width="14" height="22" {...ink()} />
          {label(58, 88, "fee / demand", true)}
        </>
      );
    case "camada-2":
      return (
        <>
          <rect x="30" y="56" width="100" height="18" {...ink()} />
          <rect x="45" y="28" width="70" height="18" {...accent()} />
          {label(68, 40, "L2")}
          {label(68, 68, "L1")}
          {label(48, 88, "scale down", true)}
        </>
      );
    case "staking":
      return (
        <>
          <rect x="55" y="28" width="50" height="40" {...ink()} />
          <path d="M80 28 V18 M70 18 H90" {...accent()} />
          {label(58, 54, "lock")}
          {label(52, 84, "yield ≠ risk0", true)}
        </>
      );
    case "custodia":
      return (
        <>
          <rect x="28" y="30" width="44" height="36" {...ink()} />
          <path d="M50 30 V24 H40 V30" {...ink()} />
          <circle cx="112" cy="48" r="18" {...accent()} />
          <circle cx="112" cy="48" r="6" fill="var(--accent)" />
          {label(30, 84, "CEX")}
          {label(98, 84, "keys")}
        </>
      );
    case "mica":
      return (
        <>
          <rect x="24" y="24" width="112" height="48" {...ink()} />
          <path d="M24 40 H136 M70 24 V72" {...muted()} />
          {label(36, 34, "UE rules")}
          {label(48, 88, "CASP / issuer", true)}
        </>
      );
    case "risco":
      return (
        <>
          <path d="M80 20 L130 72 H30 Z" {...accent()} />
          <text
            x="80"
            y="58"
            textAnchor="middle"
            fill="var(--ink)"
            style={{ fontSize: 16, fontFamily: "var(--font-display)" }}
          >
            !
          </text>
          {label(52, 88, "loss possible", true)}
        </>
      );
    case "etf-spot":
      return (
        <>
          <rect x="24" y="32" width="50" height="36" {...muted()} />
          <rect x="86" y="32" width="50" height="36" {...accent()} />
          <path d="M74 50 H86" {...ink()} />
          {label(32, 54, "BTC")}
          {label(98, 54, "ETF")}
          {label(48, 84, "TradFi pipe", true)}
        </>
      );
    case "on-chain":
      return (
        <>
          <rect x="30" y="28" width="28" height="20" {...ink()} />
          <rect x="66" y="28" width="28" height="20" {...ink()} />
          <rect x="102" y="28" width="28" height="20" {...ink()} />
          <path d="M44 48 V60 H80 V48 M116 48 V60 H80" {...muted()} />
          {label(48, 84, "blocks", true)}
        </>
      );
    case "market-cap":
      return (
        <>
          <text
            x="80"
            y="44"
            textAnchor="middle"
            fill="var(--ink)"
            style={{ fontSize: 12, fontFamily: "var(--font-mono)" }}
          >
            P × S
          </text>
          <path d="M40 56 H120" {...muted()} />
          {label(42, 72, "price × supply")}
          {label(48, 88, "≠ fair value", true)}
        </>
      );
    case "liquidez":
      return (
        <>
          <path d="M30 60 H70 V40 H130" {...ink()} />
          <path d="M30 60 H70 V72 H130" {...muted()} />
          {label(40, 34, "thin book", true)}
          {label(88, 88, "depth", true)}
        </>
      );
    case "ordem-de-mercado":
      return (
        <>
          <path d="M30 48 H70" {...accent({ strokeWidth: 2 })} />
          <path d="M90 30 V66" {...muted({ strokeDasharray: "3 2" })} />
          <circle cx="70" cy="48" r="4" fill="var(--accent)" />
          {label(28, 72, "market")}
          {label(92, 72, "limit")}
          {label(48, 88, "now vs wait", true)}
        </>
      );
    case "dyor":
      return (
        <>
          <circle cx="80" cy="44" r="22" {...ink()} />
          <circle cx="80" cy="44" r="8" {...accent()} />
          <path
            d="M96 60 L118 78"
            {...ink({ strokeWidth: 3, strokeLinecap: "round" })}
          />
          {label(48, 88, "method > scroll", true)}
        </>
      );
    case "correlacao":
      return (
        <>
          <path d="M24 70 L50 40 L80 52 L110 28 L140 36" {...ink()} />
          <path d="M24 78 L50 50 L80 60 L110 40 L140 48" {...muted()} />
          {label(40, 88, "move together?", true)}
        </>
      );
    case "narrative":
      return (
        <>
          <path d="M36 60 Q60 20 80 48 Q100 76 124 36" {...accent()} />
          <circle cx="36" cy="60" r="3" fill="var(--muted)" />
          <circle cx="124" cy="36" r="3" fill="var(--accent)" />
          {label(48, 84, "attention story", true)}
        </>
      );
    default:
      return (
        <>
          <rect x="40" y="28" width="80" height="40" {...muted()} />
          {label(58, 52, "concept")}
          {label(52, 84, slug.slice(0, 14), true)}
        </>
      );
  }
}
