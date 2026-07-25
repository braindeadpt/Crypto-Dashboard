"use client";

import { useState } from "react";
import { cn } from "@/lib/format";

type Labels = {
  type: string;
  typeHint: string;
  color: string;
  colorHint: string;
  elevation: string;
  elevationHint: string;
  motion: string;
  motionHint: string;
  direction: string;
  regime: string;
  roles: Record<string, string>;
  elev: Record<string, string>;
  typeSamples: Record<string, string>;
  deltaSample: string;
  flashHint: string;
  aaNote: string;
};

const SWATCHES: { token: string; varName: string; role: keyof Labels["roles"] }[] =
  [
    { token: "bg", varName: "--bg", role: "bg" },
    { token: "surface", varName: "--surface", role: "surface" },
    { token: "ink", varName: "--ink", role: "ink" },
    { token: "muted", varName: "--muted", role: "muted" },
    { token: "accent", varName: "--accent", role: "accent" },
    { token: "up", varName: "--up", role: "up" },
    { token: "down", varName: "--down", role: "down" },
    { token: "calm", varName: "--calm", role: "calm" },
    { token: "unsettled", varName: "--unsettled", role: "unsettled" },
    { token: "storm", varName: "--storm", role: "storm" },
    { token: "weird", varName: "--weird", role: "weird" },
    { token: "focus", varName: "--focus", role: "focus" },
  ];

export function StyleGuide({
  title,
  subtitle,
  labels,
}: {
  title: string;
  subtitle: string;
  labels: Labels;
}) {
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  return (
    <div className="obs-shell section-pad pb-20 pt-8 enter">
      <header className="max-w-3xl border-b border-line pb-8">
        <p className="text-label text-faint">CLAREZA · O Observatório</p>
        <h1 className="mt-3 text-display text-ink">{title}</h1>
        <p className="mt-3 text-body text-muted">{subtitle}</p>
        <p className="mt-4 text-meta text-faint">{labels.aaNote}</p>
      </header>

      {/* Typography */}
      <section className="mt-12">
        <h2 className="text-title text-ink">{labels.type}</h2>
        <p className="mt-1 text-meta text-muted">{labels.typeHint}</p>
        <div className="mt-6 space-y-6 border border-line bg-surface p-5 shadow-[var(--elev-1)]">
          <TypeRow
            size="12"
            className="text-label text-faint"
            sample={labels.typeSamples.label}
          />
          <TypeRow
            size="14"
            className="text-meta text-muted"
            sample={labels.typeSamples.meta}
          />
          <TypeRow
            size="18"
            className="text-body text-ink"
            sample={labels.typeSamples.body}
          />
          <TypeRow
            size="24"
            className="text-title text-ink"
            sample={labels.typeSamples.title}
          />
          <TypeRow
            size="40"
            className="text-display text-ink"
            sample={labels.typeSamples.display}
          />
          <TypeRow
            size="72"
            className="text-hero text-ink"
            sample={labels.typeSamples.hero}
          />
        </div>
      </section>

      {/* Color roles */}
      <section className="mt-14">
        <h2 className="text-title text-ink">{labels.color}</h2>
        <p className="mt-1 text-meta text-muted">{labels.colorHint}</p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SWATCHES.map((s) => (
            <li
              key={s.token}
              className="flex items-stretch overflow-hidden border border-line bg-surface shadow-[var(--elev-1)]"
            >
              <span
                className="w-14 shrink-0 border-r border-line"
                style={{ background: `var(${s.varName})` }}
                aria-hidden
              />
              <span className="flex min-w-0 flex-col justify-center gap-0.5 p-3">
                <span className="text-label text-faint">{s.token}</span>
                <span className="text-meta text-ink">{labels.roles[s.role]}</span>
                <span className="font-mono text-[0.7rem] text-faint">
                  {s.varName}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="border border-line bg-surface p-4 shadow-[var(--elev-1)]">
            <p className="text-label text-faint">{labels.direction}</p>
            <p className="mt-3 text-data">
              <span className="delta-up">▲ +2,41%</span>
              <span className="mx-3 text-faint">·</span>
              <span className="delta-down">▼ −1,08%</span>
            </p>
            <p className="mt-2 text-meta text-muted">{labels.deltaSample}</p>
          </div>
          <div className="border border-line bg-surface p-4 shadow-[var(--elev-1)]">
            <p className="text-label text-faint">{labels.regime}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip chip-calm">calm</span>
              <span className="chip chip-unsettled">unsettled</span>
              <span className="chip chip-storm">storm</span>
              <span className="chip chip-weird">weird</span>
            </div>
          </div>
        </div>
      </section>

      {/* Elevation */}
      <section className="mt-14">
        <h2 className="text-title text-ink">{labels.elevation}</h2>
        <p className="mt-1 text-meta text-muted">{labels.elevationHint}</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ElevCard
            label={labels.elev.flat}
            className="border border-line bg-transparent"
          />
          <ElevCard
            label={labels.elev.raised}
            className="border border-line bg-surface shadow-[var(--elev-1)]"
          />
          <ElevCard
            label={labels.elev.float}
            className="border border-line bg-surface-2 shadow-[var(--elev-2)]"
          />
          <ElevCard label={labels.elev.hero} className="panel-hero" />
        </div>
      </section>

      {/* Motion */}
      <section className="mt-14">
        <h2 className="text-title text-ink">{labels.motion}</h2>
        <p className="mt-1 text-meta text-muted">{labels.motionHint}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="border border-line bg-surface px-3 py-2 text-label text-ink hover:border-accent"
            onClick={() => {
              setFlash("up");
              window.setTimeout(() => setFlash(null), 320);
            }}
          >
            ▲ flash
          </button>
          <button
            type="button"
            className="border border-line bg-surface px-3 py-2 text-label text-ink hover:border-accent"
            onClick={() => {
              setFlash("down");
              window.setTimeout(() => setFlash(null), 320);
            }}
          >
            ▼ flash
          </button>
          <span
            className={cn(
              "border border-line bg-bg-elevated px-4 py-2 font-mono text-data tabular-nums",
              flash === "up" && "tape-flash-up",
              flash === "down" && "tape-flash-down",
            )}
          >
            87 432,10
          </span>
          <span className="text-meta text-faint">{labels.flashHint}</span>
        </div>
        <p className="mt-4">
          <button
            type="button"
            className="border border-focus px-3 py-2 text-meta text-ink"
          >
            :focus-visible → {labels.roles.focus}
          </button>
        </p>
      </section>
    </div>
  );
}

function TypeRow({
  size,
  className,
  sample,
}: {
  size: string;
  className: string;
  sample: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-line/70 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:gap-6">
      <span className="w-16 shrink-0 text-label text-faint">{size}</span>
      <span className={className}>{sample}</span>
    </div>
  );
}

function ElevCard({ label, className }: { label: string; className: string }) {
  return (
    <div className={cn("flex min-h-[7rem] flex-col justify-end p-4", className)}>
      <p className="text-label text-faint">{label}</p>
    </div>
  );
}
