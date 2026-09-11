import {
  createLocalStore,
  type LocalEnvelope,
} from "@/lib/local/store";

/**
 * Decision journal — "porque li o mercado assim hoje" (VISION Phase 2).
 * Browser-local only; export/import already supported by the store.
 */
export type JournalEntry = {
  id: string;
  createdAt: string;
  note: string;
};

export type JournalData = {
  entries: JournalEntry[];
};

export const JOURNAL_KEY = "clareza-journal";
export const JOURNAL_VERSION = 1;
export const JOURNAL_MAX = 200;
const NOTE_MAX = 2000;

export function isJournalData(v: unknown): v is JournalData {
  if (!v || typeof v !== "object") return false;
  const entries = (v as JournalData).entries;
  if (!Array.isArray(entries)) return false;
  return entries.every(
    (e) =>
      e &&
      typeof e === "object" &&
      typeof e.id === "string" &&
      typeof e.createdAt === "string" &&
      typeof e.note === "string",
  );
}

export const journalStore = createLocalStore<JournalData>({
  key: JOURNAL_KEY,
  version: JOURNAL_VERSION,
  defaultValue: { entries: [] },
  validate: isJournalData,
});

export function listEntries(
  env?: LocalEnvelope<JournalData>,
): JournalEntry[] {
  return (env ?? journalStore.get()).data.entries;
}

export function addEntry(note: string): JournalEntry[] {
  const trimmed = note.trim().slice(0, NOTE_MAX);
  if (!trimmed) return listEntries();
  const next: JournalEntry[] = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      note: trimmed,
    },
    ...listEntries(),
  ].slice(0, JOURNAL_MAX);
  journalStore.set({ entries: next });
  return next;
}

export function removeEntry(id: string): JournalEntry[] {
  const next = listEntries().filter((e) => e.id !== id);
  journalStore.set({ entries: next });
  return next;
}
