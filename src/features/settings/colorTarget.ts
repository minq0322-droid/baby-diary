import type { Child } from '../../data/types';

export function colorTarget(target: string, children: Child[]) {
  const child = children.find((item) => item.id === target);
  if (target !== 'all' && !child) throw new Error('아이를 다시 골라 주세요.');
  return { childId: child?.id, label: child?.name ?? '전체' };
}
