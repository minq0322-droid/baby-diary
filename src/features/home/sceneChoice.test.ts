import { describe, expect, it } from 'vitest';
import { chooseScene, recordHomeVisit } from './sceneChoice';

describe('scene preference and theme mapping', () => {
  const preferences = { day: 'dandelion', night: 'lantern' } as const;
  it.each(['sunset', 'dandelion'] as const)('maps %s to light, retaining night', (scene) => {
    expect(chooseScene(scene, preferences)).toEqual({
      preferences: { day: scene, night: 'lantern' }, theme: 'light',
    });
    expect(preferences).toEqual({ day: 'dandelion', night: 'lantern' });
  });
  it.each(['moon', 'lantern'] as const)('maps %s to dark, retaining day', (scene) => {
    expect(chooseScene(scene, preferences)).toEqual({
      preferences: { day: 'dandelion', night: scene }, theme: 'dark',
    });
  });
});

describe('home discovery visits', () => {
  it('shimmers on exactly the first three visits and caps storage', () => {
    let saved: string | null = null;
    const storage = {
      getItem: () => saved,
      setItem: (_key: string, value: string) => { saved = value; },
    };
    expect(Array.from({ length: 5 }, () => recordHomeVisit(storage))).toEqual([true, true, true, false, false]);
    expect(saved).toBe('3');
  });
  it.each(['oops', '-1', '1.5', 'Infinity'])('recovers from invalid counter %s', (value) => {
    expect(recordHomeVisit({ getItem: () => value, setItem: () => { } })).toBe(true);
  });
  it('honors an existing device count', () => {
    expect(recordHomeVisit({ getItem: () => '3', setItem: () => { } })).toBe(false);
  });
  it('tolerates both read and write failures', () => {
    expect(recordHomeVisit({ getItem: () => { throw Error(); }, setItem: () => { } })).toBe(false);
    expect(recordHomeVisit({ getItem: () => null, setItem: () => { throw Error(); } })).toBe(false);
  });
});
