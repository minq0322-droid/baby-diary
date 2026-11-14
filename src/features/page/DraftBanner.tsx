import { useState } from 'react';

// 2026-11-14: 다시 열었을 때 임시 저장된 그림·글을 되살렸다는 알림(또는 다른 기기에서 바뀐 뒤라 따로 남긴 임시 내용).
export function DraftBanner({ kind, onDiscard, onShowDraft }: {
  kind: 'restored' | 'conflict';
  onDiscard: () => void;
  onShowDraft: () => void;
}) {
  const [asking, setAsking] = useState(false);
  if (asking)
    return (
      <div className="draft-banner" role="alertdialog" aria-label="임시 내용 버리기">
        <span>{kind === 'restored' ? '되살린 내용을 버릴까요?' : '임시 내용을 버릴까요?'}</span>
        <button className="danger" onClick={onDiscard}>버리기</button>
        <button onClick={() => setAsking(false)}>취소</button>
      </div>
    );
  return (
    <div className="draft-banner" role="status">
      <span>{kind === 'restored' ? '저장 안 된 그림을 되살렸어요' : '다른 기기에서 바뀐 뒤의 임시 내용이 있어요'}</span>
      {kind === 'conflict' && <button onClick={onShowDraft}>임시 내용 보기</button>}
      <button onClick={() => setAsking(true)}>버리기</button>
    </div>
  );
}
