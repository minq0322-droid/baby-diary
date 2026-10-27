import type { DataStore } from '../data/DataStore';

export function SyncBanner({ store }: { store: DataStore }) {
  if (store.syncState !== 'retrying' && store.syncState !== 'error')
    return null;
  return (
    <div className="sync-banner" role="alert">
      <span>
        {store.errorMessage ||
          '저장하지 못했어요. 변경 내용을 유지하고 있어요.'}
      </span>
      {store.retry && (
        <button type="button" onClick={() => store.retry?.()}>
          다시 시도
        </button>
      )}
    </div>
  );
}
