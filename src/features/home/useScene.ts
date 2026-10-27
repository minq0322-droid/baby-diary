import { useEffect, type RefObject } from 'react';

// One clock drives the canvas and all SVG/face motion. Layout is read only on resize.
export function useScene(
  scene: RefObject<HTMLElement>,
  dark: boolean,
) {
  useEffect(() => {
    const root = scene.current;
    const canvas = root?.querySelector('canvas');
    const ctx = canvas?.getContext('2d');
    if (!root || !canvas || !ctx) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const faces = Array.from(root.querySelectorAll<HTMLElement>('.home-face'));
    const marks = Array.from(
      root.querySelectorAll<SVGElement>('.animated-mark'),
    );
    const rays = Array.from(root.querySelectorAll<SVGElement>('.animated-ray'));
    const distant = Array.from(
      root.querySelectorAll<HTMLElement>('.distant-lantern'),
    );
    const random = mulberry32(0x51a7f00d);
    const stars: Star[] = [];
    const fireflies = Array.from({ length: 25 }, () => ({
      x: 0.03 + random() * 0.94,
      y: 0.2 + random() * 0.75,
      phase: random() * Math.PI * 2,
      speed: 0.45 + random() * 0.45,
    }));
    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = 0;
    let elapsed = 0;
    const night = Number(dark);
    let nextBurst = 5;
    let meteors: { start: number; x: number; y: number }[] = [];
    const resize = () => {
      width = root.clientWidth;
      height = root.clientHeight;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.max(60, Math.min(260, Math.round((width * height) / 7500)));
      stars.length = 0;
      for (let i = 0; i < count; i += 1) {
        const large = random() > 0.94;
        stars.push({
          x: random(),
          y: random(),
          r: large ? 1.2 + random() * 0.6 : 0.4 + random() * 0.5,
          alpha: 0.35 + random() * 0.55,
          phase: random() * Math.PI * 2,
          speed: 0.35 + random() * 0.75,
          color: random() > 0.92 ? (random() > 0.5 ? '#dce9ff' : '#fff0d0') : '#f4f3dc',
        });
      }
      start();
    };
    const draw = (now: number) => {
      frame = 0;
      const dt = previous ? Math.min((now - previous) / 1000, 0.08) : 0;
      previous = now;
      if (!reduced.matches) elapsed += dt;
      const t = reduced.matches ? 0 : elapsed;
      ctx.clearRect(0, 0, width, height);
      stars.forEach((star) => {
        ctx.globalAlpha = night * (reduced.matches ? star.alpha : star.alpha * (0.72 + 0.28 * (0.5 + 0.5 * Math.sin(t * star.speed + star.phase))));
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.r, 0, Math.PI * 2);
        ctx.fill();
      });
      if (!reduced.matches && dark && t >= nextBurst) {
        meteors.push(
          ...Array.from(
            { length: 1 + Math.floor(Math.random() * 3) },
            (_, i) => ({
              start: t + i * 0.23,
              x: width * (0.45 + Math.random() * 0.65),
              y: height * (0.04 + Math.random() * 0.36),
            }),
          ),
        );
        nextBurst = t + 5 + Math.random() * 4;
      }
      meteors = meteors.filter((meteor) => t - meteor.start < 1.4);
      if (!reduced.matches)
        meteors.forEach((meteor) => {
          const p = (t - meteor.start) / 1.4;
          if (p < 0) return;
          const x = meteor.x - p * 250;
          const y = meteor.y + p * 250;
          const trail = ctx.createLinearGradient(x, y, x + 75, y - 75);
          trail.addColorStop(0, '#fff8d9');
          trail.addColorStop(1, '#fff8d900');
          ctx.globalAlpha = night * Math.sin(p * Math.PI) * 0.85;
          ctx.strokeStyle = trail;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 75, y - 75);
          ctx.stroke();
        });
      fireflies.forEach((firefly) => {
        if (dark) return;
        const x = firefly.x * width;
        const y = firefly.y * height;
        ctx.globalAlpha =
          (1 - night) *
          (reduced.matches
            ? 0.55
            : 0.12 + 0.88 * Math.pow(0.5 + 0.5 * Math.sin(t * firefly.speed + firefly.phase), 2));
        const glow = ctx.createRadialGradient(x, y, 0, x, y, 9);
        glow.addColorStop(0, '#f6ffc5');
        glow.addColorStop(0.18, '#e3f58eb3');
        glow.addColorStop(1, '#cddd7100');
        ctx.fillStyle = glow;
        ctx.fillRect(x - 9, y - 9, 18, 18);
      });
      ctx.globalAlpha = 1;
      faces.forEach((face, i) => {
        face.style.transform = reduced.matches
          ? 'none'
          : `translate(${Math.sin(t * 0.2 + i * 2) * 20}px, ${Math.cos(t * 0.18 + i * 2) * 8}px) rotate(${Math.sin(t * 0.31 + i * 2) * 1.6}deg)`;
      });
      rays.forEach((ray, i) => {
        ray.setAttribute(
          'transform',
          `rotate(${Number(ray.dataset.day) * 12 + (reduced.matches ? 0 : Math.sin(t * (0.65 + (i % 5) * 0.13) + i) * 1.3)} 80 80)`,
        );
      });
      marks.forEach((mark, i) => {
        mark.style.opacity = reduced.matches
          ? '1'
          : String(0.68 + 0.32 * (0.5 + 0.5 * Math.sin(t * 0.8 + i * 0.83)));
      });
      distant.forEach((node, i) => {
        node.style.transform = reduced.matches
          ? 'none'
          : `translate(${Math.sin(t * 0.12 + i) * 7}px,${Math.cos(t * 0.14 + i) * 7}px)`;
      });
      if (!reduced.matches && !document.hidden)
        frame = requestAnimationFrame(draw);
    };
    function start() {
      if (!frame && !document.hidden) frame = requestAnimationFrame(draw);
    }
    const restart = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previous = 0;
      if (reduced.matches) {
        elapsed = 0;
        meteors = [];
      }
      start();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(root);
    document.addEventListener('visibilitychange', restart);
    reduced.addEventListener('change', restart);
    resize();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', restart);
      reduced.removeEventListener('change', restart);
    };
  }, [scene, dark]);
}

type Star = {
  x: number;
  y: number;
  r: number;
  alpha: number;
  phase: number;
  speed: number;
  color: string;
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
