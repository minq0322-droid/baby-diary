import type { DataStore } from '../../data/DataStore';
import type { Member } from '../../data/types';

export function MemberPicker({
  store,
  members,
}: {
  store: DataStore;
  members: Member[];
}) {
  return (
    <div className="artifact-welcome">
      <h2>누가 쓰고 있나요?</h2>
      {members
        .filter((member) => member.id === 'dad' || member.id === 'mom')
        .map((member) => (
          <button
            className="primary-btn"
            key={member.id}
            type="button"
            onClick={() => store.setCurrentMemberId(member.id)}
          >
            나는 {member.displayName}
          </button>
        ))}
    </div>
  );
}
