import { useSyncExternalStore, type ReactNode } from 'react';
import type { SupabaseStore } from '../../data/supabaseStore';
import { inviteFailure, inviteRequired } from '../../data/familyAccess';

export function SupabaseGate({ store, children }: { store: SupabaseStore; children: ReactNode }) {
  const status = useSyncExternalStore(store.subscribe, store.getStatus, store.getStatus);
  if (status.phase === 'ready') return <>{children}</>;
  return (
    <main className="sign-in-page">
      <section className="card sign-in-card" aria-labelledby="sign-in-title">
        <h1 id="sign-in-title">육아 기록</h1>
        <p role="status">{status.phase === 'loading' ? '가족 기록을 불러오고 있어요' : status.message || inviteRequired}</p>
        {status.phase !== 'loading' && status.message !== inviteFailure && (
          <button type="button" className="secondary-btn" onClick={store.retry}>다시 시도</button>
        )}
      </section>
    </main>
  );
}
