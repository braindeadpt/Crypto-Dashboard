"use client";

import { useExpertise } from "@/components/expertise/ExpertiseProvider";
import type { DensitySection } from "@/lib/expertise";
import type { ReactNode } from "react";

/** Renders children only when the current expertise density allows `section`. */
export function ExpertiseGate({
  section,
  children,
  fallback = null,
}: {
  section: DensitySection;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { show } = useExpertise();
  if (!show(section)) return <>{fallback}</>;
  return <>{children}</>;
}
