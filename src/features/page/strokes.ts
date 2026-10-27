import type { Stroke } from '../../data/types';
export function paintStroke(context: CanvasRenderingContext2D, stroke: Stroke, width: number, height: number, ink: string, scale = 1) {
  const points = stroke.points;
  if (points.length < 2)
    return;
  context.save();
  context.globalCompositeOperation = stroke.color === 'erase' ? 'destination-out' : 'source-over';
  context.strokeStyle = stroke.color === 'ink' ? ink : stroke.color;
  context.fillStyle = context.strokeStyle;
  context.lineWidth = stroke.width * scale;
  context.lineCap = 'round';
  context.lineJoin = 'miter';
  context.miterLimit = 2;
  context.beginPath();
  context.moveTo(points[0] * width, points[1] * height);
  if (points.length === 2) {
    context.arc(points[0] * width, points[1] * height, stroke.width * scale / 2, 0, Math.PI * 2);
    context.fill();
  }
  else {
    for (let i = 2; i < points.length; i += 2) {
      context.lineTo(points[i] * width, points[i + 1] * height);
    }
    context.stroke();
  }
  context.restore();
}
