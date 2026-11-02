import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import type { Note } from '../../data/types';
import { WritingArea } from './WritingArea';

const note: Note = {
  id: 'sheet',
  authorId: 'mom',
  text: '',
  createdAt: '2026-11-02T00:00:00Z',
  updatedAt: '2026-11-02T00:00:00Z',
};

it.each(['', ' \n '])('omits blank read-only paragraphs: %j', (text) => {
  const html = renderToStaticMarkup(
    createElement(WritingArea, {
      name: '조이',
      notes: [{ ...note, text }],
      editing: false,
      writer: 'dad',
      onText: () => undefined,
    }),
  );
  expect(html).not.toContain('<p');
  expect(html).not.toContain('class="initial"');
});

it('renders saved writing with the author initial and keeps an empty own editor available', () => {
  const html = renderToStaticMarkup(
    createElement(WritingArea, {
      name: '조이',
      notes: [{ ...note, text: '오늘도 사랑해' }],
      editing: false,
      writer: 'dad',
      onText: () => undefined,
    }),
  );
  expect(html).toContain('class="note mom-writing"');
  expect(html).toContain('오늘도 사랑해');
  expect(html).toContain('class="initial">엄</span>');
  const editor = renderToStaticMarkup(
    createElement(WritingArea, {
      name: '조이',
      notes: [{ ...note, authorId: 'dad' }],
      editing: true,
      writer: 'dad',
      onText: () => undefined,
    }),
  );
  expect(editor).toContain('<textarea');
  expect(editor).not.toContain('<p');
});
