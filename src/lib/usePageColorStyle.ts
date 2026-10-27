import { useSyncExternalStore } from 'react';
import { pageColorStyle } from './pageColors';

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

export function usePageColorStyle(color: string) {
  return pageColorStyle(color, useDarkMode());
}
