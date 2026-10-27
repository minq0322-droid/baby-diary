import { describe, expect, it, vi } from 'vitest';
import { simplifyStroke } from './stroke';
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
