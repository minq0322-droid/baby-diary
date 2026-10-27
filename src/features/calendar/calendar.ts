import type { LegacyEntry as Entry } from '../../data/legacyAdapter';
import { addDays, fromKey, toKey } from '../../lib/date';

export type Filters = {
  childId: string;
  tagIds: string[];
  authorId: string;
  query: string;
};

export const emptyFilters: Filters = {
  childId: '',
  tagIds: [],
  authorId: '',
  query: '',
};

export function matchesFilters(entry: Entry, filters: Filters): boolean {
  return (
    (!filters.childId || entry.childId === filters.childId) &&
    (!filters.authorId || entry.authorId === filters.authorId) &&
    (!filters.tagIds.length || filters.tagIds.some((id) => entry.tagIds.includes(id))) &&
    entry.content.toLocaleLowerCase().includes(filters.query.trim().toLocaleLowerCase())
  );
}

export function monthDays(month: string): string[] {
  const first = fromKey(`${month.slice(0, 7)}-01`);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const count = Math.ceil((first.getDay() + last.getDate()) / 7) * 7;
  const start = addDays(toKey(first), -first.getDay());
  return Array.from({ length: count }, (_, index) => addDays(start, index));
}

export function shiftMonth(month: string, delta: number): string {
  const date = fromKey(`${month.slice(0, 7)}-01`);
  date.setMonth(date.getMonth() + delta);
  return toKey(date);
}
