import { useState } from 'react';
import type { DataStore } from '../../data/DataStore';
import type { Tag } from '../../data/types';

type Props = { store: DataStore; tags: Tag[] };

export function BadgeManager({ store, tags }: Props) {
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('⭐');
  const ordered = [...tags].sort((a, b) => a.sortOrder - b.sortOrder);
  const move = (index: number, delta: number) => {
    const ids = ordered.map((tag) => tag.id);
    [ids[index], ids[index + delta]] = [ids[index + delta], ids[index]];
    store.reorderTags(ids);
  };

  return (
    <div className="tag-editor">
      {ordered.map((tag, index) => (
        <div className="tag-edit-row" key={tag.id}>
          <span aria-hidden="true">{tag.emoji}</span>
          <input
            className="tag-label-input"
            aria-label={`${tag.label} 배지 이름`}
            defaultValue={tag.label}
            onBlur={(event) => {
              const value = event.target.value.trim();
              if (value) store.updateTag({ ...tag, label: value });
              else event.target.value = tag.label;
            }}
          />
          <button
            type="button"
            aria-label={`${tag.label} 위로`}
            disabled={index === 0}
            onClick={() => move(index, -1)}
          >
            ↑
          </button>
          <button
            type="button"
            aria-label={`${tag.label} 아래로`}
            disabled={index === ordered.length - 1}
            onClick={() => move(index, 1)}
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() =>
              tag.preset
                ? store.updateTag({ ...tag, hidden: !tag.hidden })
                : store.deleteTag(tag.id)
            }
          >
            {tag.preset ? (tag.hidden ? '표시' : '숨기기') : '삭제'}
          </button>
        </div>
      ))}
      <form
        className="tag-add"
        onKeyDown={(event) => {
          if (event.key === 'Enter' && event.nativeEvent.isComposing)
            event.preventDefault();
        }}
        onSubmit={(event) => {
          event.preventDefault();
          if (!label.trim()) return;
          store.createTag({
            id: crypto.randomUUID(),
            label: label.trim(),
            emoji: emoji.trim() || '⭐',
            tone: 'first',
            preset: false,
            sortOrder: Math.max(-1, ...tags.map((tag) => tag.sortOrder)) + 1,
          });
          setLabel('');
        }}
      >
        <input
          aria-label="새 배지 이모지"
          value={emoji}
          onChange={(event) => setEmoji(event.target.value)}
        />
        <input
          aria-label="새 배지 이름"
          placeholder="배지 이름"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />
        <button type="submit" className="primary-btn" disabled={!label.trim()}>
          배지 추가
        </button>
      </form>
    </div>
  );
}
