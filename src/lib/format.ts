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

export function formatNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: digits,
  }).format(value);
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function deltaClass(value: number): string {
  if (value > 0) return "delta-up";
  if (value < 0) return "delta-down";
  return "text-muted";
}
