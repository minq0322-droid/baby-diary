import { useEffect, useState } from 'react';
import type { DataStore } from '../../data/DataStore';
import type { SupabaseStore } from '../../data/supabaseStore';

type FamilyStore = Pick<SupabaseStore, 'isOwner' | 'createInvite' | 'storageUsage'>;
function hasFamily(store: DataStore): store is DataStore & FamilyStore {
  return 'createInvite' in store && 'storageUsage' in store && 'isOwner' in store;
}
export function FamilySettings({ store }: { store: DataStore }) {
  if (!hasFamily(store) || !store.isOwner) return null;
  return <OwnerFamily store={store} />;
}
function OwnerFamily({ store }: { store: FamilyStore }) {
  const [bytes, setBytes] = useState<number>();
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let active = true;
    void store.storageUsage().then((value) => { if (active) setBytes(value); })
      .catch(() => { if (active) setError('저장 공간을 확인하지 못했어요. 다시 열어 주세요.'); });
    return () => { active = false; };
  }, [store]);
  async function create(memberId: string, replace = false) {
    setBusy(true);
    setError('');
    setLink('');
    setCopied(false);
    try {
      setLink(await store.createInvite(memberId, replace));
    } catch {
      setError('링크를 만들지 못했어요. 연결을 확인하고 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="settings-group">
      <h2>가족</h2>
      <div className="settings-list family-settings">
        {(['mom', 'dad'] as const).map((id) => (
          <div key={id}>
            <button type="button" className="secondary-btn" disabled={busy} onClick={() => void create(id)}>
              {id === 'mom' ? '엄마 초대 링크 만들기' : '아빠 기기 추가 링크 만들기'}
            </button>
            <button type="button" className="text-btn" disabled={busy} onClick={() => void create(id, true)}
              aria-label={(id === 'mom' ? '엄마' : '아빠') + ' 링크 다시 만들기(예전 기기 막기)'}>
              링크 다시 만들기(예전 기기 막기)
            </button>
          </div>
        ))}
        <p>링크를 다시 만들면 해당 가족의 예전 링크와 다른 기기의 접근을 막아요. 지금 쓰는 기기는 유지돼요.</p>
        <button type="button" className="text-btn" disabled={busy} onClick={() => void create('reader')}>백업 읽기 전용 링크 만들기</button>
        {link && <div>
          <label>초대 링크<input className="family-link" readOnly value={link} onFocus={(event) => event.target.select()} /></label>
          <button type="button" className="secondary-btn" onClick={() => {
            void navigator.clipboard.writeText(link).then(() => setCopied(true))
              .catch(() => setError('링크를 길게 눌러 복사해 주세요.'));
          }}>{copied ? '복사했어요' : '복사'}</button>
          <p>이 링크는 열쇠예요. 가족에게만 보내 주세요</p>
        </div>}
        <p>{bytes === undefined ? '사진 저장 공간 확인 중…' : '사진 저장 공간 ' + (bytes / 1_000_000_000).toFixed(2) + ' GB / 1 GB'}</p>
        {bytes !== undefined && bytes >= 800_000_000 && <p role="status">사진 저장 공간이 많이 찼어요. 백업한 사진을 확인하며 공간을 정리해 주세요.</p>}
        {error && <p role="alert">{error}</p>}
      </div>
    </section>
  );
}
