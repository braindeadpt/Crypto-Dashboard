"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

/** Keeps <html lang> in sync with next-intl locale. */
export function HtmlLang() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale === "pt" ? "pt-PT" : "en";
  }, [locale]);
  return null;
}
