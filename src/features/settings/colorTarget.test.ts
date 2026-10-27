import { describe, expect, it } from 'vitest';
import { seedChildren } from '../../data/seed';
import { colorTarget } from './colorTarget';

describe('페이지 색 적용 대상', () => {
  it('전체는 아이 ID 없이 적용한다', () => {
    expect(colorTarget('all', seedChildren)).toEqual({
      childId: undefined,
      label: '전체',
    });
  });
  it('선택한 아이의 ID와 이름을 사용한다', () => {
    for (const child of seedChildren) {
      expect(colorTarget(child.id, seedChildren)).toEqual({
        childId: child.id,
        label: child.name,
      });
    }
  });
  it('없는 아이를 전체로 처리하지 않는다', () => {
    expect(() => colorTarget('missing', seedChildren)).toThrow();
  });
});
