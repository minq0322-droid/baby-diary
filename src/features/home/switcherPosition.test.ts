import { describe, expect, it } from 'vitest';
import { sunsetSwitcherPosition } from './switcherPosition';
import { ridgeY } from './wander';

describe('setting sun placement', () => {
  for (const [width, height] of [[375, 812], [1280, 800]]) {
    it(`meets the actual far ridge at ${width} × ${height}`, () => {
      const { left, top, clipTransform } = sunsetSwitcherPosition(width, height);
      expect(left + 32).toBeCloseTo(width * 0.76);
      expect(top + 32).toBeCloseTo(ridgeY(left + 32, width, height, 0));
      expect(top).toBeGreaterThan(height * 0.35);
      expect(left + 64).toBeLessThan(width);
      expect(clipTransform).toContain(`scale(${width / 375} ${height / 812})`);
    });
  }
});
