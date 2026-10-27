import { useSyncExternalStore } from 'react';
import { Icon } from '../../components/Icon';

const listeners = new Set<() => void>();
const fallback = new Map<string, boolean>();

export function readArchiveList(memberId: string): boolean {
  if (fallback.has(memberId)) return fallback.get(memberId)!;
  try {
    return localStorage.getItem(`archive-view:${memberId}`) !== 'cards';
  } catch {
    return fallback.get(memberId) ?? true;
  }
}

export function writeArchiveList(memberId: string, list: boolean) {
  try {
    localStorage.setItem(`archive-view:${memberId}`, list ? 'list' : 'cards');
    fallback.delete(memberId);
  } catch {
    // Keep switching available when browser storage is blocked.
    fallback.set(memberId, list);
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

export function useArchiveView(memberId: string) {
  const list = useSyncExternalStore(
    subscribe,
    () => readArchiveList(memberId),
    () => true,
  );
  return [list, () => writeArchiveList(memberId, !list)] as const;
}

export function ArchiveViewToggle({
  list,
  onToggle,
}: {
  list: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="archive-view-toggle"
      aria-label={list ? '카드로 보기' : '목록으로 보기'}
      aria-pressed={list}
      onClick={onToggle}
    >
      <Icon name={list ? 'cards' : 'list'} />
    </button>
  );
}
