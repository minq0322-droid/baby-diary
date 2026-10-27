import { describe, expect, it } from 'vitest';
import { dragTo, step, type FlingState } from './fling';
const bounds = {
  left: 0,
  top: 0,
  right: 1000,
  bottom: 1000
};
const initial: FlingState = {
  x: 100,
  y: 100,
  vx: 200,
  vy: 0,
  radius: 20,
  homeX: 100,
  homeY: 100,
  elapsed: 0,
  mode: 'fling'
};
describe('home fling', () => {
  it('does not drag through the other face in a narrow scene', () => {
    const other = { x: 100, y: 200, vx: 0, vy: 0, radius: 20 };
    const narrow = { left: 80, right: 120, top: 0, bottom: 400 };
    const next = dragTo(initial, 100, 300, narrow, other);
    expect(next.y).toBeLessThanOrEqual(160);
    expect(Math.hypot(next.x - other.x, next.y - other.y)).toBeGreaterThanOrEqual(40);
  });
  it('reverses at an edge with restitution', () => {
    const next = step({
      ...initial,
      x: 979
    }, 0.01, bounds);
    expect(next.x).toBeLessThanOrEqual(980);
    expect(next.vx).toBeLessThan(0);
    expect(Math.abs(next.vx)).toBeCloseTo(200 * Math.exp(-0.016) * 0.6, 0);
  });
  it('slows under friction', () => {
    expect(step(initial, 0.1, bounds).vx).toBeLessThan(initial.vx);
  });
  it('returns home and rests', () => {
    let next = {
      ...initial,
      x: 600
    };
    for (let i = 0; i < 900; i += 1) next = step(next, 1 / 120, bounds);
    expect(next.mode).toBe('idle');
    expect(next.x).toBe(initial.homeX);
    expect(next.vx).toBe(0);
  });
  it('separates colliding circles and reflects approaching velocity', () => {
    const other = {
      x: 130,
      y: 100,
      vx: 0,
      vy: 0,
      radius: 20
    };
    const next = step(initial, 0.01, bounds, other);
    expect(Math.hypot(next.x - other.x, next.y - other.y)).toBeGreaterThanOrEqual(40);
    expect(next.vx).toBeLessThan(0);
  });
});
