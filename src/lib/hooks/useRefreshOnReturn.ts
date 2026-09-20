"use client";

import { useRouter } from "@/i18n/navigation";
import { useEffect, useRef } from "react";

const HIDDEN_THRESHOLD_MS = 10 * 60_000;

/**
 * Revalida o RSC tree uma vez ao voltar de uma tab oculta > 10 min
 * (DESENHO-V5 §5.11 — substitui o refresh periódico de 60s; a vida contínua
 * vem dos WebSockets, os snapshots mudam 4×/dia via ingest).
 */
export function useRefreshOnReturn() {
  const router = useRouter();
  const hiddenSince = useRef<number | null>(null);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenSince.current = Date.now();
        return;
      }
      const since = hiddenSince.current;
      hiddenSince.current = null;
      if (since != null && Date.now() - since > HIDDEN_THRESHOLD_MS) {
        router.refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () =>
      document.removeEventListener("visibilitychange", onVisibility);
  }, [router]);
}
