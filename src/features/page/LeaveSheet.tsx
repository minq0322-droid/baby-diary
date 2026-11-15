import { DiarySheet } from './DiarySheet';

// 2026-11-14: 저장하지 않고 나갈 때. 바깥·Esc 는 그대로 머문다.
// 2026-11-15 (작가): 「저장 안 하고 나가기」는 정말 저장하지 않는다 — 자동 저장된 것까지 연 때 모습으로 되돌린다.
export function LeaveSheet({ canSave, onSave, onDiscard, onStay }: {
  canSave: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onStay: () => void;
}) {
  return (
    <DiarySheet title="고친 내용을 저장할까요?" onClose={onStay} closeLabel="계속 쓰기">
      <p className="leave-note">저장하지 않으면 이 장을 열었을 때 모습으로 돌아가요.</p>
      <div className="leave-choices">
        {canSave && <button className="primary" onClick={onSave}>저장하고 나가기</button>}
        <button className="danger" onClick={onDiscard}>저장 안 하고 나가기</button>
      </div>
    </DiarySheet>
  );
}
