"use client";

import { useTranslations } from "next-intl";

/** First focusable control — jump past sticky chrome to main. */
export function SkipLink() {
  const t = useTranslations("chrome");
  return (
    <a href="#main" className="skip-link">
      {t("skipToContent")}
    </a>
  );
}
