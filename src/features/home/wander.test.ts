import { describe, expect, it } from 'vitest';
import { constrain, type Body } from './fling';
import { ridgeY, wanderStep, wanderTarget } from './wander';

describe('whole-scene wandering', () => {
  for (const [width, height] of [[375, 812], [1280, 800]]) {
    for (const [scene, radius] of [['sunset', 70], ['dandelion', 108], ['moon', 100], ['lantern', 147]] as const) {
      it(`${scene} stays separated inside ${width} × ${height}`, () => {
        const inset = scene === 'lantern' ? 104 - radius : 0;
        const bounds = { left: 14 + inset, right: width - 14 - inset, top: 80, bottom: height - 110 };
        let a: Body = { x: width / 2, y: 80 + radius, radius, vx: 0, vy: 0 };
        let b = { ...a, y: height - 110 - radius };
        const speed = width < 768 ? 18 : 30;
        let travelled = 0;
        for (let frame = 0; frame < 7200; frame += 1) {
          const time = frame / 30;
          const previous = a;
          a = wanderStep(a, bounds, wanderTarget(bounds, radius, time, 1.8), 1 / 30, speed, b);
          b = wanderStep(b, bounds, wanderTarget(bounds, radius, time, 4.9), 1 / 30, speed, a);
          travelled += Math.hypot(a.x - previous.x, a.y - previous.y);
          expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(radius * 2 - 0.001);
          for (const body of [a, b]) {
            expect(constrain(body, bounds).x).toBe(body.x);
            expect(constrain(body, bounds).y).toBe(body.y);
            expect(Math.hypot(body.vx, body.vy)).toBeLessThanOrEqual(speed + 0.001);
          }
        }
        expect(travelled).toBeGreaterThan(300);
      });
    }
  }

  it('targets visit the whole available rectangle and change continuously', () => {
    const bounds = { left: 20, right: 1000, top: 80, bottom: 700 };
    const points = Array.from({ length: 600 }, (_, t) => wanderTarget(bounds, 80, t, 0));
    expect(Math.min(...points.map(p => p.x))).toBeLessThan(120);
    expect(Math.max(...points.map(p => p.x))).toBeGreaterThan(900);
    expect(Math.min(...points.map(p => p.y))).toBeLessThan(180);
    expect(Math.max(...points.map(p => p.y))).toBeGreaterThan(600);
    const a = wanderTarget(bounds, 80, 10, 0);
    const b = wanderTarget(bounds, 80, 10.016, 0);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(1);
  });

  it('steers away from the switcher before touching it', () => {
    const body = { x: 200, y: 200, vx: 0, vy: 0, radius: 60 };
    const bounds = { left: 0, top: 0, right: 600, bottom: 600 };
    const next = wanderStep(body, bounds, body, 0.1, 18, undefined, { x: 250, y: 200 });
    expect(next.vx).toBeLessThan(0);
  });

  it('does not advance with a paused clock', () => {
    const body = { x: 200, y: 200, vx: 12, vy: 3, radius: 60 };
    const bounds = { left: 0, top: 0, right: 600, bottom: 600 };
    expect(wanderStep(body, bounds, { x: 400, y: 400 }, 0, 18)).toEqual(body);
  });

  it('keeps flowers on the scaled artwork ridges', () => {
    expect(ridgeY(151, 375, 812, 0)).toBeCloseTo(371, 1);
    expect(ridgeY(166, 375, 812, 1)).toBeCloseTo(601, 1);
    expect(ridgeY(151 * 2, 750, 1624, 0)).toBeCloseTo(742, 1);
  });
});
