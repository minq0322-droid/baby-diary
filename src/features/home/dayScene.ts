// Decorative seeds and birds are painted behind the interactive faces.
export function dayScene() {
  const seeds: {
    x: number;
    y: number;
    phase: number;
    depth: number;
  }[] = [];
  let nextFlock = 3 + Math.random() * 5;
  let flockStart = -100;
  let duration = 12;
  let direction = 1;
  let altitude = 0.2;
  let count = 11;
  return {
    resize(width: number, height: number) {
      seeds.length = 0;
      for (let i = 0; i < Math.max(30, Math.min(width < 768 ? 40 : Infinity, Math.round(width * height / 10000))); i += 1) {
        seeds.push({
          x: Math.random(),
          y: Math.random(),
          phase: Math.random() * Math.PI * 2,
          depth: 0.45 + Math.random() * 0.55
        });
      }
    },
    draw(ctx: CanvasRenderingContext2D, width: number, height: number, t: number, style: string, reduced: boolean) {
      if (style === 'dandelion') {
        seeds.forEach(seed => {
          const x = (seed.x * width + t * (9 + seed.depth * 10)) % (width + 40) - 20;
          const y = ((seed.y * height - t * (6 + seed.depth * 7)) % (height + 40) + height + 40) % (height + 40) - 20;
          ctx.save();
          ctx.translate(x + Math.sin(t * 0.8 + seed.phase) * 6, y);
          ctx.rotate(0.4 * Math.sin(t * 0.5 + seed.phase));
          ctx.scale(seed.depth * 0.8, seed.depth * 0.8);
          ctx.globalAlpha = 0.3 + seed.depth * 0.45;
          ctx.strokeStyle = '#fffdf1';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(0, 12);
          ctx.lineTo(0, 0);
          for (const [sx, sy] of [[-6, -5], [-4, -8], [0, -9], [4, -8], [6, -5], [-7, -1], [7, -1]]) {
            ctx.moveTo(0, 0);
            ctx.lineTo(sx, sy);
          }
          ctx.stroke();
          ctx.restore();
        });
      } else if (!reduced) {
        if (t >= nextFlock) {
          flockStart = t;
          duration = 10 + Math.random() * 4;
          nextFlock = t + 18 + Math.random() * 12;
          direction *= -1;
          altitude = 0.12 + Math.random() * 0.17;
          count = 7 + Math.floor(Math.random() * 9);
        }
        const p = (t - flockStart) / duration;
        if (p >= 0 && p <= 1) {
          ctx.strokeStyle = '#977c93';
          ctx.lineWidth = 1.1;
          ctx.lineCap = 'round';
          ctx.globalAlpha = 0.42;
          for (let i = 0; i < count; i += 1) {
            const x = (direction > 0 ? p : 1 - p) * (width + 280) - 140 + (i % 2 ? -1 : 1) * Math.ceil(i / 2) * 15;
            const y = height * altitude + Math.ceil(i / 2) * 7 + Math.sin(t + i) * 3;
            const wing = 2 + Math.sin(t * 4 + i * 1.7) * 2.5;
            ctx.beginPath();
            ctx.moveTo(x - 5, y - wing);
            ctx.quadraticCurveTo(x - 2, y - wing - 1, x, y);
            ctx.quadraticCurveTo(x + 2, y - wing - 1, x + 5, y - wing);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
    }
  };
}
