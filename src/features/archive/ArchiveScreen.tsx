import type { DataStore } from '../../data/DataStore';
import { useMemo, useState } from 'react';
import type { StoreSnapshot, Page } from '../../data/types';
import { PageCard } from './PageCard';
import { KidCard } from './KidCard';
import { SearchPill } from './SearchPill';
import { noteAuthor } from '../../data/migrate';
import { todayKey } from '../../lib/date';
import { Icon } from '../../components/Icon';
export function ArchiveScreen({
  snapshot,
  store,
  openPage,
  onBack,
}: {
  store: DataStore;
  snapshot: StoreSnapshot;
  openPage: (date: string, childId: string, authorId?: 'dad' | 'mom') => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const today = todayKey();
  const filtered = snapshot.pages.filter(
    (page) =>
      (!filter || page.childId === filter) &&
      (!query ||
        page.text.toLocaleLowerCase().includes(query.toLocaleLowerCase())),
  );
  const [limit, setLimit] = useState(60);
  const pages = [...filtered]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
  const groups = useMemo(
    () =>
      pages.reduce<Record<string, Page[]>>((result, page) => {
        const key = page.date.slice(0, 7);
        (result[key] ??= []).push(page);
        return result;
      }, {}),
    [pages],
  );
  return (
    <div className="screen-scroll archive-screen">
      <div className="back-title">
        <button type="button" onClick={onBack}>
          <Icon name="back" />
        </button>
        <h1>목록</h1>
      </div>
      <div className="kids">
        {snapshot.children.map((child) => (
          <KidCard
            key={child.id}
            store={store}
            child={child}
            date={today}
            page={store.getPage(today, child.id)}
            onClick={() =>
              openPage(
                today,
                child.id,
                noteAuthor(store.getCurrentMemberId(), snapshot.members),
              )
            }
          />
        ))}
      </div>
      <SearchPill
        query={query}
        onChange={(value) => {
          setQuery(value);
          setLimit(60);
        }}
      />
      <div className="segments" role="group" aria-label="아이별 기록 필터">
        <button
          aria-pressed={!filter}
          onClick={() => {
            setFilter('');
            setLimit(60);
          }}
        >
          전체
        </button>
        {snapshot.children.map((child) => (
          <button
            key={child.id}
            aria-pressed={filter === child.id}
            onClick={() => {
              setFilter(child.id);
              setLimit(60);
            }}
          >
            {child.name}
          </button>
        ))}
      </div>
      {!filtered.length && <p className="empty-results">아직 기록이 없어요.</p>}
      {Object.entries(groups).map(([month, monthPages]) => (
        <section className="archive-month" key={month}>
          <h2>{month.replace('-', '년 ')}월</h2>
          <div className="archive-grid">
            {monthPages.map((page) => {
              const child = snapshot.children.find(
                (item) => item.id === page.childId,
              );
              return child ? (
                <PageCard
                  store={store}
                  key={page.id}
                  page={page}
                  child={child}
                  onClick={() =>
                    openPage(page.date, page.childId, page.authorId)
                  }
                />
              ) : null;
            })}
          </div>
        </section>
      ))}
      <button
        className="secondary-btn load-more"
        type="button"
        disabled={pages.length >= filtered.length}
        onClick={() => setLimit((value) => value + 60)}
      >
        더 불러오기
      </button>
    </div>
  );
}
