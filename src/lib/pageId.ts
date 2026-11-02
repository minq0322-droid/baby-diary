import type { Page } from '../data/types';

export function basePageId(
  date: string,
  childId: string,
  authorId: Page['authorId'],
): string {
  return `${date}__${childId}__${authorId}`;
}

export function newSheetId(
  date: string,
  childId: string,
  authorId: Page['authorId'],
): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  // Rejection sampling keeps all 36 characters equally likely.
  while (suffix.length < 8) {
    for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
      if (byte < 252 && suffix.length < 8) suffix += alphabet[byte % 36];
    }
  }
  return `${basePageId(date, childId, authorId)}__${suffix}`;
}

export function isValidPageId(
  page: Pick<Page, 'id' | 'date' | 'childId' | 'authorId'>,
): boolean {
  if (
    typeof page.id !== 'string' ||
    typeof page.date !== 'string' ||
    page.date.length !== 10 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(page.date) ||
    typeof page.childId !== 'string' ||
    !page.childId ||
    !['dad', 'mom'].includes(page.authorId)
  )
    return false;
  const base = basePageId(page.date, page.childId, page.authorId);
  return (
    page.id === base ||
    (page.id.length === base.length + 10 &&
      page.id.startsWith(base + '__') &&
      /^[a-z0-9]{8}$/.test(page.id.slice(base.length + 2)))
  );
}

export function sheetsFor(
  pages: Page[],
  date: string,
  childId: string,
  authorId: string,
): Page[] {
  return pages
    .filter(
      (page) =>
        page.date === date &&
        page.childId === childId &&
        page.authorId === authorId,
    )
    .sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    );
}
