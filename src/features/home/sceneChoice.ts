import type { HomePreferences } from './preferences';

export type SceneChoice = HomePreferences['day'] | HomePreferences['night'];
export type Theme = 'system' | 'light' | 'dark';

export function chooseScene(scene: SceneChoice, preferences: HomePreferences) {
  if (scene === 'sunset' || scene === 'dandelion') {
    return { preferences: { ...preferences, day: scene }, theme: 'light' as const };
  }
  return { preferences: { ...preferences, night: scene }, theme: 'dark' as const };
}

// Shared with 설정 › 화면; storage failure must not prevent a theme change.
export function applyTheme(theme: Theme) {
  if (theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem('theme', theme);
  } catch {
    // Keep the selected theme for this session.
  }
}

export function recordHomeVisit(storage: Pick<Storage, 'getItem' | 'setItem'>): boolean {
  try {
    const raw = Number(storage.getItem('yuga-home-visits') ?? 0);
    const count = Number.isSafeInteger(raw) && raw >= 0 ? raw : 0;
    storage.setItem('yuga-home-visits', String(Math.min(3, count + 1)));
    return count < 3;
  } catch {
    return false;
  }
}
