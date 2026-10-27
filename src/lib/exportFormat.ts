import { migrateSnapshot, type LegacySnapshot } from '../data/migrate';
import type { StoreSnapshot } from '../data/types';

export type BackupJson = StoreSnapshot & { version: 3; exportedAt: string };

export function toBackupJson(all: StoreSnapshot): BackupJson {
  return {
    ...structuredClone(all),
    version: 3,
    exportedAt: new Date().toISOString(),
  };
}

export function fromBackupJson(value: unknown): StoreSnapshot {
  const invalid = () => new Error('백업 형식이 올바르지 않습니다.');
  if (!value || typeof value !== 'object') throw invalid();
  const data = value as Record<string, unknown>;
  if (![1, 2, 3].includes(Number(data.version))) throw invalid();
  const collection = data.version === 1 ? 'entries' : 'pages';
  for (const key of ['children', 'members', 'tags', collection]) {
    if (
      !Array.isArray(data[key]) ||
      data[key].some(
        (item: unknown) =>
          !item ||
          typeof item !== 'object' ||
          typeof (item as { id?: unknown }).id !== 'string',
      )
    )
      throw invalid();
  }
  const normalized = {
    ...data,
    comments: data.comments ?? [],
    reactions: data.reactions ?? [],
  };
  if (
    !Array.isArray(normalized.comments) ||
    !Array.isArray(normalized.reactions)
  )
    throw invalid();
  if (data.version === 1) {
    const legacy = normalized as unknown as LegacySnapshot;
    if (
      legacy.entries.some(
        (entry) =>
          typeof entry.date !== 'string' ||
          typeof entry.childId !== 'string' ||
          typeof entry.authorId !== 'string' ||
          typeof entry.content !== 'string' ||
          !Array.isArray(entry.tagIds) ||
          typeof entry.createdAt !== 'string' ||
          typeof entry.updatedAt !== 'string',
      )
    )
      throw invalid();
    return migrateSnapshot(legacy);
  }
  const snapshot = normalized as unknown as StoreSnapshot;
  if (
    snapshot.pages.some(
      (page) =>
        !/^\d{4}-\d{2}-\d{2}$/.test(page.date) ||
        !Array.isArray(page.drawing) ||
        !Array.isArray(page.photos) ||
        !Array.isArray(page.tagIds),
    )
  )
    throw invalid();
  if (
    data.version === 3 &&
    snapshot.pages.some(
      (page) =>
        !['dad', 'mom'].includes(page.authorId) ||
        page.id !== page.date + '__' + page.childId + '__' + page.authorId ||
        typeof page.text !== 'string',
    )
  )
    throw invalid();
  if (data.version === 2) {
    const old =
      snapshot.pages as unknown as import('../data/migrate').OldPage[];
    if (
      old.some(
        (page) =>
          page.id !== page.date + '__' + page.childId ||
          !Array.isArray(page.notes) ||
          page.notes.some(
            (note) =>
              !['dad', 'mom'].includes(note.authorId) ||
              typeof note.text !== 'string',
          ),
      )
    )
      throw invalid();
  }
  return migrateSnapshot(snapshot);
}

export { toMarkdown, toDatedArchive } from './datedArchive.mjs';
export type { ArchiveFile } from './datedArchive.mjs';
