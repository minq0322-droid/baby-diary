import { describe, expect, it } from 'vitest';
import { normalizeHomePreferences } from './preferences';
describe('home preferences', () => {
  it('keeps the saved night style and defaults old preferences to sunset', () => {
    expect(normalizeHomePreferences({
      night: 'lantern'
    })).toEqual({
      day: 'sunset',
      night: 'lantern'
    });
  });
  it('restores both selected styles', () => {
    expect(normalizeHomePreferences({
      day: 'dandelion',
      night: 'moon'
    })).toEqual({
      day: 'dandelion',
      night: 'moon'
    });
  });
  it('uses defaults for malformed preferences', () => {
    for (const value of [null, 42, 'bad', {
      day: 'garden',
      night: 'bad'
    }]) {
      expect(normalizeHomePreferences(value)).toEqual({
        day: 'sunset',
        night: 'moon'
      });
    }
  });
});
