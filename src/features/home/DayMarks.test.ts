import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DayMarks } from './DayMarks';
describe('day history artwork', () => {
  for (const style of ['sunset', 'dandelion'] as const) {
    it(`${style} keeps 30 dated marks for empty, mixed, and full histories`, () => {
      for (const written of [0, 7, 30]) {
        const days = Array.from({
          length: 30
        }, (_, i) => i < written);
        const html = renderToStaticMarkup(createElement(DayMarks, {
          days,
          style
        }));
        expect(html.match(/class="day-mark"/g)).toHaveLength(30);
        if (style === 'sunset') {
          expect(html.match(/cy="-2.15"/g) ?? []).toHaveLength(written * 5);
          expect(html.match(/fill="#d0b5ad"/g) ?? []).toHaveLength(30 - written);
        } else {
          expect(html.match(/scale\(\.88\)/g) ?? []).toHaveLength(written);
          expect(html.match(/stroke-opacity="0.4"/g) ?? []).toHaveLength(30 - written);
        }
      }
    });
  }
});
