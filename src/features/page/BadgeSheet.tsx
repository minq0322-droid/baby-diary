import { Icon } from '../../components/Icon';
import type { Tag } from '../../data/types';
import { DiarySheet } from './DiarySheet';
export function BadgeSheet({ tags, selected, readOnly, onChange, onClose }: {
  tags: Tag[];
  selected: string[];
  readOnly: boolean;
  onChange: (ids: string[]) => void;
  onClose: () => void;
}) {
  return <DiarySheet title="오늘의 배지" onClose={onClose}>
    <div className="badge-grid">
      {tags.filter((tag) => !tag.hidden || selected.includes(tag.id)).sort((a, b) => a.sortOrder - b.sortOrder).map((tag) => <button
        key={tag.id}
        className="sticker"
        aria-pressed={selected.includes(tag.id)}
        disabled={readOnly}
        onClick={() => onChange(selected.includes(tag.id) ? selected.filter((id) => id !== tag.id) : [...selected, tag.id])}>
        <span className="sticker-art"><Icon name={tag.tone} /></span>
        <span>{tag.label}</span>
      </button>)}
    </div><button className="sheet-done" onClick={onClose}>완료</button>
  </DiarySheet>;
}
