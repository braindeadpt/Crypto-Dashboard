"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/format";
import { THEME_STORAGE_KEY } from "@/lib/theme";

export type ThemeMode = "light" | "dark";

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) cb();
  };
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onMq = () => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored !== "light" && stored !== "dark") cb();
  };
  window.addEventListener("storage", onStorage);
  mq.addEventListener("change", onMq);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
    mq.removeEventListener("change", onMq);
  };
}

function readTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
}

function setMode(next: ThemeMode) {
  window.localStorage.setItem(THEME_STORAGE_KEY, next);
  applyTheme(next);
  emit();
}

export function ThemeToggle() {
  const t = useTranslations("theme");
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light");

  return (
    <div
      className="inline-flex border border-line bg-surface p-0.5"
      role="group"
      aria-label={t("label")}
    >
      {(["light", "dark"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => setMode(mode)}
          className={cn(
            "px-1.5 py-1 text-label transition sm:px-2.5",
            theme === mode
              ? "bg-surface-2 text-ink"
              : "text-faint hover:text-ink",
          )}
          aria-pressed={theme === mode}
          aria-label={t(mode)}
        >
          <span className="sm:hidden" aria-hidden>
            {mode === "light" ? "L" : "D"}
          </span>
          <span className="hidden sm:inline">{t(mode)}</span>
        </button>
      ))}
    </div>
  );
}
