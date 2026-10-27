import { describe, expect, it } from 'vitest';
import type { Page } from '../../data/types';
import { writtenDays } from './history';

const page = (
  date: string,
  childId: string,
  authorId: 'dad' | 'mom',
): Page => ({
  id: `${date}__${childId}__${authorId}`,
  date,
  childId,
  authorId,
  drawing: [],
  photos: [],
  text: '오늘의 기록',
  tagIds: [],
  createdAt: '',
  updatedAt: '',
});
describe('홈의 최근 30일', () => {
  it('오늘부터 과거 순서로 표시하고 두 부모의 기록은 하루로 센다', () => {
    const days = writtenDays(
      {
        pages: [
          page('2026-10-26', 'kid1', 'mom'),
          page('2026-10-26', 'kid1', 'dad'),
          page('2026-10-25', 'kid1', 'dad'),
        ],
      },
      'kid1',
      '2026-10-26',
    );
    expect(days).toHaveLength(30);
    expect(days.slice(0, 3)).toEqual([true, true, false]);
    expect(days.filter(Boolean)).toHaveLength(2);
  });
  it('29일 전은 포함하고 30일 전, 미래, 다른 아이는 제외한다', () => {
    const days = writtenDays(
      {
        pages: [
          page('2026-09-27', 'kid1', 'dad'),
          page('2026-09-26', 'kid1', 'mom'),
          page('2026-10-27', 'kid1', 'mom'),
          page('2026-10-26', 'kid2', 'dad'),
        ],
      },
      'kid1',
      '2026-10-26',
    );
    expect(days[29]).toBe(true);
    expect(days[0]).toBe(false);
    expect(days.filter(Boolean)).toHaveLength(1);
  });
});
