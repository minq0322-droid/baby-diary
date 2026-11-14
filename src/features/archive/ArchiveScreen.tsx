import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { DataStore } from '../../data/DataStore';
import type { StoreSnapshot } from '../../data/types';
import { noteAuthor } from '../../data/migrate';
import { formatHeader, todayKey } from '../../lib/date';
import { usePageColorStyle } from '../../lib/usePageColorStyle';
import { Icon } from '../../components/Icon';
import { StrokePreview } from '../../components/StrokePreview';
import type { Page } from '../../data/types';
import { CommentsSheet } from '../page/CommentsSheet';
import { SearchPill } from './SearchPill';
import { FeedPost } from './FeedPost';
import { feedOrder, groupByDay, yearAgoPage } from './feed';
import '../../styles/feed.css';

const STEP = 20;
// 장을 열었다가 돌아오면 같은 자리에서 이어 보도록 화면 밖에 기억해 둔다.
// 화면 밖 장은 높이를 어림하므로(content-visibility) 연 장을 기준으로 되찾는다.
const memory = { y: 0, limit: STEP, filter: '', restore: false, anchor: '', top: 0 };

// 2026-11-15 (작가): 기록 = 인스타그램식 피드(카드·목록 전환 대신). 1년 전 오늘은 Pieceful 참고.
export function ArchiveScreen({ snapshot, store, openPage, onBack }: {
  store: DataStore;
  snapshot: StoreSnapshot;
  openPage: (date: string, childId: string, authorId?: 'dad' | 'mom', pageId?: string) => void;
  onBack: () => void;
}) {
  const restoring = memory.restore;
  // 첫 렌더에서 잡아 둔다(개발 모드는 효과를 두 번 돌린다).
  const saved = useRef(restoring ? { ...memory } : undefined);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState(restoring ? memory.filter : '');
  const [limit, setLimit] = useState(restoring ? memory.limit : STEP);
  const [commentsFor, setCommentsFor] = useState<string>();
  const sentinel = useRef<HTMLDivElement>(null);
  const memberId = store.getCurrentMemberId();
  const children = useMemo(() => [...snapshot.children].sort((a, b) => a.sortOrder - b.sortOrder), [snapshot.children]);
  const ofChild = snapshot.pages.filter((page) => !filter || page.childId === filter);
  const needle = query.trim().toLocaleLowerCase();
  const all = feedOrder(needle ? ofChild.filter((page) => page.text.toLocaleLowerCase().includes(needle)) : ofChild);
  const days = groupByDay(all.slice(0, limit));
  const memoryPage = needle ? undefined : yearAgoPage(ofChild, todayKey());
  const memoryChild = memoryPage && children.find((child) => child.id === memoryPage.childId);
  const more = limit < all.length;

  useLayoutEffect(() => {
    const spot = saved.current;
    memory.restore = false;
    if (!spot) return;
    window.scrollTo(0, spot.y);
    const post = spot.anchor && document.querySelector(`[data-page="${CSS.escape(spot.anchor)}"]`);
    if (!post) return;
    // 보이게 된 장이 실제 높이로 그려지며 몇 프레임 동안 밀리므로, 자리가 멈출 때까지 다시 맞춘다.
    // 손가락이 닿으면 바로 멈춘다(사용자가 넘기는 것을 거스르지 않게).
    const until = performance.now() + 1500;
    let request = 0;
    const stop = () => cancelAnimationFrame(request);
    const settle = () => {
      const shift = post.getBoundingClientRect().top - spot.top;
      if (Math.abs(shift) > 1) window.scrollTo(0, window.scrollY + shift);
      if (performance.now() < until) request = requestAnimationFrame(settle);
    };
    settle();
    const options = { once: true, passive: true } as const;
    window.addEventListener('touchstart', stop, options);
    window.addEventListener('wheel', stop, options);
    window.addEventListener('keydown', stop, options);
    return () => {
      stop();
      window.removeEventListener('touchstart', stop);
      window.removeEventListener('wheel', stop);
      window.removeEventListener('keydown', stop);
    };
  }, []);
  useEffect(() => {
    const target = sentinel.current;
    if (!target || !more) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setLimit((value) => value + STEP);
      },
      { rootMargin: '600px 0px' },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [more, limit]);

  const open = (date: string, childId: string, authorId?: 'dad' | 'mom', pageId?: string) => {
    const post = pageId && document.querySelector(`[data-page="${CSS.escape(pageId)}"]`);
    const top = post ? post.getBoundingClientRect().top : 0;
    Object.assign(memory, { y: window.scrollY, limit, filter, restore: true, anchor: post ? pageId : '', top });
    openPage(date, childId, authorId, pageId);
  };
  const writeToday = () => {
    const child = children.find((item) => item.id === filter) ?? children[0];
    if (child) open(todayKey(), child.id, noteAuthor(memberId, snapshot.members));
  };
  const choose = (id: string) => {
    setFilter(id);
    setLimit(STEP);
    window.scrollTo(0, 0);
  };
  const sheetPage = snapshot.pages.find((page) => page.id === commentsFor);

  return (
    <div className="feed-screen">
      <header className="feed-top">
        <button type="button" className="round-btn" aria-label="홈으로" onClick={onBack}>
          <Icon name="back" />
        </button>
        <h1>기록</h1>
        <button
          type="button"
          className="round-btn"
          aria-label={searching ? '찾기 닫기' : '기록에서 찾기'}
          aria-pressed={searching}
          onClick={() => {
            setSearching((value) => !value);
            setQuery('');
          }}
        >
          <Icon name="search" />
        </button>
      </header>
      {searching && (
        <div className="feed-search">
          <SearchPill
            query={query}
            onChange={(value) => {
              setQuery(value);
              setLimit(STEP);
            }}
          />
        </div>
      )}
      <div className="feed-chips" role="group" aria-label="아이별 기록">
        <button type="button" aria-pressed={!filter} onClick={() => choose('')}>
          함께
        </button>
        {children.map((child) => (
          <button type="button" key={child.id} aria-pressed={filter === child.id} onClick={() => choose(child.id)}>
            {child.name}
          </button>
        ))}
      </div>
      {memoryPage && memoryChild && (
        <YearAgo
          label={`1년 전 오늘 · ${memoryChild.name} · ${memoryPage.authorId === 'dad' ? '아빠' : '엄마'}`}
          text={memoryPage.text.trim().split('\n')[0] || '그림 한 장'}
          page={memoryPage}
          store={store}
          color={memoryPage.color ?? memoryChild.pageColor}
          writing={`${memoryPage.authorId}-writing`}
          onOpen={() => open(memoryPage.date, memoryPage.childId, memoryPage.authorId, memoryPage.id)}
        />
      )}
      {!all.length && (
        <div className="feed-empty">
          <p>{needle ? '찾는 글이 담긴 기록이 없어요' : '아직 기록이 없어요'}</p>
          {!needle && !store.readOnly && (
            <button type="button" className="primary-btn" onClick={writeToday}>
              오늘 기록 쓰기
            </button>
          )}
        </div>
      )}
      {days.map((day) => (
        <section className="feed-day" key={day.date} aria-label={formatHeader(day.date)}>
          <h2 className="feed-day-head">
            <span>{formatHeader(day.date)}</span>
            <small>{day.pages.length}장</small>
          </h2>
          {day.pages.map((page) => {
            const child = children.find((item) => item.id === page.childId);
            if (!child) return null;
            const reactions = snapshot.reactions.filter((item) => item.pageId === page.id);
            return (
              <FeedPost
                key={page.id}
                page={page}
                child={child}
                store={store}
                tags={snapshot.tags}
                members={snapshot.members}
                liked={reactions.some((item) => item.memberId === memberId)}
                hearts={reactions.length}
                comments={snapshot.comments.filter((item) => item.pageId === page.id)}
                onOpen={() => open(page.date, page.childId, page.authorId, page.id)}
                onHeart={() => {
                  if (!store.readOnly) store.toggleReaction(page.id);
                }}
                onComments={() => setCommentsFor(page.id)}
              />
            );
          })}
        </section>
      ))}
      {more && <div ref={sentinel} className="feed-sentinel" aria-hidden="true" />}
      {!more && all.length > 0 && <p className="feed-end">여기까지 {all.length}장</p>}
      {!store.readOnly && children.length > 0 && (
        <button type="button" className="feed-fab" aria-label="오늘 기록 쓰기" onClick={writeToday}>
          <Icon name="plus" />
        </button>
      )}
      {sheetPage && (
        <CommentsSheet
          comments={snapshot.comments.filter((item) => item.pageId === sheetPage.id)}
          reactions={snapshot.reactions.filter((item) => item.pageId === sheetPage.id)}
          members={snapshot.members}
          memberId={memberId}
          pageId={sheetPage.id}
          readOnly={!!store.readOnly}
          onClose={() => setCommentsFor(undefined)}
          onComment={(comment, existing) => {
            if (existing) store.updateComment(comment);
            else store.createComment(comment);
          }}
          onDelete={(id) => store.deleteComment(id)}
          onReact={() => store.toggleReaction(sheetPage.id)}
        />
      )}
    </div>
  );
}

function YearAgo({ label, text, page, store, color, writing, onOpen }: {
  label: string;
  page: Page;
  store: DataStore;
  text: string;
  color: string;
  writing: string;
  onOpen: () => void;
}) {
  const style = usePageColorStyle(color);
  return (
    <button type="button" className="feed-memory" onClick={onOpen}>
      <span className="feed-memory-thumb page-color" style={style} aria-hidden="true">
        <StrokePreview store={store} page={page} />
      </span>
      <span className="feed-memory-text">
        <small>{label}</small>
        <span className={writing}>{text}</span>
      </span>
      <Icon name="arrow" />
    </button>
  );
}
