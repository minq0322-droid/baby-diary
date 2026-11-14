import { useSyncExternalStore } from 'react';
import type { CSSProperties } from 'react';
import { pageColorStyle } from './pageColors';
import { useLook } from './look';

function isDark() {
  const theme = document.documentElement.dataset.theme;
  return theme === 'dark' || (theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const media = matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener('change', onChange);
  };
}

export function useDarkMode() {
  return useSyncExternalStore(subscribe, isDark, () => false);
}

// 모던 테마: 도화지는 아이별 색이 아니라 테마 색(--paper)으로 고정 (2026-11-14 작가).
const modernPaper = { '--page-color': 'var(--paper)', '--page-ink': 'var(--paper-ink)' } as CSSProperties;

export function usePageColorStyle(color: string) {
  const dark = useDarkMode();
  const look = useLook();
  return look === 'modern' ? modernPaper : pageColorStyle(color, dark);
}
