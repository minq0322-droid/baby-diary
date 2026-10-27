import { describe, expect, it } from 'vitest';
import { dayFillSegments } from './dayFill';
import { displayColor, inkFor } from '../../lib/pageColors';

const children = [
  { id: 'kid1', pageColor: '#F4B9B8' },
  { id: 'kid2', pageColor: '#CDEFE2' },
];
const date = '2026-10-27';

describe('recorded day fill segments', () => {
  it('leaves empty dates unfilled and ignores other dates and unknown children', () => {
    expect(dayFillSegments(date, [
      { date: '2026-10-26', childId: 'kid1' },
      { date, childId: 'unknown' },
    ], children, false)).toEqual([]);
  });

  it('uses one child color even when both parents recorded pages', () => {
    expect(dayFillSegments(date, [
      { date, childId: 'kid1' },
      { date, childId: 'kid1' },
    ], children, false)).toEqual([
      { childId: 'kid1', color: '#F4B9B8', ink: '#1E2326' },
    ]);
  });

  it('keeps both children in legend order and applies dark display and ink rules', () => {
    const result = dayFillSegments(date, [
      { date, childId: 'kid2' },
      { date, childId: 'kid1' },
    ], children, true);
    expect(result).toEqual(children.map((child) => {
      const color = displayColor(child.pageColor, true);
      return { childId: child.id, color, ink: inkFor(color) };
    }));
    expect(result[0].color).not.toBe(children[0].pageColor);
  });
});
