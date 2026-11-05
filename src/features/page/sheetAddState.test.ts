import { describe, expect, it } from 'vitest';
import { getSheetAddState } from './sheetAddState';

const base = {
  ownPage: true,
  readOnly: false,
  currentSaved: true,
  dirty: false,
  hasContent: true,
};

describe('sheet add state', () => {
  it.each([
    ['ready', base],
    ['save-first', { ...base, dirty: true }],
    ['save-first', { ...base, currentSaved: false }],
    ['blank', { ...base, hasContent: false }],
    ['hidden', { ...base, ownPage: false }],
    ['hidden', { ...base, readOnly: true }],
  ])('%s', (expected, input) => expect(getSheetAddState(input)).toBe(expected));
});
