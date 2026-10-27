import { describe, expect, it } from 'vitest';
import { BOOK, bookFilename, fitTextPages, mmToPx, wrapText } from './bookLayout';

describe('book layout', () => {
  it('rounds A5 millimetres to 300 dpi pixels', () => {
    expect(BOOK).toEqual({ width: 1748, height: 2480 });
    expect(mmToPx(25.4)).toBe(300);
    expect(mmToPx(25.4, 150)).toBe(150);
  });
  it('keeps Korean names and separates both parents on the same date', () => {
    expect(bookFilename('2026-10-26', '조비안', '엄마')).toBe(
      '2026-10-26_조비안_엄마.png',
    );
    expect(bookFilename('2026-10-26', '조비안', '아빠')).toBe(
      '2026-10-26_조비안_아빠.png',
    );
    expect(bookFilename('2026-10-26', '../또이', '아빠')).toBe(
      '2026-10-26_..-또이_아빠.png',
    );
  });
  it('wraps long Korean words and preserves blank paragraphs', () => {
    const context = {
      measureText: (text: string) =>
        ({ width: [...text].length * 10 }) as TextMetrics,
    };
    expect(wrapText(context, '우리아이일기\n\n하루', 30)).toEqual([
      '우리아',
      '이일기',
      '',
      '하루',
    ]);
  });
  it('splits text that still overflows at 80% into continuation pages', () => {
    const result = fitTextPages(Array.from({ length: 20 }, (_, i) => `line ${i}`), 68, 500);
    expect(result.size).toBe(54);
    expect(result.pages.length).toBeGreaterThan(1);
    expect(result.pages.flat()).toHaveLength(20);
  });
});
