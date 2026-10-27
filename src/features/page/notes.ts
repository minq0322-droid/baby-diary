import type { Page } from '../../data/types';
export function writeNote(
  page: Page,
  authorId: 'dad' | 'mom',
  text: string,
  now: string,
): Page {
  if (page.authorId !== authorId) return page;
  return { ...page, text, updatedAt: now };
}
