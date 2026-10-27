import type { Child, Page } from '../../data/types';
import { displayColor, inkFor } from '../../lib/pageColors';

export function dayFillSegments(
  date: string,
  pages: Pick<Page, 'date' | 'childId'>[],
  children: Pick<Child, 'id' | 'pageColor'>[],
  dark: boolean,
) {
  const recorded = new Set(
    pages.filter((page) => page.date === date).map((page) => page.childId),
  );
  return children.filter((child) => recorded.has(child.id)).map((child) => {
    const color = displayColor(child.pageColor, dark);
    return { childId: child.id, color, ink: inkFor(color) };
  });
}
