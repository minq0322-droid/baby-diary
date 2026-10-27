import { useState } from 'react';
import type { DataStore } from '../../data/DataStore';
import type { Child } from '../../data/types';
import { Sheet } from '../../components/Sheet';
import { ProfilePhotoSheet } from '../home/ProfilePhotoSheet';
import { ColorPicker } from '../../components/ColorPicker';

type Props = { child: Child; store: DataStore; onClose: () => void };

export function ChildEditSheet({ child, store, onClose }: Props) {
  const [photoOpen, setPhotoOpen] = useState(false);
  const [draft, setDraft] = useState(child);
  const [born, setBorn] = useState(Boolean(child.birthDate) || child.status === 'born');
  const [dueDateUnknown, setDueDateUnknown] = useState(!child.dueDate);

  if (photoOpen)
    return (
      <ProfilePhotoSheet
        child={child}
        store={store}
        onClose={() => setPhotoOpen(false)}
      />
    );

  return (
    <Sheet title="아이 편집" onClose={onClose}>
      <form
        className="sheet-form"
        onKeyDown={(event) => {
          if (event.key === 'Enter' && event.nativeEvent.isComposing)
            event.preventDefault();
        }}
        onSubmit={(event) => {
          event.preventDefault();
          if (!draft.name.trim()) return;
          store.updateChild({
            ...draft,
            photo: child.photo,
            photoHistory: child.photoHistory,
            name: draft.name.trim(),
            nickname: draft.nickname?.trim(),
            birthDate: born ? draft.birthDate : undefined,
            dueDate: born || dueDateUnknown ? undefined : draft.dueDate,
            status: born ? 'born' : 'expecting',
          });
          onClose();
        }}
      >
        <button
          type="button"
          className="secondary-btn"
          onClick={() => setPhotoOpen(true)}
        >
          프로필 사진
        </button>
        <label>
          이름
          <input
            required
            value={draft.name}
            onChange={(event) =>
              setDraft({ ...draft, name: event.target.value })
            }
          />
        </label>
        <label>
          태명
          <input
            value={draft.nickname ?? ''}
            onChange={(event) =>
              setDraft({ ...draft, nickname: event.target.value })
            }
          />
        </label>
        <div className="segments" role="group" aria-label="아이 상태">
          <button
            type="button"
            aria-pressed={born}
            onClick={() => setBorn(true)}
          >
            태어남
          </button>
          <button
            type="button"
            aria-pressed={!born}
            onClick={() => setBorn(false)}
          >
            출산 전
          </button>
        </div>
        {born ? (
          <label>
            태어난 날
            <input
              type="date"
              value={draft.birthDate ?? ''}
              onChange={(event) =>
                setDraft({ ...draft, birthDate: event.target.value })
              }
            />
          </label>
        ) : (
          <label>
            출산 예정일
            <input
              type="date"
              disabled={dueDateUnknown}
              value={draft.dueDate ?? ''}
              onChange={(event) =>
                setDraft({ ...draft, dueDate: event.target.value || undefined })
              }
            />
            <label className="check-row">
              <input
                type="checkbox"
                checked={dueDateUnknown}
                onChange={(event) => {
                  setDueDateUnknown(event.target.checked);
                  if (event.target.checked)
                    setDraft({ ...draft, dueDate: undefined });
                }}
              />
              아직 미정
            </label>
          </label>
        )}
        <p className="meta">기본 페이지 색</p>
        <ColorPicker
          viewerId={store.getCurrentMemberId()}
          value={draft.pageColor}
          onChange={(pageColor) => setDraft({ ...draft, pageColor })}
        />
        <button
          className="primary-btn"
          type="submit"
          disabled={!draft.name.trim()}
        >
          저장
        </button>
      </form>
    </Sheet>
  );
}
