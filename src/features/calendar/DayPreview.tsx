import type { DataStore } from '../../data/DataStore';
import type { StoreSnapshot } from '../../data/types';
import { PageCard } from '../archive/PageCard';
import { ArchiveListRow } from '../archive/ArchiveListRow';
import { ArchiveViewToggle, useArchiveView } from '../archive/archiveView';
import { fromKey } from '../../lib/date';

type Props = {
  store: DataStore;
  snapshot: StoreSnapshot;
  date: string;
  openPage: (date: string, childId: string, authorId?: 'dad' | 'mom') => void;
};

export function DayPreview({ store, snapshot, date, openPage }: Props) {
  const [list, toggleView] = useArchiveView(store.getCurrentMemberId());
  const selected = fromKey(date);
  return (
    <div className="day-preview">
      <div className="day-preview-heading">
        <h2>
          <time dateTime={date}>
            {selected.getMonth() + 1}월 {selected.getDate()}일{' '}
            {'일월화수목금토'[selected.getDay()]}
          </time>
        </h2>
        <ArchiveViewToggle list={list} onToggle={toggleView} />
      </div>
      <div className={list ? 'archive-list' : 'preview-kids'}>
        {snapshot.children.flatMap((child) => {
          const pages = snapshot.pages.filter(
            (page) => page.date === date && page.childId === child.id,
          );
          return (pages.length ? pages : [undefined]).map((page) => {
            if (!list) {
              return (
                <PageCard
                  store={store}
                  key={page?.id ?? child.id}
                  child={child}
                  page={page}
                  onClick={() => openPage(date, child.id, page?.authorId)}
                />
              );
            }
            return page ? (
              <ArchiveListRow
                key={page.id}
                page={page}
                child={child}
                showDate={false}
                onClick={() => openPage(date, child.id, page.authorId)}
              />
            ) : (
              <button
                type="button"
                key={child.id}
                className="archive-list-row calendar-empty-row"
                onClick={() => openPage(date, child.id)}
              >
                ＋ {child.name} 기록하기
              </button>
            );
          });
        })}
      </div>
      {!snapshot.pages.some((page) => page.date === date) && (
        <p className="empty-results">이 날의 기록을 남겨보세요.</p>
      )}
    </div>
  );
}
