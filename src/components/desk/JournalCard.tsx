"use client";

import {
  addEntry,
  journalStore,
  listEntries,
  removeEntry,
} from "@/lib/local/journal";
import { downloadBlob } from "@/lib/local/store";
import { useLocale, useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";

/**
 * Decision journal — daily note on the /brief ritual. Browser-local only;
 * exportable JSON for when the tax/portfolio module needs the record.
 */
export function JournalCard() {
  const t = useTranslations("journal");
  const locale = useLocale();
  const [draft, setDraft] = useState("");
  const env = useSyncExternalStore(
    journalStore.subscribe,
    journalStore.get,
    journalStore.getServerSnapshot,
  );
  const entries = listEntries(env);

  function save() {
    if (!draft.trim()) return;
    addEntry(draft);
    setDraft("");
  }

  return (
    <section className="mt-8 border border-line bg-surface p-5">
      <h2 className="text-label text-faint">{t("title")}</h2>
      <p className="mt-1 text-meta text-muted">{t("hint")}</p>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        placeholder={t("placeholder")}
        className="mt-3 w-full resize-y border border-line bg-bg px-3 py-2 text-body text-ink placeholder:text-faint"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={!draft.trim()}
          className="border border-line bg-accent-dim px-4 py-2 text-label text-accent disabled:opacity-40"
        >
          {t("save")}
        </button>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={() =>
              downloadBlob(
                journalStore.toExportBlob(),
                `clareza-diario-${new Date().toISOString().slice(0, 10)}.json`,
              )
            }
            className="border border-line px-3 py-2 text-label text-faint hover:text-muted"
          >
            {t("export")}
          </button>
        )}
      </div>

      {entries.length > 0 && (
        <ul className="mt-5 space-y-3 border-t border-line pt-4">
          {entries.slice(0, 10).map((e) => (
            <li key={e.id} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-xs text-faint">
                  {new Date(e.createdAt).toLocaleString(locale, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                <button
                  type="button"
                  aria-label={t("remove")}
                  onClick={() => removeEntry(e.id)}
                  className="text-faint hover:text-down"
                >
                  ×
                </button>
              </div>
              <p className="mt-0.5 whitespace-pre-wrap text-body text-ink">
                {e.note}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
