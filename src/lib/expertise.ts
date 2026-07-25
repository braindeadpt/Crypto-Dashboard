/**
 * Expertise dial — three density modes for the same data.
 * citizen = Essencial (explain more, show less)
 * operator = Operador (balanced)
 * analyst = Analista (everything, explain little)
 */

export type ExpertiseLevel = "citizen" | "operator" | "analyst";

export const EXPERTISE_STORAGE_KEY = "clareza-expertise";

export const EXPERTISE_LEVELS: ExpertiseLevel[] = [
  "citizen",
  "operator",
  "analyst",
];

export function isExpertiseLevel(v: unknown): v is ExpertiseLevel {
  return v === "citizen" || v === "operator" || v === "analyst";
}

export function parseExpertise(raw: string | null): ExpertiseLevel {
  if (isExpertiseLevel(raw)) return raw;
  return "operator";
}

/** Rank for min/max comparisons */
export function expertiseRank(level: ExpertiseLevel): number {
  switch (level) {
    case "citizen":
      return 0;
    case "operator":
      return 1;
    case "analyst":
      return 2;
  }
}

/**
 * Section visibility by density.
 * Sections with minLevel require at least that expertise.
 */
export type DensitySection =
  | "explanations"
  | "readings"
  | "tapeExtended"
  | "reguaExpanded"
  | "boardSecondary"
  | "boardYieldsMemes"
  | "rotation30d"
  | "sectorTable"
  | "liquidityTop"
  | "liquidityLeverageDetail"
  | "etfHistory"
  | "derivsTable"
  | "atlasFull"
  | "contextoPortugal"
  | "contextoBrief"
  | "methodSources";

const RULES: Record<
  DensitySection,
  { min?: ExpertiseLevel; max?: ExpertiseLevel }
> = {
  explanations: { max: "operator" }, // citizen + operator
  readings: { max: "operator" },
  tapeExtended: { min: "operator" },
  reguaExpanded: { min: "operator" },
  boardSecondary: { min: "operator" },
  boardYieldsMemes: { min: "analyst" },
  rotation30d: { min: "operator" },
  sectorTable: { min: "analyst" },
  liquidityTop: { min: "operator" },
  liquidityLeverageDetail: { min: "analyst" },
  etfHistory: { min: "analyst" },
  derivsTable: { min: "operator" },
  atlasFull: { min: "operator" },
  contextoPortugal: { min: "operator" },
  contextoBrief: { min: "analyst" },
  methodSources: { min: "analyst" },
};

export function showDensity(
  level: ExpertiseLevel,
  section: DensitySection,
): boolean {
  const rule = RULES[section];
  const r = expertiseRank(level);
  if (rule.min && r < expertiseRank(rule.min)) return false;
  if (rule.max && r > expertiseRank(rule.max)) return false;
  return true;
}
