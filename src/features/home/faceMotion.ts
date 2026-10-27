import type { Bounds, FlingState } from './fling';
import { constrain, dragTo, separate, step } from './fling';
import { ridgeY, wanderStep, wanderTarget, type Point } from './wander';
import type { DragDetail } from './useFaceGesture';
import { sunsetSwitcherPosition } from './switcherPosition';

// Shares the canvas clock. All geometry reads happen on resize, never in a frame.
export function faceMotion(
  root: HTMLElement,
  faces: HTMLElement[],
  dark: boolean,
  dayStyle: 'sunset' | 'dandelion',
  wake: () => void,
) {
  const bodies: FlingState[] = [];
  const limits: Bounds[] = [];
  const origins: Point[] = [];
  const geometry: {
    radius: number;
    ground: number;
    scale: number;
    width: number;
    height: number;
  }[] = [];
  const stems = faces.map(face => face.querySelector<SVGElement>('.day-stem'));
  const flowers = faces.map(face =>
    face.querySelector<SVGElement>('.sunset-art .day-marks'),
  );
  const flowerNodes = faces.map(face =>
    Array.from(face.querySelectorAll<SVGElement>('.sunset-art .day-mark')),
  );
  const floatingArt = faces.map(face =>
    Array.from(face.querySelectorAll<HTMLElement | SVGElement>(
      '.home-portrait, .moon-art, .lantern-art, .dandelion-art',
    )),
  );
  let picked = -1;
  let speed = 18;
  let avoid: Point | undefined;
  let pointer = { x: 0, y: 0, bodyX: 0, bodyY: 0 };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  function resize() {
    const scene = root.getBoundingClientRect();
    const nav = root.querySelector('.home-navigation')!.getBoundingClientRect();
    const date = root.querySelector('.scene-date')!.getBoundingClientRect();
    const switcher = root.querySelector<HTMLElement>('.scene-switch-object');
    if (switcher) {
      if (!dark && dayStyle === 'sunset') {
        const position = sunsetSwitcherPosition(scene.width, scene.height);
        switcher.style.left = `${position.left}px`;
        switcher.style.top = `${position.top}px`;
        switcher.querySelector('.scene-sun-clip')?.setAttribute('transform', position.clipTransform);
      } else {
        switcher.style.removeProperty('left');
        switcher.style.removeProperty('top');
      }
    }
    const object = switcher?.getBoundingClientRect();
    avoid = object && {
      x: object.left - scene.left + object.width / 2,
      y: object.top - scene.top + object.height / 2,
    };
    speed = scene.width >= 768 ? 30 : 18;
    const css = getComputedStyle(root);
    const safeLeft = parseFloat(css.getPropertyValue('--safe-left')) || 0;
    const safeRight = parseFloat(css.getPropertyValue('--safe-right')) || 0;
    // Reset all transforms before measuring the shared coordinate system.
    faces.forEach(face => {
      face.style.transform = 'none';
    });
    floatingArt.flat().forEach(art => {
      art.style.transform = 'none';
    });
    faces.forEach((face, i) => {
      face.classList.remove('picked', 'travelling');
      const rect = face.getBoundingClientRect();
      const x = rect.left - scene.left + rect.width / 2;
      const y = rect.top - scene.top + rect.height / 2;
      const radius = rect.width / 2;
      const lantern = dark && root.classList.contains('night-lantern');
      const scale = !dark
        ? face.querySelector('.day-art')!.getBoundingClientRect().width /
          (dayStyle === 'sunset' ? 300 : 220)
        : 1;
      const collision = lantern
        ? rect.width * 0.78
        : !dark && dayStyle === 'dandelion' ? 108 * scale : radius + 6;
      const above = lantern ? rect.width * 0.74 : collision;
      const below = lantern ? rect.width * 0.84 : collision;
      const extentX = lantern ? rect.width * 0.55 : collision;
      origins[i] = { x, y };
      geometry[i] = {
        radius,
        ground: Math.min(scene.height * 0.87, nav.top - scene.top - 24),
        scale,
        width: scene.width,
        height: scene.height,
      };
      bodies[i] = {
        x, y, homeX: x, homeY: y, vx: 0, vy: 0,
        radius: collision, elapsed: 0, mode: 'idle',
      };
      limits[i] = {
        left: safeLeft + extentX + 14 - collision,
        right: scene.width - safeRight - extentX - 14 + collision,
        top: date.bottom - scene.top + above + 16 - collision,
        bottom: nav.top - scene.top - below - 16 + collision,
      };
      if (!dark && dayStyle === 'dandelion') {
        limits[i].bottom = Math.min(limits[i].bottom, geometry[i].ground - radius - 8 + collision);
      }
      const home = constrain(bodies[i], limits[i]);
      bodies[i] = { ...bodies[i], ...home, homeX: home.x, homeY: home.y };
      face.style.setProperty('--stem-height', '240px');
    });
    picked = -1;
  }
  function draw(dt: number, t: number) {
    bodies.forEach((body, i) => {
      if (i === picked) return;
      if (reduced.matches) {
        bodies[i] = { ...body, x: body.homeX, y: body.homeY, vx: 0, vy: 0, mode: 'idle' };
      } else if (body.mode !== 'idle') {
        bodies[i] = step(body, dt, limits[i], bodies[1 - i]);
      } else {
        const target = wanderTarget(limits[i], body.radius, t, 1.8 + i * 3.1);
        target.x += Math.sin(t * 0.27 + i) * 8;
        target.y += Math.sin(t * 0.33 + i * 2) * 6;
        bodies[i] = {
          ...body,
          ...wanderStep(body, limits[i], target, dt, speed, bodies[1 - i], avoid),
        };
      }
    });
    faces.forEach((face, i) => {
      let body = bodies[i];
      if (!body) return;
      if (!reduced.matches && bodies[1 - i]) {
        body = { ...body, ...separate(body, limits[i], bodies[1 - i]) };
        bodies[i] = body;
      }
      const dx = body.x - origins[i].x;
      const dy = body.y - origins[i].y;
      const tilt = reduced.matches ? 0 : Math.sin(t * 0.7 + i * 2) * 2;
      face.style.transform = `translate(${dx}px, ${dy}px)`;
      floatingArt[i].forEach(art => {
        art.style.transform = `rotate(${tilt}deg)`;
      });
      const { radius, ground, scale, width, height } = geometry[i];
      // A sheared curved stem joins the moving head to its original ground root.
      if (!dark && stems[i]) {
        const length = Math.max(8, ground - body.y - radius + 3);
        stems[i]!.style.transform = `matrix(1, 0, ${-dx / 240}, ${length / 240}, 0, 0)`;
      }
      if (!dark && flowers[i]) {
        const flowerX = Math.max(150 * scale + 8, Math.min(width - 150 * scale - 8, body.x));
        flowers[i]!.style.transform = `translateX(${(flowerX - body.x) / scale}px)`;
        flowerNodes[i].forEach((flower, day) => {
          const x = 7 + day * 9.8;
          const worldX = flowerX + (x - 150) * scale;
          const y = (ridgeY(worldX, width, height, i) - body.y + radius) / scale - 7;
          flower.style.transform = `translate(${x}px, ${y}px)`;
        });
      }
    });
  }
  const drag = (event: Event) => {
    const face = event.target as HTMLElement;
    const i = faces.indexOf(face);
    if (i < 0 || !bodies[i]) return;
    const detail = (event as CustomEvent<DragDetail>).detail;
    const body = bodies[i];
    if (detail.phase === 'pick') {
      picked = i;
      pointer = { x: detail.x, y: detail.y, bodyX: body.x, bodyY: body.y };
      face.classList.add('picked');
    } else if (detail.phase === 'move' && picked === i) {
      bodies[i] = {
        ...body,
        ...dragTo(
          body,
          pointer.bodyX + detail.x - pointer.x,
          pointer.bodyY + detail.y - pointer.y,
          limits[i],
          bodies[1 - i],
        ),
      };
    } else if (detail.phase === 'release' || detail.phase === 'cancel') {
      picked = -1;
      face.classList.remove('picked');
      bodies[i] = reduced.matches
        ? { ...body, x: body.homeX, y: body.homeY, vx: 0, vy: 0, mode: 'idle' }
        : { ...body, vx: detail.vx, vy: detail.vy, elapsed: 0, mode: detail.phase === 'cancel' ? 'idle' : 'fling' };
    }
    if (reduced.matches) draw(0, 0);
    wake();
  };
  root.addEventListener('home-drag', drag);
  return { resize, draw, dispose: () => root.removeEventListener('home-drag', drag) };
}
