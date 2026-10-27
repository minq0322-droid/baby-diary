import { afterEach, describe, expect, it, vi } from 'vitest';
import { readArchiveList, writeArchiveList } from './archiveView';

afterEach(() => vi.unstubAllGlobals());

describe('shared archive/calendar view preference', () => {
  it('defaults to list and shares the existing per-member key', () => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    });
    expect(readArchiveList('mom')).toBe(true);
    writeArchiveList('mom', false);
    expect(values.get('archive-view:mom')).toBe('cards');
    expect(readArchiveList('mom')).toBe(false);
    expect(readArchiveList('dad')).toBe(true);
    writeArchiveList('mom', true);
    expect(readArchiveList('mom')).toBe(true);
    values.set('archive-view:dad', 'cards');
    expect(readArchiveList('dad')).toBe(false);
    values.set('archive-view:dad', 'invalid');
    expect(readArchiveList('dad')).toBe(true);
  });

  it('keeps switching possible when writes fail but reads still work', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => null,
      setItem: () => { throw new Error('Quota exceeded'); },
    });
    expect(readArchiveList('quota')).toBe(true);
    writeArchiveList('quota', false);
    expect(readArchiveList('quota')).toBe(false);
    writeArchiveList('quota', true);
    expect(readArchiveList('quota')).toBe(true);
  });

  it('handles blocked storage access', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('Blocked'); },
      setItem: () => { throw new Error('Blocked'); },
    });
    expect(readArchiveList('blocked')).toBe(true);
    expect(() => writeArchiveList('blocked', false)).not.toThrow();
    expect(readArchiveList('blocked')).toBe(false);
  });
});
