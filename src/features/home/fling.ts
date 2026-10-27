export type Body = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};
export type FlingState = Body & {
  homeX: number;
  homeY: number;
  elapsed: number;
  mode: 'fling' | 'return' | 'idle';
};
export type Bounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export function dragTo(body: Body, x: number, y: number, bounds: Bounds, other?: Body): Body {
  const dx = x - body.x;
  const dy = y - body.y;
  const count = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (body.radius / 4)));
  let next = { ...body };
  for (let i = 0; i < count; i += 1) {
    next = constrain({ ...next, x: next.x + dx / count, y: next.y + dy / count }, bounds);
    if (other) next = separate(next, bounds, other);
  }
  return next;
}
export function separate(body: Body, bounds: Bounds, other: Body): Body {
  const distance = body.radius + other.radius;
  if (Math.hypot(body.x - other.x, body.y - other.y) >= distance) return body;
  const angle = Math.atan2(body.y - other.y, body.x - other.x);
  let closest: Body | undefined;
  let cost = Infinity;
  // Exact circle/edge intersections avoid missing narrow feasible arcs.
  const angles = [angle];
  const gap = distance + 0.001;
  for (const x of [bounds.left + body.radius, bounds.right - body.radius]) {
    const ratio = (x - other.x) / gap;
    if (Math.abs(ratio) <= 1) {
      const a = Math.acos(ratio);
      angles.push(a, -a);
    }
  }
  for (const y of [bounds.top + body.radius, bounds.bottom - body.radius]) {
    const ratio = (y - other.y) / gap;
    if (Math.abs(ratio) <= 1) {
      const a = Math.asin(ratio);
      angles.push(a, Math.PI - a);
    }
  }
  for (const a of angles) {
    const candidate = constrain({
      ...body,
      x: other.x + Math.cos(a) * gap,
      y: other.y + Math.sin(a) * gap
    }, bounds);
    if (Math.hypot(candidate.x - other.x, candidate.y - other.y) < distance) continue;
    const delta = Math.hypot(candidate.x - body.x, candidate.y - body.y);
    if (delta < cost) {
      closest = candidate;
      cost = delta;
    }
  }
  return closest ?? body;
}
export function constrain(body: Body, bounds: Bounds): Body {
  const next = {
    ...body
  };
  for (const axis of ['x', 'y'] as const) {
    const low = (axis === 'x' ? bounds.left : bounds.top) + body.radius;
    const high = (axis === 'x' ? bounds.right : bounds.bottom) - body.radius;
    const velocity = axis === 'x' ? 'vx' : 'vy';
    if (next[axis] < low) {
      next[axis] = low;
      next[velocity] = Math.abs(next[velocity]) * 0.6;
    } else if (next[axis] > high) {
      next[axis] = Math.max(low, high);
      next[velocity] = -Math.abs(next[velocity]) * 0.6;
    }
  }
  return next;
}
export function step(state: FlingState, dt: number, bounds: Bounds, other?: Body): FlingState {
  let next = {
    ...state
  };
  if (next.mode === 'idle') return next;
  // Substeps keep the spring stable after slow frames.
  const count = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = Math.min(dt, 0.1) / count;
  for (let i = 0; i < count; i += 1) {
    next.elapsed += h;
    if (next.mode === 'return' || Math.hypot(next.vx, next.vy) < 4) {
      return { ...next, vx: 0, vy: 0, mode: 'idle' };
    }
    next.vx *= Math.exp(-1.6 * h);
    next.vy *= Math.exp(-1.6 * h);
    next.x += next.vx * h;
    next.y += next.vy * h;
    if (other && next.mode === 'fling') {
      const dx = next.x - other.x;
      const dy = next.y - other.y;
      const distance = Math.hypot(dx, dy);
      const separation = next.radius + other.radius;
      if (distance < separation) {
        const nx = distance ? dx / distance : 1;
        const ny = distance ? dy / distance : 0;
        next.x = other.x + nx * separation;
        next.y = other.y + ny * separation;
        const velocity = (next.vx - other.vx) * nx + (next.vy - other.vy) * ny;
        if (velocity < 0) {
          next.vx -= 1.6 * velocity * nx;
          next.vy -= 1.6 * velocity * ny;
        }
      }
    }
    next = {
      ...next,
      ...constrain(next, bounds)
    };
    if (other) next = {
      ...next,
      ...separate(next, bounds, other)
    };
  }
  return next;
}
