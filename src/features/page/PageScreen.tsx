import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { DataStore } from '../../data/DataStore';
import type {
  Child,
  Comment,
  Page,
  Reaction,
  StoreSnapshot,
} from '../../data/types';
import { Icon } from '../../components/Icon';
import { ColorPicker } from '../../components/ColorPicker';
import { addDays, dayCounter, fromKey } from '../../lib/date';
import { usePageColorStyle } from '../../lib/usePageColorStyle';
import { noteAuthor } from '../../data/migrate';
import { preparePage } from '../../lib/stroke';
import { BadgeSheet } from './BadgeSheet';
import { CommentsSheet } from './CommentsSheet';
import { DiarySheet } from './DiarySheet';
import { ParentFace } from './ParentFace';
import { DrawingArea } from './DrawingArea';
import { writeNote } from './notes';
import { WritingArea } from './WritingArea';
import '../../styles/page.css';
export type PageOrigin = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export function PageScreen({
  store,
  snapshot,
  child,
  date,
  authorId,
  onAuthor,
  startEditing,
  origin,
  onBack,
  onDate,
  onSaved,
}: {
  store: DataStore;
  snapshot: StoreSnapshot;
  child: Child;
  date: string;
  authorId?: 'dad' | 'mom';
  onAuthor: (authorId: 'dad' | 'mom') => void;
  startEditing: boolean;
  origin?: PageOrigin;
  onBack: () => void;
  onDate: (date: string) => void;
  onSaved: (pageId: string) => void;
}) {
  const [initial] = useState(() => {
    const saved = store.getPage(date, child.id, authorId);
    const now = new Date().toISOString();
    const blank: Page = {
      id: `${date}__${child.id}__${authorId ?? noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members)}`,
      childId: child.id,
      date,
      authorId:
        authorId ??
        noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members),
      drawing: [],
      photos: [],
      text: '',
      tagIds: [],
      createdAt: now,
      updatedAt: now,
    };
    return {
      saved: !!saved || snapshot.pages.some((page) => page.id === blank.id),
      page: structuredClone(saved ?? blank),
    };
  });
  const [page, setPage] = useState(initial.page);
  const baseline = useRef(initial.page);
  const [loading, setLoading] = useState(
    !store.getPage(date, child.id, authorId) &&
      snapshot.pages.some((page) => page.id === initial.page.id),
  );
  useEffect(() => {
    if (!loading) return;
    let active = true;
    void store
      .loadPage(initial.page.id)
      .then((page) => {
        if (active) {
          baseline.current = page;
          setPage(page);
          setLoading(false);
        }
      })
      .catch((reason) => {
        if (active)
          setError(
            reason instanceof Error ? reason.message : '불러오지 못했어요.',
          );
      });
    return () => {
      active = false;
    };
  }, [store, initial.page.id, loading]);
  const [editing, setEditing] = useState(
    !store.readOnly && (startEditing || !initial.saved),
  );
  const writer = store.readOnly
    ? undefined
    : noteAuthor(store.getCurrentMemberId(), snapshot.members);
  const ownPage = page.authorId === writer;
  const [drawing, setDrawing] = useState(false);
  const [sheet, setSheet] = useState<'badges' | 'palette' | 'comments'>();
  const [pending, setPending] = useState<() => void>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [localReactions, setLocalReactions] = useState<Reaction[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number }>();
  const dirty =
    JSON.stringify(page) !== JSON.stringify(baseline.current) ||
    !!localComments.length ||
    !!localReactions.length;
  const comments = initial.saved
    ? snapshot.comments.filter((item) => item.pageId === page.id)
    : localComments;
  const reactions = initial.saved
    ? snapshot.reactions.filter((item) => item.pageId === page.id)
    : localReactions;
  const memberId = store.getCurrentMemberId();
  const hasContent =
    page.text.trim() ||
    page.drawing.some((stroke) => stroke.color !== 'erase') ||
    !!page.photos.length;
  const canSave = ownPage && hasContent && !busy && !leaving && !loading;
  const transform = origin
    ? `translate(${origin.x}px, ${origin.y}px) scale(${origin.width / window.innerWidth}, ${origin.height / window.innerHeight})`
    : 'translate(12vw, 20vh) scale(.76)';
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    ref.current?.animate(
      [
        { transform, borderRadius: '25px', opacity: 0.6 },
        { transform: 'none', borderRadius: '0', opacity: 1 },
      ],
      { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' },
    );
  }, [transform]);
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);
  const exit = (action: () => void) => {
    if (leaving) return;
    setLeaving(true);
    if (
      matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !ref.current
    ) {
      action();
      return;
    }
    let ran = false;
    const run = () => {
      if (ran) return;
      ran = true;
      action();
    };
    const animation = ref.current.animate(
      [
        { transform: 'none', opacity: 1 },
        { transform, borderRadius: '25px', opacity: 0 },
      ],
      { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' },
    );
    void animation.finished.then(run, run);
    window.setTimeout(run, 400);
  };
  const navigate = (action: () => void) => {
    if (busy) {
      setError('사진을 붙이고 있어요. 잠시 기다려 주세요.');
      return;
    }
    if (dirty) setPending(() => action);
    else action();
  };
  const save = () => {
    if (!canSave) return;
    try {
      const saved = preparePage({
        ...page,
        updatedAt: new Date().toISOString(),
      });
      store.savePage(saved);
      localComments.forEach((comment) => store.createComment(comment));
      localReactions.forEach((reaction) =>
        store.toggleReaction(saved.id, reaction.memberId),
      );
      exit(() => onSaved(saved.id));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : '저장하지 못했어요. 다시 시도해 주세요.',
      );
    }
  };
  const weekday = '일월화수목금토'[fromKey(date).getDay()];
  return (
    <div
      ref={ref}
      className={`diary page-color${drawing ? ' is-drawing' : ''}`}
      style={usePageColorStyle(page.color ?? child.pageColor)}
    >
      <div
        className="diary-content"
        aria-busy={busy}
        onTouchStart={(event) => {
          if (
            drawing ||
            (event.target as HTMLElement).closest(
              'textarea, button, input, .polaroid',
            )
          )
            return;
          const touch = event.touches[0];
          swipe.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(event) => {
          const start = swipe.current;
          swipe.current = undefined;
          if (!start || drawing) return;
          const touch = event.changedTouches[0];
          const dx = touch.clientX - start.x;
          if (
            Math.abs(dx) < 70 ||
            Math.abs(dx) < Math.abs(touch.clientY - start.y) * 1.5
          )
            return;
          const author = dx < 0 ? 'dad' : 'mom';
          if (author !== page.authorId) navigate(() => onAuthor(author));
        }}
      >
        <header className="diary-head">
          <button
            aria-label="홈으로 돌아가기"
            onClick={() => navigate(() => exit(onBack))}
          >
            ←
          </button>
          <div className="diary-date">
            <button
              aria-label="이전 날"
              onClick={() => navigate(() => onDate(addDays(date, -1)))}
            >
              ‹
            </button>
            <span>
              {Number(date.slice(5, 7))}.{Number(date.slice(8))} {weekday} · {dayCounter(child, date)}
            </span>
            <button
              aria-label="다음 날"
              onClick={() => navigate(() => onDate(addDays(date, 1)))}
            >
              ›
            </button>
          </div>
          <button
            className={`badge-button${page.tagIds.length ? ' chosen' : ''}`}
            aria-label={`배지 ${page.tagIds.length}개, 배지 고르기`}
            onClick={() => setSheet('badges')}
          >
            <Icon name="star" />
            {!!page.tagIds.length && (
              <span className="badge-count">{page.tagIds.length}</span>
            )}
          </button>
        </header>
        <div className="parent-pages" role="group" aria-label="부모별 페이지">
          {(['mom', 'dad'] as const).map((author) => (
            <button
              key={author}
              aria-label={author === 'mom' ? '엄마 페이지' : '아빠 페이지'}
              aria-pressed={page.authorId === author}
              onClick={() => navigate(() => onAuthor(author))}
            >
              <ParentFace author={author} />
            </button>
          ))}
        </div>
        <DrawingArea
          page={{ ...page, color: page.color ?? child.pageColor }}
          store={store}
          editing={editing && ownPage && !busy && !leaving && !loading}
          onChange={(next) => setPage({ ...next, color: page.color })}
          onError={setError}
          onBusy={setBusy}
          onDrawing={setDrawing}
        />
        {!ownPage && !hasContent && !loading && (
          <p className="diary-hint">
            {page.authorId === 'mom' ? '엄마' : '아빠'}가 아직 안 썼어요
          </p>
        )}
        <WritingArea
          name={child.name}
          notes={[
            {
              id: page.id,
              authorId: page.authorId,
              text: page.text,
              createdAt: page.createdAt,
              updatedAt: page.updatedAt,
            },
          ]}
          editing={editing && ownPage && !leaving && !loading}
          writer={writer}
          onText={(text) => {
            if (writer)
              setPage(writeNote(page, writer, text, new Date().toISOString()));
          }}
        />
        {editing && ownPage && (
          <p className="diary-hint" aria-live="polite">
            {!hasContent
              ? '글이나 그림, 사진을 남겨 주세요'
              : busy
                ? '사진을 붙이고 있어요…'
                : '\u00a0'}
          </p>
        )}
        {error && (
          <p className="diary-error" role="alert">
            {error}
            <button aria-label="안내 닫기" onClick={() => setError('')}>
              ×
            </button>
          </p>
        )}
        <footer className="diary-bottom">
          <button
            className="comment-button"
            aria-label={`댓글 ${comments.length}개`}
            onClick={() => setSheet('comments')}
          >
            <Icon name="speech" /> {comments.length}
          </button>
          <button
            className="oval"
            disabled={store.readOnly || !ownPage || (editing && !canSave)}
            onClick={editing ? save : () => setEditing(true)}
          >
            <span>{editing ? '저장' : '수정'}</span>
          </button>
          {editing && ownPage ? (
            <button className="page-palette" aria-label="페이지 색 고르기" onClick={() => setSheet('palette')}>
              <Icon name="palette" />
            </button>
          ) : <span className="page-palette" aria-hidden="true" />}
        </footer>
      </div>
      {sheet === 'badges' && (
        <BadgeSheet
          tags={snapshot.tags}
          selected={page.tagIds}
          readOnly={!editing || !ownPage || loading}
          onChange={(tagIds) => setPage({ ...page, tagIds })}
          onClose={() => setSheet(undefined)}
        />
      )}
      {sheet === 'palette' && (
        <DiarySheet title="페이지 색" onClose={() => setSheet(undefined)}>
          <ColorPicker
            viewerId={memberId}
            value={page.color ?? child.pageColor}
            onChange={(color) => setPage({ ...page, color })}
          />
        </DiarySheet>
      )}
      {sheet === 'comments' && (
        <CommentsSheet
          comments={comments}
          reactions={reactions}
          members={snapshot.members}
          memberId={memberId}
          pageId={page.id}
          readOnly={!!store.readOnly || (!initial.saved && !ownPage)}
          onClose={() => setSheet(undefined)}
          onComment={(comment, existing) => {
            if (initial.saved) {
              if (existing) store.updateComment(comment);
              else store.createComment(comment);
            } else
              setLocalComments((items) => [
                ...items.filter((item) => item.id !== comment.id),
                comment,
              ]);
          }}
          onDelete={(id) => {
            if (initial.saved) store.deleteComment(id);
            else
              setLocalComments((items) =>
                items.filter((item) => item.id !== id),
              );
          }}
          onReact={() => {
            if (initial.saved) store.toggleReaction(page.id, memberId);
            else
              setLocalReactions((items) =>
                items.length
                  ? []
                  : [{ pageId: page.id, memberId, emoji: '❤️' }],
              );
          }}
        />
      )}
      {pending && (
        <DiarySheet
          title="저장하지 않고 나갈까요?"
          onClose={() => setPending(undefined)}
        >
          <div className="leave-actions">
            <button
              onClick={() => {
                setPending(undefined);
                pending();
              }}
            >
              나가기
            </button>
            <button onClick={() => setPending(undefined)}>계속 쓰기</button>
          </div>
        </DiarySheet>
      )}
    </div>
  );
}
