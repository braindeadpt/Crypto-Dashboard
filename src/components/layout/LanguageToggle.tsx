"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/format";

export function LanguageToggle() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      className="inline-flex border border-line bg-surface p-0.5"
      role="group"
      aria-label="Idioma"
    >
      {(["pt", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => router.replace(pathname, { locale: l })}
          className={cn(
            "px-2.5 py-1 font-mono text-[0.65rem] font-medium uppercase tracking-wider transition",
            locale === l ? "bg-surface-2 text-ink" : "text-faint hover:text-ink",
          )}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
