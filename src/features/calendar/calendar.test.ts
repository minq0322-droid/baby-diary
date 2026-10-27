import type { LegacyEntry as Entry } from '../../data/legacyAdapter';
import { describe, expect, it } from 'vitest';
import { emptyFilters, matchesFilters, monthDays, shiftMonth } from './calendar';

describe('calendar dates', () => {
  it('uses exactly four, five, or six complete Sunday-first weeks', () => {
    expect(monthDays('2026-02-01')).toHaveLength(28);
    expect(monthDays('2026-10-01')).toHaveLength(35);
    expect(monthDays('2026-05-01')).toHaveLength(42);
    expect(monthDays('2026-10-01')[0]).toBe('2026-09-27');
    expect(monthDays('2026-10-01')[34]).toBe('2026-10-31');
    expect(monthDays('2024-02-01')).toContain('2024-02-29');
  });

  it('changes months across year boundaries without overflowing late dates', () => {
    expect(shiftMonth('2026-12-31', 1)).toBe('2027-01-01');
    expect(shiftMonth('2026-01-31', -1)).toBe('2025-12-01');
  });
});

describe('shared dot and feed filters', () => {
  const entry: Entry = {
    id: 'entry', childId: 'kid2', date: '2026-10-24', content: 'DTaP 접종 기록',
    tagIds: ['vax', 'hosp'], authorId: 'mom', createdAt: '', updatedAt: '',
  };

  it('combines child, author, tags and case-insensitive content search', () => {
    expect(matchesFilters(entry, {
      childId: 'kid2', authorId: 'mom', tagIds: ['sleep', 'vax'], query: ' dtap ',
    })).toBe(true);
    expect(matchesFilters(entry, { ...emptyFilters, childId: 'kid1' })).toBe(false);
    expect(matchesFilters(entry, { ...emptyFilters, authorId: 'dad' })).toBe(false);
    expect(matchesFilters(entry, { ...emptyFilters, tagIds: ['sleep'] })).toBe(false);
    expect(matchesFilters(entry, { ...emptyFilters, query: '수유' })).toBe(false);
  });
});
