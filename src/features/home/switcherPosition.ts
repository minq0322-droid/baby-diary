import { ridgeY } from './wander';

// The landscape's far ridge, scaled into the 64px button's local coordinates.
export function sunsetSwitcherPosition(width: number, height: number) {
  const x = width * 0.76;
  const y = ridgeY(x, width, height, 0);
  return {
    left: x - 32,
    top: y - 32,
    clipTransform: `translate(${32 - x} ${32 - y}) scale(${width / 375} ${height / 812})`,
  };
}
