import { describe, expect, it } from 'vitest';
import { basePageId, isValidPageId, newSheetId, sheetsFor } from './pageId';
import { preparePage } from './stroke';
import type { Page } from '../data/types';

const page: Page = {
  id: '2026-11-02__kid1__dad',
  date: '2026-11-02',
  childId: 'kid1',
  authorId: 'dad',
  text: '첫 장',
  drawing: [],
  photos: [],
  tagIds: [],
  createdAt: '2026-11-02T00:00:00Z',
  updatedAt: '2026-11-02T00:00:00Z',
};

describe('page IDs and sheet order', () => {
  it('keeps first IDs and generates independent eight-character sheet suffixes', () => {
    expect(basePageId(page.date, page.childId, page.authorId)).toBe(page.id);
    const ids = new Set(
      Array.from({ length: 100 }, () =>
        newSheetId(page.date, page.childId, page.authorId),
      ),
    );
    expect(ids.size).toBe(100);
    for (const id of ids) {
      expect(id).toMatch(/^2026-11-02__kid1__dad__[a-z0-9]{8}$/);
      expect(isValidPageId({ ...page, id })).toBe(true);
      expect(preparePage({ ...page, id }).id).toBe(id);
    }
    expect(isValidPageId(page)).toBe(true);
  });

  it.each([
    '__abc1234',
    '__abc123456',
    '__ABC12345',
    '__abc_1234',
    '__abc-1234',
    '__abc12345__extra',
    '__abc12345\n',
    '__',
  ])('rejects malformed suffix %j', (suffix) => {
    const invalid = { ...page, id: page.id + suffix };
    expect(isValidPageId(invalid)).toBe(false);
    expect(() => preparePage(invalid)).toThrow();
  });

  it('rejects IDs mismatching any identity field', () => {
    expect(isValidPageId({ ...page, date: '2026-11-03' })).toBe(false);
    expect(isValidPageId({ ...page, childId: 'kid2' })).toBe(false);
    expect(isValidPageId({ ...page, authorId: 'mom' })).toBe(false);
    expect(isValidPageId({ ...page, childId: '' })).toBe(false);
  });

  it('filters the exact day, child and parent and sorts by creation then ID without mutation', () => {
    const second = {
      ...page,
      id: page.id + '__zzzzzzzz',
      createdAt: '2026-11-02T01:00:00Z',
    };
    const third = {
      ...second,
      id: page.id + '__aaaaaaaa',
      createdAt: '2026-11-02T02:00:00Z',
    };
    const tied = { ...third, id: page.id + '__bbbbbbbb' };
    const pages = [
      tied,
      third,
      second,
      { ...page, updatedAt: '2026-11-03T00:00:00Z' },
      { ...page, date: '2026-11-01' },
      { ...page, childId: 'kid2' },
      { ...page, authorId: 'mom' as const },
    ];
    const before = structuredClone(pages);
    expect(
      sheetsFor(pages, page.date, page.childId, page.authorId).map((p) => p.id),
    ).toEqual([page.id, second.id, third.id, tied.id]);
    expect(pages).toEqual(before);
  });
});
