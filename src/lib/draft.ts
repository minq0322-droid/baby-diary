import type { Page } from '../data/types';

// 2026-11-14 (작가: "그림을 그리다가 저장이 안 되어서 날아가 버린 게 너무 많아"):
// 저장 전의 그림·글을 이 기기에 임시로 남긴다. iOS 가 내린 앱을 끄거나, 새로고침·배터리 꺼짐에도
// 다시 열면 되살린다. 저장소가 막혀도(사생활 모드·용량) 앱은 멈추지 않고 실패만 알린다.

export type Draft = {
  v: 1;
  page: Page;
  /** The stored page's updatedAt this draft started from; null for a page never stored. */
  baseUpdatedAt: string | null;
  savedAt: string;
};

const PREFIX = 'yuga-draft:v1:';
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const PHOTO_BUDGET = 1_500_000;

type Storage = Pick<globalThis.Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function parse(raw: string | null): Draft | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Draft;
    if (value?.v !== 1 || !value.page?.id || !Array.isArray(value.page.drawing)) return null;
    return value;
  } catch {
    return null;
  }
}

/** Data-URL photos can be huge; drop them from the draft only when the draft would be too big. */
function fit(page: Page): Page {
  const size = JSON.stringify(page).length;
  if (size <= PHOTO_BUDGET) return page;
  return { ...page, photos: page.photos.filter((photo) => !photo.src.startsWith('data:')) };
}

export function readDraft(pageId: string, store = storage()): Draft | null {
  try {
    return parse(store?.getItem(PREFIX + pageId) ?? null);
  } catch {
    return null;
  }
}

export function listDrafts(store = storage()): Draft[] {
  const drafts: Draft[] = [];
  try {
    if (!store) return drafts;
    for (let index = 0; index < store.length; index++) {
      const key = store.key(index);
      if (!key?.startsWith(PREFIX)) continue;
      const draft = parse(store.getItem(key));
      if (draft) drafts.push(draft);
    }
  } catch {
    // Storage blocked: nothing to list.
  }
  return drafts;
}

export function clearDraft(pageId: string, store = storage()) {
  try {
    store?.removeItem(PREFIX + pageId);
  } catch {
    // Nothing to clear when storage is blocked.
  }
}

export function pruneDrafts(now = Date.now(), store = storage(), keep = 0) {
  const drafts = listDrafts(store).sort((a, b) => a.savedAt.localeCompare(b.savedAt));
  const old = drafts.filter((draft) => now - Date.parse(draft.savedAt) > MAX_AGE_MS);
  const extra = keep > 0 ? drafts.slice(0, Math.max(0, drafts.length - keep)) : [];
  for (const draft of new Set([...old, ...extra])) clearDraft(draft.page.id, store);
}

/** Returns false when the device would not keep it (the UI then says so). Never throws. */
export function writeDraft(page: Page, baseUpdatedAt: string | null, store = storage(), now = new Date()): boolean {
  if (!store) return false;
  const draft: Draft = { v: 1, page: fit(page), baseUpdatedAt, savedAt: now.toISOString() };
  const value = JSON.stringify(draft);
  try {
    store.setItem(PREFIX + page.id, value);
    return true;
  } catch {
    // Probably full: drop expired drafts and all but the five newest, then try once more.
    pruneDrafts(now.getTime(), store, 5);
    try {
      store.setItem(PREFIX + page.id, value);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * restore  — the draft continues the stored page (or the page was never stored): load it.
 * conflict — the page was saved elsewhere after the draft began: keep the stored one, offer the draft.
 * none     — no draft, or the draft holds nothing beyond the stored page.
 */
export function decideDraft(stored: Page | undefined, draft: Draft | null): 'restore' | 'conflict' | 'none' {
  if (!draft) return 'none';
  if (stored && JSON.stringify({ ...stored, updatedAt: '' }) === JSON.stringify({ ...draft.page, updatedAt: '' })) return 'none';
  if (!stored) return 'restore';
  return (draft.baseUpdatedAt ?? null) === stored.updatedAt ? 'restore' : 'conflict';
}

/** The newest unsaved new-sheet draft for this child, day and writer (so an extra sheet is found again). */
export function newestSheetDraft(date: string, childId: string, authorId: string, storedIds: Set<string>, store = storage()) {
  return listDrafts(store)
    .filter((draft) => draft.page.date === date && draft.page.childId === childId && draft.page.authorId === authorId && !storedIds.has(draft.page.id))
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0];
}

// Open pages register a flush so a reload (app update) or a hidden tab writes the very latest state first.
const flushers = new Set<() => void>();
export function registerDraftFlush(flush: () => void) {
  flushers.add(flush);
  return () => flushers.delete(flush);
}
export function flushDrafts() {
  for (const flush of flushers) flush();
}
