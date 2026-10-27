import type { DataStore } from '../../data/DataStore';
import { usePageColorStyle } from '../../lib/usePageColorStyle';
import type { Page, Child } from '../../data/types';
import { StrokePreview } from '../../components/StrokePreview';
import { Icon } from '../../components/Icon';
export function PageCard({
  page,
  child,
  store,
  onClick,
}: {
  store: DataStore;
  page?: Page;
  child: Child;
  onClick: () => void;
}) {
  const note = page?.text.split('\n')[0] ?? '';
  return (
    <button
      type="button"
      className="page-card page-color"
      style={usePageColorStyle(page?.color ?? child.pageColor)}
      onClick={onClick}
    >
      <StrokePreview store={store} page={page} className="drawing-preview" />
      <span className="card-label">
        <small>
          {page?.date.replace(/-/g, '. ')} · {child.name}
          {page && ` · ${page.authorId === 'dad' ? '아빠' : '엄마'}`}
        </small>
        <span>{note || '아직 기록이 없어요'}</span>
      </span>
      {page?.tagIds[0] && (
        <span className="mini-badge">
          <Icon name="star" />
        </span>
      )}
    </button>
  );
}
