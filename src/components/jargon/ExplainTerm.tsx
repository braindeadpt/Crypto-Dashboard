"use client";

import { ExplainThisNumber } from "@/components/explain/ExplainThisNumber";
import type { JargonTermId } from "@/lib/jargon";
import type { ReactNode } from "react";

type Props = {
  term: JargonTermId;
  value: ReactNode;
  updatedAt?: string;
  className?: string;
};

/** Thin alias — ExplainThisNumber + jargon dictionary. */
export function ExplainTerm(props: Props) {
  return <ExplainThisNumber {...props} />;
}
