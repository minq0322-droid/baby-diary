import { useSyncExternalStore } from 'react';

// 2026-11-14 (작가): 지금 테마는 전부 그림 컨셉 — 깔끔하고 모던한 테마 둘(모던 낮 · 모던 밤)을 더한다.
// 모던에서는 도화지가 아이별 색 대신 테마 색으로 고정되고, 손글씨 대신 Pretendard.
// 저장된 기록(페이지 색 등)은 그대로 두고 보이는 모습만 바꾼다. html[data-look="modern"].
export type Look = 'drawing' | 'modern';
export type ThemeChoice = 'drawing' | 'modern-day' | 'modern-night';

const KEY = 'yuga-look';

export function readLook(storage: Pick<Storage, 'getItem'> | undefined = safeStorage()): Look {
  try {
    return storage?.getItem(KEY) === 'modern' ? 'modern' : 'drawing';
  } catch {
    return 'drawing';
  }
}

function safeStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export function applyLook(look: Look) {
  if (look === 'modern') document.documentElement.dataset.look = 'modern';
  else delete document.documentElement.dataset.look;
  try {
    localStorage.setItem(KEY, look);
  } catch {
    // Keep the look for this session.
  }
}

/** What 설정 › 화면 shows as chosen, from the look and the explicit light/dark theme. */
export function themeChoice(look: Look, theme: string | undefined): ThemeChoice {
  if (look !== 'modern') return 'drawing';
  return theme === 'dark' ? 'modern-night' : 'modern-day';
}

/** The look and light/dark theme a choice stands for (the drawing look keeps its own light/dark). */
export function choiceToLook(choice: ThemeChoice): { look: Look; theme?: 'light' | 'dark' } {
  if (choice === 'modern-day') return { look: 'modern', theme: 'light' };
  if (choice === 'modern-night') return { look: 'modern', theme: 'dark' };
  return { look: 'drawing' };
}

function current(): Look {
  return document.documentElement.dataset.look === 'modern' ? 'modern' : 'drawing';
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-look'] });
  return () => observer.disconnect();
}

export function useLook() {
  return useSyncExternalStore(subscribe, current, () => 'drawing' as Look);
}
