"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/format";
import { useTranslations } from "next-intl";

export function LanguageToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("chrome");

  return (
    <div
      className="inline-flex border border-line bg-surface p-0.5"
      role="group"
      aria-label={t("language")}
    >
      {(["pt", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => router.replace(pathname, { locale: l })}
          className={cn(
            "px-1.5 py-1 text-label uppercase transition sm:px-2.5",
            locale === l ? "bg-surface-2 text-ink" : "text-faint hover:text-ink",
          )}
          aria-label={l === "pt" ? "Português" : "English"}
          aria-pressed={locale === l}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
