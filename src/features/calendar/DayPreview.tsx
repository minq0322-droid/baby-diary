import type { DataStore } from '../../data/DataStore';
import type { StoreSnapshot } from '../../data/types';
import { PageCard } from '../archive/PageCard';

type Props = {
  store: DataStore;
  snapshot: StoreSnapshot;
  date: string;
  openPage: (date: string, childId: string, authorId?: 'dad' | 'mom') => void;
};

export function DayPreview({ store, snapshot, date, openPage }: Props) {
  return (
    <div className="day-preview">
      <h2>{date.replace(/-/g, '. ')} 기록</h2>
      <div className="preview-kids">
        {snapshot.children.flatMap((child) => {
          const pages = snapshot.pages.filter(
            (page) => page.date === date && page.childId === child.id,
          );
          return (pages.length ? pages : [undefined]).map((page) => (
            <PageCard
              store={store}
              key={page?.id ?? child.id}
              child={child}
              page={page}
              onClick={() => openPage(date, child.id, page?.authorId)}
            />
          ));
        })}
      </div>
      {!snapshot.pages.some((page) => page.date === date) && (
        <p className="empty-results">이 날의 기록을 남겨보세요.</p>
      )}
    </div>
  );
}
