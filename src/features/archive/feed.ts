import type { Page } from '../../data/types';

// 2026-11-15 (작가): 기록 = 인스타그램처럼 위에서 아래로 넘겨 보는 피드. 최신 날짜가 위, 같은 날은 나중에 쓴 장이 위.
export type FeedDay = { date: string; pages: Page[] };

export function feedOrder(pages: Page[]): Page[] {
  return [...pages].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
}

/** Consecutive pages of one date share a sticky day header. Pages must already be in feed order. */
export function groupByDay(pages: Page[]): FeedDay[] {
  const days: FeedDay[] = [];
  for (const page of pages) {
    const last = days[days.length - 1];
    if (last?.date === page.date) last.pages.push(page);
    else days.push({ date: page.date, pages: [page] });
  }
  return days;
}

/** The date key exactly one year before (29 Feb has none). */
export function yearAgoKey(today: string): string | undefined {
  const [year, month, day] = today.split('-');
  if (month === '02' && day === '29') return undefined;
  return `${Number(year) - 1}-${month}-${day}`;
}

/** Pieceful 의 「1년 전 오늘」: 꼭 1년 전 같은 날 쓴 장 중 먼저 쓴 것. */
export function yearAgoPage(pages: Page[], today: string): Page | undefined {
  const key = yearAgoKey(today);
  if (!key) return undefined;
  return pages
    .filter((page) => page.date === key)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
}

/** 오후 8:05 */
export function clockLabel(iso: string): string {
  const time = new Date(iso);
  if (Number.isNaN(time.getTime())) return '';
  const hours = time.getHours();
  const minutes = String(time.getMinutes()).padStart(2, '0');
  return `${hours < 12 ? '오전' : '오후'} ${hours % 12 || 12}:${minutes}`;
}
