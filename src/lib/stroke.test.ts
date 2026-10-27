import { describe, expect, it, vi } from 'vitest';
import { isStrokeWidth, preparePage, simplifyStroke } from './stroke';
import { page } from '../data/testDb';
import { migrateSnapshot } from '../data/migrate';
import { seedChildren, seedMembers } from '../data/seed';
import type { Stroke } from '../data/types';

it('accepts old pen/eraser widths and all new eraser widths through save and migration', () => {
  const drawing: Stroke[] = [2, 5, 8, 14, 28].map(width => ({
    color: width === 2 || width === 5 ? 'ink' : 'erase',
    width: width as Stroke['width'], points: [0, 0, 1, 1],
  }));
  const saved = preparePage({ ...page(), drawing });
  expect(saved.drawing).toEqual(drawing);
  const migrated = migrateSnapshot({ children: seedChildren, members: seedMembers, pages: [saved], tags: [], comments: [], reactions: [] });
  expect(migrated.pages[0].drawing).toEqual(drawing);
  expect([2, 5, 8, 14, 28].every(isStrokeWidth)).toBe(true);
  expect(isStrokeWidth(10)).toBe(false);
  expect(isStrokeWidth('14')).toBe(false);
  expect(() => preparePage({ ...page(), drawing: [{ ...drawing[0], width: 10 as Stroke['width'] }] })).toThrow('굵기');
});

it('keeps fine zoomed detail through repeated saves', () => {
  const stroke: Stroke = { color: 'ink', width: 2, points: [0, 0, .001, 0, .001, .001, .002, .001] };
  expect(simplifyStroke(stroke, 1200, 960).points).toEqual(stroke.points);
  const saved = preparePage({ ...page(), drawing: [stroke] });
  expect(preparePage(saved).drawing[0].points).toEqual(stroke.points);
});

it.each([8, 14, 28] as const)('paints eraser width %i in surface units', width => {
  const context = {
    save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(),
    lineTo: vi.fn(), stroke: vi.fn(),
  };
  paintStroke(context as unknown as CanvasRenderingContext2D,
    { color: 'erase', width, points: [0, 0, 1, 1] }, 600, 480, '#1E2326', 2);
  expect(context).toMatchObject({ lineWidth: width * 2, globalCompositeOperation: 'destination-out' });
});
import { paintStroke } from '../features/page/strokes';

describe('stroke simplification', () => {
  it('preserves a densely sampled line when points are at least 0.5 logical px apart', () => {
    const points = Array.from({ length: 500 }, (_, index) => [index / 499, index / 499]).flat();
    const simplified = simplifyStroke({ color: '#123', width: 5, points });
    expect(simplified.points).toHaveLength(points.length);
    expect(simplified.points.slice(-2)).toEqual([1, 1]);
    expect(simplified.color).toBe('#123');
    expect(simplified.width).toBe(5);
  });
  it('preserves a corner and rounds normalized coordinates', () => {
    expect(simplifyStroke({ color: 'erase', width: 14, points: [0, 0, 0.50001, 0.50001, 1, 0] }).points).toEqual([0, 0, 0.5, 0.5, 1, 0]);
  });
  it('only removes points less than 0.5 logical pixels from the previous kept point', () => {
    expect(simplifyStroke({ color: 'ink', width: 2, points: [0, 0, .001, 0, .002, 0, .002, .002, .004, .002] }).points)
      .toEqual([0, 0, .002, 0, .002, .002, .004, .002]);
    expect(simplifyStroke({ color: 'ink', width: 2, points: [0, 0, 0, .001, 0, .00125] }).points)
      .toEqual([0, 0, 0, .001]);
  });
});

it('paints straight segments through every point with short miter joins', () => {
  const context = {
    save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(),
    lineTo: vi.fn(), quadraticCurveTo: vi.fn(), stroke: vi.fn(),
  };
  paintStroke(context as unknown as CanvasRenderingContext2D,
    { color: 'ink', width: 2, points: [0, 0, .5, 1, 1, 0] }, 300, 400, '#1E2326');
  expect(context.lineTo.mock.calls).toEqual([[150, 400], [300, 0]]);
  expect(context.quadraticCurveTo).not.toHaveBeenCalled();
  expect(context).toMatchObject({ lineJoin: 'miter', miterLimit: 2, lineCap: 'round', strokeStyle: '#1E2326' });
});
