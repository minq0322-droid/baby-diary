// 2026-11-15 (작가): 로고 시안 세 개가 다 좋아서 홈 화면에 추가할 때 고르게 한다.
// 아이폰은 「홈 화면에 추가」 순간의 apple-touch-icon 을 쓰므로, 고른 아이콘으로 그 링크를 바꿔 둔다.
// 매니페스트(안드로이드 설치)는 바꿀 수 없어 기본 아이콘(두 장 한 권)을 쓴다.
export type AppIcon = 'book' | 'moon' | 'heart';

export const APP_ICONS: readonly { id: AppIcon; label: string }[] = [
  { id: 'book', label: '두 장 한 권' },
  { id: 'moon', label: '달과 별' },
  { id: 'heart', label: '크레파스 하트' },
];

const KEY = 'yuga-app-icon';

export function readAppIcon(storage: Pick<Storage, 'getItem'> | undefined = safeStorage()): AppIcon {
  try {
    const value = storage?.getItem(KEY);
    return APP_ICONS.some((icon) => icon.id === value) ? (value as AppIcon) : 'book';
  } catch {
    return 'book';
  }
}

function safeStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

export function iconHref(base: string, icon: AppIcon, size?: 180 | 192 | 512) {
  return `${base}icons/${icon}${size ? `-${size}.png` : '.svg'}`;
}

function setLink(rel: string, href: string) {
  let link = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.append(link);
  }
  link.href = href;
}

/** Points the home-screen and tab icons at the chosen logo; `save` also remembers it on this device. */
export function applyAppIcon(icon: AppIcon, base: string, save = true) {
  setLink('apple-touch-icon', iconHref(base, icon, 180));
  setLink('icon', iconHref(base, icon));
  if (!save) return;
  try {
    localStorage.setItem(KEY, icon);
  } catch {
    // Keep the icon for this session.
  }
}
