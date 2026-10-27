import { describe, expect, it } from 'vitest';
import { clampCrop } from './crop';

describe('원형 프로필 크롭 경계', () => {
  it('가로 사진의 빈 공간을 막고 이동 범위를 제한한다', () => {
    expect(
      clampCrop({ width: 1200, height: 600 }, { zoom: 1, x: 999, y: 999 }),
    ).toEqual({ zoom: 1, x: 240, y: 0 });
  });
  it('세로 사진에서 최소 확대를 보장한다', () => {
    expect(
      clampCrop({ width: 600, height: 1200 }, { zoom: 0.2, x: -999, y: -999 }),
    ).toEqual({ zoom: 1, x: -0, y: -240 });
  });
  it('최대 확대에서도 1024px 출력에 빈 여백이 생기지 않는다', () => {
    const image = { width: 1200, height: 600 };
    const crop = clampCrop(image, { zoom: 9, x: -99999, y: 99999 });
    const scale = Math.max(480 / image.width, 480 / image.height) * crop.zoom;
    expect(crop.zoom).toBe(3);
    expect(240 + crop.x - (image.width * scale) / 2).toBeLessThanOrEqual(0);
    expect(240 + crop.x + (image.width * scale) / 2).toBeGreaterThanOrEqual(
      480,
    );
    expect(240 + crop.y - (image.height * scale) / 2).toBeLessThanOrEqual(0);
    expect(240 + crop.y + (image.height * scale) / 2).toBeGreaterThanOrEqual(
      480,
    );
  });
});
