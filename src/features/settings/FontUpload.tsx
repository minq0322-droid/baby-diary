import { useState } from 'react';
import type { DataStore } from '../../data/DataStore';
import type { Member } from '../../data/types';

type Props = {
  store: DataStore;
  member: Member;
  notify: (message: string) => void;
};

export function FontUpload({ store, member, notify }: Props) {
  const [busy, setBusy] = useState(false);
  const disabled =
    busy ||
    store.readOnly ||
    (store.canSwitchMember === false &&
      member.id !== store.getCurrentMemberId());

  return (
    <div className="font-upload">
      <label className="setting">
        <span>
          {member.displayName}
          <small>
            {member.fontAssetId ? '내 글씨체 사용 중' : '기본 손글씨'}
          </small>
        </span>
        <input
          type="file"
          aria-label={`${member.displayName} 글씨체 올리기`}
          accept={store.canSwitchMember === false ? ".woff2,.ttf" : ".woff,.woff2,.ttf,.otf"}
          disabled={disabled}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            setBusy(true);
            try {
              const font = new FontFace(
                'FontValidation',
                await file.arrayBuffer(),
              );
              await font.load();
              const { src } = await store.uploadFont(file);
              store.updateMember({ ...member, fontAssetId: src });
              notify('글씨체를 저장했어요');
            } catch {
              notify('글씨체 파일과 저장 연결을 확인해 주세요');
            } finally {
              setBusy(false);
            }
          }}
        />
      </label>
      {member.fontAssetId && (
        <button
          className="text-btn"
          type="button"
          disabled={disabled}
          onClick={() => {
            store.updateMember({ ...member, fontAssetId: undefined });
            notify('기본 손글씨로 되돌렸어요');
          }}
        >
          되돌리기
        </button>
      )}
    </div>
  );
}
