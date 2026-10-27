import type { DataStore } from '../../data/DataStore';
import { usePageColorStyle } from '../../lib/usePageColorStyle';
import type { Page, Child } from '../../data/types';
import { dayCounter } from '../../lib/date';
import { StrokePreview } from '../../components/StrokePreview';
import { Icon } from '../../components/Icon';
export function KidCard({
  child,
  page,
  store,
  date,
  onClick,
}: {
  store: DataStore;
  child: Child;
  page?: Page;
  date: string;
  onClick: () => void;
}) {
  const author =
    page?.authorId === 'dad' ? '아빠' : page?.authorId === 'mom' ? '엄마' : '';
  return (
    <button
      type="button"
      className="kid-card page-color"
      style={usePageColorStyle(page?.color ?? child.pageColor)}
      onClick={onClick}
    >
      <StrokePreview store={store} page={page} className="kid-art" />
      <strong>{child.name}</strong>
      <small>{dayCounter(child, date)}</small>
      <span className="kid-status">
        {page ? `기록 완료${author ? ` · ${author}` : ''}` : '아직 안 썼어요'}
        <Icon name="arrow" />
      </span>
    </button>
  );
}
