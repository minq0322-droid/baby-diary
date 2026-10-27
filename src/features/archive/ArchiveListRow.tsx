import type { Child, Page } from '../../data/types';
import { Icon } from '../../components/Icon';
import { fromKey } from '../../lib/date';

export function ArchiveListRow({
  page,
  child,
  showDate = true,
  onClick,
}: {
  page: Page;
  child: Child;
  showDate?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="archive-list-row" onClick={onClick}>
      <span className="archive-list-meta">
        {showDate && (
          <time dateTime={page.date}>
            {Number(page.date.slice(5, 7))}.{Number(page.date.slice(8))}{' '}
            {'일월화수목금토'[fromKey(page.date).getDay()]}
          </time>
        )}
        <strong>{child.name}</strong>
        <span>{page.authorId === 'mom' ? '엄마' : '아빠'}</span>
        {!!page.tagIds.length && (
          <span className="list-badge" aria-label="배지 있음">
            <Icon name="star" />
          </span>
        )}
      </span>
      <span className="archive-list-text">
        {page.text.split('\n')[0] || '글 없이 남긴 기록'}
      </span>
    </button>
  );
}
