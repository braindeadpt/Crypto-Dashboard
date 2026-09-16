export function formatUsd(value: number, compact = false): string {
  if (!Number.isFinite(value)) return "—";
  if (compact) {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: value >= 1e9 ? 2 : 1,
    }).format(value);
  }
  if (value >= 1000) {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  }
  if (value >= 1) {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(value);
  }
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: "USD",
    maximumSignificantDigits: 4,
  }).format(value);
}

export function formatPct(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

/** ETF flow amounts reported in US$ millions (Farside convention). */
export function formatUsdMillions(m: number, digits = 1): string {
  if (!Number.isFinite(m)) return "—";
  const sign = m > 0 ? "+" : "";
  return `${sign}${m.toFixed(digits)}M`;
}

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: digits,
  }).format(value);
}

/**
 * Oldest timestamp wins: for computed artefacts (regime, readings) the honest
 * data age is the stalest input, not the render time.
 */
export function oldestIso(
  ...isos: Array<string | null | undefined>
): string | null {
  let oldest: number | null = null;
  for (const iso of isos) {
    if (!iso) continue;
    const t = Date.parse(iso);
    if (Number.isFinite(t) && (oldest == null || t < oldest)) oldest = t;
  }
  return oldest == null ? null : new Date(oldest).toISOString();
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function deltaClass(value: number): string {
  if (value > 0) return "delta-up";
  if (value < 0) return "delta-down";
  return "text-muted";
}
