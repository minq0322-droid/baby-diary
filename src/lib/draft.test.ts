import { describe, expect, it } from 'vitest';
import type { Page } from '../data/types';
import { clearDraft, decideDraft, listDrafts, newestSheetDraft, pruneDrafts, readDraft, writeDraft } from './draft';

class MemoryStorage {
  data = new Map<string, string>();
  failWrites = 0;
  get length() { return this.data.size; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) {
    if (this.failWrites > 0) { this.failWrites--; throw new Error('QuotaExceededError'); }
    this.data.set(key, value);
  }
  removeItem(key: string) { this.data.delete(key); }
}

const page = (over: Partial<Page> = {}): Page => ({
  id: '2026-11-14__kid1__dad', childId: 'kid1', date: '2026-11-14', authorId: 'dad',
  drawing: [{ color: 'ink', width: 5, points: [0.1, 0.1, 0.2, 0.2] }], photos: [], text: '공원', tagIds: [],
  createdAt: '2026-11-14T01:00:00.000Z', updatedAt: '2026-11-14T01:00:00.000Z', ...over,
});

describe('draft store', () => {
  it('keeps and reads back a draft', () => {
    const store = new MemoryStorage();
    expect(writeDraft(page(), null, store)).toBe(true);
    expect(readDraft(page().id, store)?.page.text).toBe('공원');
    clearDraft(page().id, store);
    expect(readDraft(page().id, store)).toBeNull();
  });
  it('drops drafts older than 30 days', () => {
    const store = new MemoryStorage();
    writeDraft(page(), null, store, new Date('2026-09-01T00:00:00Z'));
    writeDraft(page({ id: 'fresh' }), null, store, new Date('2026-11-13T00:00:00Z'));
    pruneDrafts(Date.parse('2026-11-14T00:00:00Z'), store);
    expect(listDrafts(store).map((draft) => draft.page.id)).toEqual(['fresh']);
  });
  it('retries once after pruning when the device is full, and reports a final failure', () => {
    const store = new MemoryStorage();
    store.failWrites = 1;
    expect(writeDraft(page(), null, store)).toBe(true);
    store.failWrites = 2;
    expect(writeDraft(page({ id: 'x' }), null, store)).toBe(false);
  });
  it('never throws when storage is missing or the value is broken', () => {
    expect(writeDraft(page(), null, undefined)).toBe(false);
    const store = new MemoryStorage();
    store.data.set('yuga-draft:v1:broken', '{not json');
    expect(readDraft('broken', store)).toBeNull();
    expect(listDrafts(store)).toEqual([]);
  });
  it('finds an unsaved extra sheet for the same child, day and writer', () => {
    const store = new MemoryStorage();
    writeDraft(page({ id: '2026-11-14__kid1__dad__abcd1234' }), null, store);
    expect(newestSheetDraft('2026-11-14', 'kid1', 'dad', new Set(), store)?.page.id).toBe('2026-11-14__kid1__dad__abcd1234');
    expect(newestSheetDraft('2026-11-14', 'kid1', 'mom', new Set(), store)).toBeUndefined();
  });
});

describe('decideDraft', () => {
  const stored = page({ text: '저장된 글' });
  it('restores a draft for a page never stored', () => {
    expect(decideDraft(undefined, { v: 1, page: page(), baseUpdatedAt: null, savedAt: 'x' })).toBe('restore');
  });
  it('restores a draft that continues the stored page', () => {
    expect(decideDraft(stored, { v: 1, page: page({ text: '더 쓴 글' }), baseUpdatedAt: stored.updatedAt, savedAt: 'x' })).toBe('restore');
  });
  it('flags a conflict when the page was saved elsewhere after the draft began', () => {
    expect(decideDraft(page({ updatedAt: '2026-11-14T05:00:00.000Z' }), { v: 1, page: page({ text: '임시' }), baseUpdatedAt: '2026-11-14T01:00:00.000Z', savedAt: 'x' })).toBe('conflict');
  });
  it('ignores a draft equal to the stored page', () => {
    expect(decideDraft(stored, { v: 1, page: { ...stored, updatedAt: 'later' }, baseUpdatedAt: null, savedAt: 'x' })).toBe('none');
    expect(decideDraft(stored, null)).toBe('none');
  });
});
