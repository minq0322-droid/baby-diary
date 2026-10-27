import type { CSSProperties } from 'react';

export const namedPageColors = [
  ['벚꽃', '#F4B9B8'],
  ['박하', '#CDEFE2'],
  ['귤', '#F59157'],
  ['살구', '#FFCBA4'],
  ['레몬', '#FFE98F'],
  ['연두', '#D4E9A8'],
  ['하늘', '#B9DDF3'],
  ['라일락', '#D9CCF2'],
  ['코랄', '#F6A79A'],
  ['세이지', '#C5D8C1'],
  ['바다', '#9FD3D6'],
  ['라벤더', '#C7B8EE'],
  ['모래', '#EAD9BF'],
  ['머스터드', '#F2C55C'],
  ['복숭아', '#FBD3C4'],
  ['종이', '#F4EBDD'],
] as const;

// HSL seeds: hues 345, 9, 24, 33, 49, 78, 146, 181, 207, 267;
// saturation 60% (yellow 80%), lightness 92/88/83/78%.
// Nearest available swatches replaced by the 16 legacy colors, then frozen.
export const pastelColors = [
  '#F7DEE4',
  '#F3CED7',
  '#F4B9B8',
  '#E9A5B6',

  '#F7E2DE',
  '#FBD3C4',
  '#EEC1BA',
  '#F6A79A',

  '#F7E8DE',
  '#F3DDCE',
  '#EECEBA',
  '#F59157',

  '#F4EBDD',
  '#F3E2CE',
  '#FFCBA4',
  '#EAD9BF',

  '#FBF5DA',
  '#F9F0C8',
  '#FFE98F',
  '#F2C55C',

  '#EFF7DE',
  '#E8F3CE',
  '#DEEEBA',
  '#D4E9A8',

  '#DEF7E9',
  '#CDEFE2',
  '#A5E9C2',
  '#C5D8C1',

  '#DEF6F7',
  '#CEF2F3',
  '#BAEDEE',
  '#9FD3D6',

  '#DEECF7',
  '#CEE2F3',
  '#B9DDF3',
  '#A5CBE9',

  '#E9DEF7',
  '#D9CCF2',
  '#C7B8EE',
  '#C4A5E9',
] as const;

export const pageColors: ReadonlyArray<readonly [string, string]> = pastelColors.map(
  (color) => [namedPageColors.find((entry) => entry[1] === color)?.[0] ?? color, color],
);

export const penColors = [
  ['자동 잉크', 'ink'], ['연필', '#3B3B3B'], ['빨강', '#D9534F'],
  ['주황', '#E07B39'], ['노랑', '#D4A017'], ['초록', '#4E9A57'],
  ['파랑', '#3F7CC9'], ['보라', '#7E5BC2'], ['갈색', '#8A5A3B'],
] as const;

const channels = (hex: string) =>
  [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));

/** Nearest squared sRGB distance; picker order breaks ties. */
export function normalizePageColor(color: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return namedPageColors[0][1];
  const rgb = channels(color);
  const distance = (hex: string) =>
    channels(hex).reduce((sum, value, index) => sum + (value - rgb[index]) ** 2, 0);
  return pageColors.reduce((best, candidate) =>
    distance(candidate[1]) < distance(best[1]) ? candidate : best,
  )[1];
}

export function displayColor(color: string, dark: boolean): string {
  if (!/^#[0-9a-f]{6}$/i.test(color)) color = namedPageColors[0][1];
  if (!dark) return color;
  const base = channels('#262638');
  return '#' + channels(color)
    .map((value, index) => Math.round(value * 0.9 + base[index] * 0.1)
      .toString(16).padStart(2, '0'))
    .join('').toUpperCase();
}

export function contrastRatio(first: string, second: string): number {
  const luminance = (hex: string) => {
    const [r, g, b] = channels(hex).map((value) => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Pass the displayed (already dark-mode-adjusted) background. */
export function inkFor(color: string): string {
  return contrastRatio(color, '#1E2326') >= contrastRatio(color, '#F5F0E1')
    ? '#1E2326' : '#F5F0E1';
}

export function pageColorStyle(color: string, dark = false): CSSProperties {
  const displayed = displayColor(color, dark);
  return {
    '--page-color': displayed,
    '--page-ink': inkFor(displayed),
  } as CSSProperties;
}
