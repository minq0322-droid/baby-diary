import { describe, expect, it } from 'vitest';
import { iconHref, readAppIcon } from './appIcon';

describe('app icon choice', () => {
  it('defaults to the book and ignores unknown values', () => {
    expect(readAppIcon({ getItem: () => null })).toBe('book');
    expect(readAppIcon({ getItem: () => 'rocket' })).toBe('book');
    expect(readAppIcon({ getItem: () => 'moon' })).toBe('moon');
  });

  it('falls back when storage throws', () => {
    expect(
      readAppIcon({
        getItem: () => {
          throw new Error('blocked');
        },
      }),
    ).toBe('book');
  });

  it('builds the icon paths under the app base', () => {
    expect(iconHref('/baby-diary/', 'heart', 180)).toBe('/baby-diary/icons/heart-180.png');
    expect(iconHref('/', 'moon')).toBe('/icons/moon.svg');
  });
});
