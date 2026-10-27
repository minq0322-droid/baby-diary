import type { DataStore } from '../../data/DataStore';
import { useMemo, useState } from 'react';
import type { StoreSnapshot, Page } from '../../data/types';
import { PageCard } from './PageCard';
import { SearchPill } from './SearchPill';
import { fromKey } from '../../lib/date';
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
  const viewKey = 'archive-view:' + store.getCurrentMemberId();
  const [list, setList] = useState(() => {
    try { return localStorage.getItem(viewKey) === 'list'; }
    catch { return false; }
  });
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
        <button className="archive-view-toggle" aria-label={list ? '카드로 보기' : '목록으로 보기'} aria-pressed={list} onClick={() => {
          const next = !list;
          setList(next);
          try { localStorage.setItem(viewKey, next ? 'list' : 'cards'); }
          catch { /* A blocked preference store does not prevent switching. */ }
        }}><Icon name={list ? 'cards' : 'list'} /></button>
      </div>
      <SearchPill query={query} onChange={value => { setQuery(value); setLimit(60); }} />
      {!filtered.length && <p className="empty-results">아직 기록이 없어요.</p>}
      {Object.entries(groups).map(([month, monthPages]) => (
        <section className="archive-month" key={month}>
          <h2>{month.replace('-', '년 ')}월</h2>
          <div className={list ? "archive-list" : "archive-grid"}>
            {monthPages.map((page) => {
              const child = snapshot.children.find(
                (item) => item.id === page.childId,
              );
              return child ? list ? (
                <button key={page.id} className="archive-list-row" onClick={() => openPage(page.date, page.childId, page.authorId)}>
                  <span className="archive-list-meta">
                    <time dateTime={page.date}>{Number(page.date.slice(5, 7))}.{Number(page.date.slice(8))} {'일월화수목금토'[fromKey(page.date).getDay()]}</time>
                    <strong>{child.name}</strong>
                    <span>{page.authorId === 'mom' ? '엄마' : '아빠'}</span>
                    {!!page.tagIds.length && <span className="list-badge" aria-label="배지 있음"><Icon name="star" /></span>}
                  </span>
                  <span className="archive-list-text">{page.text || '글 없이 남긴 기록'}</span>
                </button>
              ) : (
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
