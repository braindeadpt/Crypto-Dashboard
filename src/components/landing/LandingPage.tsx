"use client";

import { AccessCta } from "@/components/landing/AccessCta";
import { CaseStudy } from "@/components/landing/CaseStudy";
import { CrosshairCursor } from "@/components/landing/CrosshairCursor";
import { HeroCommand } from "@/components/landing/HeroCommand";
import { Integrations } from "@/components/landing/Integrations";
import { LiveStatsBar } from "@/components/landing/LiveStatsBar";
import { Security } from "@/components/landing/Security";
import { Workflows } from "@/components/landing/Workflows";
import type {
  MarketSnapshot,
  RegimeResult,
  SentimentSnapshot,
} from "@/lib/types";

type Props = {
  market: MarketSnapshot;
  sentiment: SentimentSnapshot;
  regime: RegimeResult;
};

export function LandingPage({ market, sentiment, regime }: Props) {
  return (
    <div className="relative">
      <CrosshairCursor />
      <LiveStatsBar market={market} sentiment={sentiment} regime={regime} />
      <HeroCommand market={market} sentiment={sentiment} regime={regime} />
      <Integrations />
      <Workflows />
      <Security />
      <CaseStudy />
      <AccessCta />
    </div>
  );
}
