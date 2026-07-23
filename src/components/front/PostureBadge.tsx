import { cn } from "@/lib/format";
import type { MarketPosture } from "@/lib/types";

const CHIP: Record<MarketPosture, string> = {
  calm: "chip-calm",
  unsettled: "chip-unsettled",
  storm: "chip-storm",
  weird: "chip-weird",
};

export function PostureBadge({
  posture,
  label,
  className,
}: {
  posture: MarketPosture;
  label: string;
  className?: string;
}) {
  return (
    <span className={cn("chip", CHIP[posture], className)}>
      <span className="live-dot" style={{ background: "currentColor", boxShadow: "none" }} />
      {label}
    </span>
  );
}
