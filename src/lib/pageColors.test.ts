import { describe, expect, it } from 'vitest';
import { displayColor, inkFor, namedPageColors, normalizePageColor, pageColors, pageColorStyle } from './pageColors';

function luminance(hex: string): number {
  const channels = hex
    .replace('#', '')
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);

  if (!channels || channels.length !== 3) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(first: string, second: string): number {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe('page palette and auto ink', () => {
  it('has 40 unique colors including all 16 exact legacy colors', () => {
    expect(pageColors).toHaveLength(40);
    expect(new Set(pageColors.map((entry) => entry[1])).size).toBe(40);
    for (const [, color] of namedPageColors) {
      expect(pageColors.some((entry) => entry[1] === color)).toBe(true);
    }
  });

  it('chooses at least 4.5:1 contrast or the best available ink, including old colors', () => {
    for (const color of [...pageColors.map((entry) => entry[1]), '#000000', '#FFFFFF', '#777777', '#0F4D3A']) {
      for (const dark of [false, true]) {
        const displayed = displayColor(color, dark);
        const ink = inkFor(displayed);
        const best = Math.max(contrastRatio(displayed, '#1E2326'), contrastRatio(displayed, '#F5F0E1'));
        expect(contrastRatio(displayed, ink)).toBe(best);
        if (best >= 4.5) expect(contrastRatio(displayed, ink)).toBeGreaterThanOrEqual(4.5);
        expect(pageColorStyle(color, dark)).toEqual({ '--page-color': displayed, '--page-ink': ink });
      }
    }
    expect(inkFor('#000000')).toBe('#F5F0E1');
    expect(inkFor('#FFFFFF')).toBe('#1E2326');
  });

  it('mixes 90% page color and 10% navy only in dark mode', () => {
    expect(displayColor('#F4B9B8', false)).toBe('#F4B9B8');
    expect(displayColor('#F4B9B8', true)).toBe('#DFAAAB');
    expect(displayColor('#000000', true)).toBe('#040406');
    expect(displayColor('#FFFFFF', true)).toBe('#E9E9EB');
  });
});

it('maps retired colors to their nearest palette entry without changing current colors', () => {
  const retired = ['#0F4D3A', '#2E3550', '#EE6A5A', '#FFD23F', '#8FDCC2', '#7CC7F5', '#CFE6A0', '#B8A4F2'];
  const rgb = (hex: string) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
  for (const color of retired) {
    const mapped = normalizePageColor(color);
    const distance = (hex: string) => rgb(hex).reduce((sum, value, index) => sum + (value - rgb(color)[index]) ** 2, 0);
    expect(distance(mapped)).toBe(Math.min(...pageColors.map(([, candidate]) => distance(candidate))));
    expect(normalizePageColor(color.toLowerCase())).toBe(mapped);
  }
  for (const [, color] of pageColors) expect(normalizePageColor(color)).toBe(color);
});
