import { describe, expect, it } from 'vitest';
import { shouldReloadOnControllerChange } from './appUpdate';

describe('service worker reload decision', () => {
  it('reloads only for an existing controlled page without unsaved edits', () => {
    expect(shouldReloadOnControllerChange(true, false, false)).toBe(true);
    expect(shouldReloadOnControllerChange(false, false, false)).toBe(false);
    expect(shouldReloadOnControllerChange(true, true, false)).toBe(false);
    expect(shouldReloadOnControllerChange(true, false, true)).toBe(false);
  });
});
