import { constrain, separate, type Body, type Bounds } from './fling';

export type Point = { x: number; y: number };

// The two quadratic ridge paths in artwork.ts, expressed in its 375 × 812 viewBox.
export function ridgeY(x: number, width: number, height: number, index: number): number {
  const px = x / width * 375;
  const segments = index === 0
    ? [[-15, 395, 75, 349, 151, 371], [151, 371, 227, 393, 390, 367]]
    : [[-15, 672, 74, 634, 166, 601], [166, 601, 252, 568, 390, 617]];
  const [x0, y0, cx, cy, x1, y1] = segments[px <= segments[0][4] ? 0 : 1];
  let low = 0;
  let high = 1;
  for (let i = 0; i < 16; i += 1) {
    const t = (low + high) / 2;
    const q = 1 - t;
    if (q * q * x0 + 2 * q * t * cx + t * t * x1 < px) low = t;
    else high = t;
  }
  const t = (low + high) / 2;
  return ((1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1) / 812 * height;
}

// Irrational frequencies sweep the available area without a repeating ping-pong.
export function wanderTarget(bounds: Bounds, radius: number, t: number, phase: number): Point {
  const left = bounds.left + radius;
  const top = bounds.top + radius;
  const width = Math.max(0, bounds.right - radius - left);
  const height = Math.max(0, bounds.bottom - radius - top);
  return {
    x: left + width * (0.5 + 0.49 * Math.sin(t * 0.043 + phase)),
    y: top + height * (0.5 + 0.49 * Math.sin(t * 0.031 + phase * 1.7)),
  };
}

export function wanderStep(body: Body, bounds: Bounds, target: Point, dt: number, speed: number, other?: Body, avoid?: Point): Body {
  let dx = target.x - body.x;
  let dy = target.y - body.y;
  const distance = Math.max(1, Math.hypot(dx, dy));
  dx = dx / distance * Math.min(speed, distance * 0.3);
  dy = dy / distance * Math.min(speed, distance * 0.3);
  for (const obstacle of [other, avoid && { ...avoid, radius: 42 }]) {
    if (!obstacle) continue;
    const x = body.x - obstacle.x;
    const y = body.y - obstacle.y;
    const length = Math.hypot(x, y);
    const reach = body.radius + obstacle.radius + 55;
    const force = Math.max(0, 1 - length / reach) * speed * 3;
    dx += (length ? x / length : 1) * force;
    dy += (length ? y / length : 0) * force;
  }
  const magnitude = Math.max(speed, Math.hypot(dx, dy));
  const blend = 1 - Math.exp(-dt * 0.7);
  const vx = body.vx + (dx * speed / magnitude - body.vx) * blend;
  const vy = body.vy + (dy * speed / magnitude - body.vy) * blend;
  const next = constrain({ ...body, x: body.x + vx * dt, y: body.y + vy * dt, vx, vy }, bounds);
  return other ? separate(next, bounds, other) : next;
}
