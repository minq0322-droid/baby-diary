import type { StoreSnapshot } from '../../data/types';
import { addDays } from '../../lib/date';

export function writtenDays(
  snapshot: Pick<StoreSnapshot, 'pages'>,
  childId: string,
  today: string,
) {
  const dates = new Set(
    snapshot.pages
      .filter((page) => page.childId === childId)
      .map((page) => page.date),
  );
  return Array.from({ length: 30 }, (_, day) =>
    dates.has(addDays(today, -day)),
  );
}
