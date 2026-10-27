import { expect, it } from 'vitest';
import { writeNote } from './notes';
import { page } from '../../data/testDb';
it('updates only the current author page and keeps drawing data', () => {
  const value = page();
  expect(writeNote(value, 'dad', '새 기록', 'now')).toMatchObject({
    text: '새 기록',
    authorId: 'dad',
    updatedAt: 'now',
  });
  expect(writeNote(value, 'mom', '다른 작성자', 'now')).toBe(value);
  expect(value.text).toBe('오늘 기록');
});
