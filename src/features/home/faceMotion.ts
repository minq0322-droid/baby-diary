import type { Bounds, FlingState } from './fling';
import { constrain, dragTo, separate, step } from './fling';
import type { DragDetail } from './useFaceGesture';

// Imperative transforms share useScene's clock; React never renders a physics frame.
export function faceMotion(
  root: HTMLElement,
  faces: HTMLElement[],
  dark: boolean,
  dayStyle: 'sunset' | 'dandelion',
  wake: () => void,
) {
  const bodies: FlingState[] = [];
  const limits: Bounds[] = [];
  const origins: {
    x: number;
    y: number;
  }[] = [];
  let picked = -1;
  let amplitude = 8;
  const resumeTimes: number[] = [];
  const visual: { x: number; y: number }[] = [];
  let pointer = {
    x: 0,
    y: 0,
    bodyX: 0,
    bodyY: 0
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function resize() {
    const scene = root.getBoundingClientRect();
    amplitude = scene.width >= 768 ? 12 : 8;
    const nav = root.querySelector('.home-navigation')!.getBoundingClientRect();
    const safeLeft = parseFloat(getComputedStyle(root).getPropertyValue('--safe-left')) || 0;
    const safeRight = parseFloat(getComputedStyle(root).getPropertyValue('--safe-right')) || 0;
    const safeTop = parseFloat(getComputedStyle(root).getPropertyValue('--safe-top')) || 0;
    faces.forEach((face, i) => {
      face.style.transform = 'none';
      face.classList.remove('picked', 'travelling');
      const rect = face.getBoundingClientRect();
      const x = rect.left - scene.left + rect.width / 2;
      const y = rect.top - scene.top + rect.height / 2;
      const radius = rect.width / 2;
      origins[i] = {
        x,
        y
      };
      resumeTimes[i] = -1;
      bodies[i] = {
        x,
        y,
        homeX: x,
        homeY: y,
        vx: 0,
        vy: 0,
        radius: dark && root.classList.contains('night-lantern') ? rect.width * 0.76 : radius,
        elapsed: 0,
        mode: 'idle'
      };
      const lantern = dark && root.classList.contains('night-lantern');
      const scale = !dark ? face.querySelector('.day-art')!.getBoundingClientRect().width / (dayStyle === 'sunset' ? 300 : 220) : 1;
      const collisionRadius = bodies[i].radius;
      const extentX = !dark ? (dayStyle === 'sunset' ? 150 : 110) * scale : radius * 1.08;
      const above = lantern ? rect.width * 0.72 : !dark && dayStyle === 'dandelion' ? 110 * scale : radius;
      const below = lantern ? rect.width * 0.8 : !dark && dayStyle === 'sunset' ? 174 * scale - radius : !dark ? 110 * scale : radius;
      limits[i] = {
        left: safeLeft + extentX + 14 - collisionRadius,
        right: scene.width - safeRight - extentX - 14 + collisionRadius,
        top: safeTop + above + 14 - collisionRadius,
        bottom: nav.top - scene.top - below - 12 + collisionRadius
      };
      const home = constrain(bodies[i], limits[i]);
      bodies[i] = {
        ...bodies[i],
        ...home,
        homeX: home.x,
        homeY: home.y
      };
      face.style.setProperty('--stem-height', Math.max(0, Math.min(scene.height * 0.87, nav.top - scene.top - 24) - y - radius) + 'px');
    });
    picked = -1;
  }
  function draw(dt: number, t: number) {
    faces.forEach((face, i) => {
      let body = bodies[i];
      if (!body) return;
      if (i !== picked && body.mode !== 'idle') {
        body = reduced.matches ? {
          ...body,
          x: body.homeX,
          y: body.homeY,
          vx: 0,
          vy: 0,
          mode: 'idle'
        } : step(body, dt, limits[i], bodies[1 - i]);
        bodies[i] = body;
        if (body.mode === 'idle') resumeTimes[i] = t;
      }
      const idle = i !== picked && body.mode === 'idle';
      face.classList.toggle('travelling', !idle);
      const blend = idle && !reduced.matches ? Math.min(1, (t - resumeTimes[i]) / 0.5) : 0;
      const x = Math.sin(t * (1.57 + i * 0.2) + i * 2) * amplitude * blend;
      const y = Math.sin(t * (1.85 - i * 0.25) + i * 2) * 7 * blend;
      const tilt = Math.sin(t * 1.3 + i * 2) * 2 * blend;
      let bounded = constrain({
        ...body,
        x: body.x + x,
        y: body.y + y,
        vx: 0,
        vy: 0
      }, limits[i]);
      if (!idle && bodies[1 - i]) bounded = separate(bounded, limits[i], bodies[1 - i]);
      visual[i] = bounded;
      face.style.transform = `translate(${bounded.x - origins[i].x}px, ${bounded.y - origins[i].y}px) rotate(${tilt}deg) scale(${i === picked ? 1.06 : 1})`;
    });
  }
  const drag = (event: Event) => {
    const face = event.target as HTMLElement;
    const i = faces.indexOf(face);
    if (i < 0) return;
    const detail = (event as CustomEvent<DragDetail>).detail;
    const body = bodies[i];
    if (!body) return;
    if (detail.phase === 'pick') {
      picked = i;
      if (visual[i]) {
        body.x = visual[i].x;
        body.y = visual[i].y;
      }
      pointer = {
        x: detail.x,
        y: detail.y,
        bodyX: body.x,
        bodyY: body.y
      };
      face.classList.add('picked');
    } else if (detail.phase === 'move' && picked === i) {
      const moved = dragTo(
        body,
        pointer.bodyX + detail.x - pointer.x,
        pointer.bodyY + detail.y - pointer.y,
        limits[i],
        bodies[1 - i],
      );
      bodies[i] = {
        ...body,
        ...moved,
      };
    } else if (detail.phase === 'release' || detail.phase === 'cancel') {
      picked = -1;
      face.classList.remove('picked');
      bodies[i] = reduced.matches ? {
        ...body,
        x: body.homeX,
        y: body.homeY,
        mode: 'idle'
      } : {
        ...body,
        vx: detail.vx,
        vy: detail.vy,
        elapsed: 0,
        mode: detail.phase === 'cancel' ? 'return' : 'fling'
      };
    }
    if (reduced.matches) draw(0, 0);
    wake();
  };
  root.addEventListener('home-drag', drag);
  return {
    resize,
    draw,
    dispose: () => root.removeEventListener('home-drag', drag)
  };
}
