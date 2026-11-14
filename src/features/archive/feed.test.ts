import { describe, expect, it } from 'vitest';
import type { Page } from '../../data/types';
import { clockLabel, feedOrder, groupByDay, yearAgoKey, yearAgoPage } from './feed';

const page = (id: string, date: string, createdAt: string): Page => ({
  id,
  childId: 'kid1',
  date,
  authorId: 'mom',
  drawing: [],
  photos: [],
  text: '',
  tagIds: [],
  createdAt,
  updatedAt: createdAt,
});

describe('feed', () => {
  it('puts the newest day first and the later sheet of a day first', () => {
    const pages = feedOrder([
      page('a', '2026-11-13', '2026-11-13T09:00:00'),
      page('b', '2026-11-14', '2026-11-14T08:00:00'),
      page('c', '2026-11-14', '2026-11-14T21:00:00'),
    ]);
    expect(pages.map((item) => item.id)).toEqual(['c', 'b', 'a']);
    expect(groupByDay(pages).map((day) => [day.date, day.pages.length])).toEqual([
      ['2026-11-14', 2],
      ['2026-11-13', 1],
    ]);
  });

  it('finds the page written exactly one year ago', () => {
    const pages = [
      page('old', '2025-11-15', '2025-11-15T20:00:00'),
      page('older', '2025-11-15', '2025-11-15T07:00:00'),
      page('near', '2025-11-14', '2025-11-14T07:00:00'),
    ];
    expect(yearAgoPage(pages, '2026-11-15')?.id).toBe('older');
    expect(yearAgoPage(pages, '2026-11-16')).toBeUndefined();
    expect(yearAgoKey('2028-02-29')).toBeUndefined();
  });

  it('labels the time in Korean 12-hour form', () => {
    expect(clockLabel('2026-11-14T20:05:00')).toBe('오후 8:05');
    expect(clockLabel('2026-11-14T00:30:00')).toBe('오전 12:30');
    expect(clockLabel('nope')).toBe('');
  });
});
