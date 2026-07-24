"use client";

import { useRouter } from "@/i18n/navigation";
import { useEffect } from "react";

type Options = {
  /** Soft RSC refresh interval (funding, OI, F&G, etc.) */
  intervalMs?: number;
};

/**
 * Periodically revalidates the current RSC tree via router.refresh().
 * Pauses while the tab is hidden. Timer cleared on unmount.
 */
export function useBoardRefresh({ intervalMs = 60_000 }: Options = {}) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      router.refresh();
    }, intervalMs);

    return () => clearInterval(id);
  }, [intervalMs, router]);
}
