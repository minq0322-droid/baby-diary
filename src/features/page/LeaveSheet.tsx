import { DiarySheet } from './DiarySheet';

// 2026-11-14: 저장하지 않고 나갈 때 — 저장하고 / 임시로 두고 / 버리고. 바깥·Esc 는 그대로 머문다.
export function LeaveSheet({ canSave, onSave, onKeep, onDiscard, onStay }: {
  canSave: boolean;
  onSave: () => void;
  onKeep: () => void;
  onDiscard: () => void;
  onStay: () => void;
}) {
  return (
    <DiarySheet title="아직 저장하지 않았어요" onClose={onStay} closeLabel="계속 쓰기">
      <p className="leave-note">그림과 글은 이 기기에 임시로 남아 있어요.</p>
      <div className="leave-choices">
        {canSave && <button className="primary" onClick={onSave}>저장하고 나가기</button>}
        <button onClick={onKeep}>임시로 두고 나가기</button>
        <button className="danger" onClick={onDiscard}>버리고 나가기</button>
      </div>
    </DiarySheet>
  );
}
