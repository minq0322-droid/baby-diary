import { useEffect, useRef, useState } from 'react';
import type { Page } from '../../data/types';
import { registerDraftFlush, writeDraft } from '../../lib/draft';

export type DraftStatus = 'idle' | 'saved' | 'failed';

// 2026-11-14: 획을 하나 끝낼 때·글을 칠 때(0.4초 모아서)·앱을 내리거나 닫을 때 이 기기에 임시 저장한다.
export function useDraftAutosave({ page, baseUpdatedAt, active }: {
  page: Page;
  /** The stored page's updatedAt (null if never stored). */
  baseUpdatedAt: string | null;
  /** Only the writer's own page with unsaved edits. */
  active: boolean;
}) {
  const [status, setStatus] = useState<DraftStatus>('idle');
  // The page object at the last save/discard: until the page changes again, nothing is written.
  const settledPage = useRef<Page>();
  const on = active && page !== settledPage.current;
  const latest = useRef({ page, baseUpdatedAt, active: on });
  latest.current = { page, baseUpdatedAt, active: on };
  const flush = useRef(() => {
    const { page: current, baseUpdatedAt: base, active: writing } = latest.current;
    if (!writing) return;
    setStatus(writeDraft(current, base) ? 'saved' : 'failed');
  });
  useEffect(() => {
    if (!on) return;
    const timer = window.setTimeout(flush.current, 400);
    return () => window.clearTimeout(timer);
  }, [page, on]);
  useEffect(() => {
    const now = () => flush.current();
    const hidden = () => {
      if (document.visibilityState === 'hidden') now();
    };
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', now);
    document.addEventListener('freeze', now);
    const unregister = registerDraftFlush(now);
    return () => {
      // Leaving the page screen with edits still pending: keep them.
      now();
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', now);
      document.removeEventListener('freeze', now);
      unregister();
    };
  }, []);
  /** After a save or a discard: stop writing (so leaving does not write a stale draft back). */
  const settle = () => {
    settledPage.current = latest.current.page;
    latest.current = { ...latest.current, active: false };
    setStatus('idle');
  };
  return { status: on ? status : ('idle' as DraftStatus), settle };
}
