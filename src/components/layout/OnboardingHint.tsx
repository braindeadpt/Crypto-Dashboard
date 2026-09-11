"use client";

import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";

const KEY = "clareza-onboarded";
const emptySub = () => () => {};

/**
 * First-visit orientation strip — what CLAREZA is (and is not).
 * Dismissed permanently via localStorage; not a modal, no tracking.
 */
export function OnboardingHint() {
  const t = useTranslations("onboarding");
  const [dismissed, setDismissed] = useState(false);
  const stored = useSyncExternalStore(
    emptySub,
    () => {
      try {
        return !!localStorage.getItem(KEY);
      } catch {
        return false;
      }
    },
    () => true, // server snapshot: hidden
  );

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // private mode — dismissed only for this session
    }
    setDismissed(true);
  };

  if (stored || dismissed) return null;

  return (
    <div className="border border-accent/40 bg-accent-dim px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{t("title")}</p>
          <p className="mt-1 text-sm text-muted">{t("body")}</p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 border border-line px-3 py-1.5 text-label text-faint transition hover:text-muted"
        >
          {t("cta")}
        </button>
      </div>
    </div>
  );
}
