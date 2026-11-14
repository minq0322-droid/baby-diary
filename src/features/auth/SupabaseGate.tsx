import { useState, useSyncExternalStore, type ReactNode } from 'react';
import type { SupabaseStore } from '../../data/supabaseStore';
import { inviteFailure, inviteRequired, inviteToken } from '../../data/familyAccess';

export function SupabaseGate({ store, children }: { store: SupabaseStore; children: ReactNode }) {
  const status = useSyncExternalStore(store.subscribe, store.getStatus, store.getStatus);
  const [text, setText] = useState('');
  const [wrong, setWrong] = useState(false);
  if (status.phase === 'ready') return <>{children}</>;
  const loading = status.phase === 'loading';
  const join = () => {
    const token = inviteToken(text);
    setWrong(!token);
    if (token) store.joinWith(token);
  };
  return (
    <main className="sign-in-page">
      <section className="card sign-in-card" aria-labelledby="sign-in-title">
        <h1 id="sign-in-title">육아 기록</h1>
        <p role="status">{loading ? '가족 기록을 불러오고 있어요' : status.message || inviteRequired}</p>
        {!loading && (
          <form
            className="invite-paste"
            onSubmit={(event) => {
              event.preventDefault();
              join();
            }}
          >
            <label htmlFor="invite-paste">초대 링크 붙여넣기</label>
            <input
              id="invite-paste"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setWrong(false);
              }}
              placeholder="https://…#join=…"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-invalid={wrong}
            />
            {wrong && (
              <p role="alert">
                {/^https?:\/\//.test(text.trim())
                  ? '이건 앱 주소예요. 끝에 「#join=」이 붙은 초대 링크가 필요해요. 설정 › 가족에서 만든 링크를 복사해 주세요.'
                  : '링크 전체를 붙여 넣어 주세요.'}
              </p>
            )}
            <button type="submit" className="primary-btn" disabled={!text.trim()}>
              들어가기
            </button>
            <p className="invite-paste-hint">
              홈 화면에 추가한 앱은 Safari와 따로 로그인돼요. Safari의 설정 › 가족에서 「아빠 기기 추가 링크」(엄마는 엄마 링크)를 만들어 복사한 뒤 여기에 붙여 넣어 주세요.
            </p>
          </form>
        )}
        {!loading && status.message !== inviteFailure && (
          <button type="button" className="text-btn" onClick={store.retry}>
            다시 시도
          </button>
        )}
      </section>
    </main>
  );
}
