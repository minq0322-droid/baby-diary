import type { Page, Stroke } from '../data/types';
import { isValidPageId } from './pageId';

export function isStrokeWidth(width: unknown): width is Stroke['width'] {
  return [2, 5, 8, 14, 28].includes(width as number);
}

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

export const pageByteLimit = 1024 * 1024;

export function preparePage(page: Page): Page {
  if (!isValidPageId(page)) {
    throw new Error('페이지의 날짜, 아이와 작성자는 바꿀 수 없어요.');
  }
  const result = {
    ...page,
    drawing: page.drawing.map((stroke) => {
      if (!isStrokeWidth(stroke.width)) {
        throw new Error('그림 도구의 굵기를 확인해 주세요.');
      }
      // Keep detail captured at up to 4× zoom, including across repeated saves.
      return simplifyStroke(stroke, 4096, 3276.8);
    }),
  };
  // 2026-11-18: 200 KB stopped a detailed iPad drawing; 1 MB (DB allows 4 MB, migration 20261118000000).
  if (new Blob([JSON.stringify(result)]).size > pageByteLimit) {
    throw new Error('그림이 너무 커서 저장할 수 없어요. 일부를 지워 주세요');
  }
  return structuredClone(result);
}
