import type { Page, Stroke } from '../data/types';

/** Only discard near-duplicate samples in logical (CSS, not device) pixels. */
export function simplifyStroke(
  stroke: Stroke,
  width = 300,
  height = 400,
): Stroke {
  const points: number[] = [];
  let lastX = 0;
  let lastY = 0;
  for (let index = 0; index + 1 < stroke.points.length; index += 2) {
    const x = Math.max(0, Math.min(1, stroke.points[index]));
    const y = Math.max(0, Math.min(1, stroke.points[index + 1]));
    if (
      points.length &&
      Math.hypot((x - lastX) * width, (y - lastY) * height) < 0.5
    )
      continue;
    points.push(Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000);
    lastX = x;
    lastY = y;
  }
  return { ...stroke, points };
}

export function preparePage(page: Page): Page {
  const id = page.date + '__' + page.childId + '__' + page.authorId;
  if (!['dad', 'mom'].includes(page.authorId) || page.id !== id) {
    throw new Error('페이지의 날짜, 아이와 작성자는 바꿀 수 없어요.');
  }
  const result = {
    ...page,
    id,
    drawing: page.drawing.map((stroke) => simplifyStroke(stroke)),
  };
  if (new Blob([JSON.stringify(result)]).size > 200 * 1024) {
    throw new Error('그림이 너무 커서 저장할 수 없어요. 일부를 지워 주세요');
  }
  return structuredClone(result);
}
