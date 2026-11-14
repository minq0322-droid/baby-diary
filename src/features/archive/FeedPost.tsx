import { useEffect, useRef, useState } from 'react';
import type { DataStore } from '../../data/DataStore';
import type { Child, Comment, Member, Page, Tag } from '../../data/types';
import { usePageColorStyle } from '../../lib/usePageColorStyle';
import { StrokePreview } from '../../components/StrokePreview';
import { Icon } from '../../components/Icon';
import { clockLabel } from './feed';

const DOUBLE_TAP_MS = 280;

// 2026-11-15 (작가): 인스타그램 게시물처럼 — 글쓴이 줄 → 화면 폭 가득 종이 → 하트·댓글 줄 → 댓글 한 줄.
// 종이를 한 번 누르면 그 장이 열리고, 두 번 톡 하면 하트(켜기만 한다).
export function FeedPost({ page, child, store, tags, members, liked, hearts, comments, onOpen, onHeart, onComments }: {
  page: Page;
  child: Child;
  store: DataStore;
  tags: Tag[];
  members: Member[];
  liked: boolean;
  hearts: number;
  comments: Comment[];
  onOpen: () => void;
  onHeart: () => void;
  onComments: () => void;
}) {
  const [pop, setPop] = useState(0);
  const tap = useRef<number>();
  useEffect(() => () => window.clearTimeout(tap.current), []);
  const parent = page.authorId === 'dad' ? '아빠' : '엄마';
  const name = (id: string) => members.find((member) => member.id === id)?.displayName ?? (id === 'dad' ? '아빠' : '엄마');
  const hasPicture = page.drawing.length > 0 || page.photos.length > 0;
  const badges = page.tagIds.map((id) => tags.find((tag) => tag.id === id)).filter((tag): tag is Tag => !!tag);
  const first = comments[0];
  const paperTap = () => {
    if (tap.current !== undefined) {
      window.clearTimeout(tap.current);
      tap.current = undefined;
      if (!liked) onHeart();
      setPop((value) => value + 1);
      return;
    }
    tap.current = window.setTimeout(() => {
      tap.current = undefined;
      onOpen();
    }, DOUBLE_TAP_MS);
  };
  return (
    <article className="feed-post" data-page={page.id} aria-label={`${child.name} · ${parent}의 페이지`}>
      <header className="feed-writer">
        <span className={`feed-avatar ${page.authorId}`} aria-hidden="true">
          {page.authorId === 'dad' ? '아' : '엄'}
        </span>
        <span className="feed-who">
          <b>{child.name}</b>
          <small>
            {parent}의 페이지{page.createdAt && ` · ${clockLabel(page.createdAt)}`}
          </small>
        </span>
        {badges.length > 0 && (
          <span className="feed-badges">
            {badges.map((tag) => (
              <span className="feed-badge" key={tag.id}>
                {tag.label}
              </span>
            ))}
          </span>
        )}
      </header>
      <button
        type="button"
        className="feed-paper page-color"
        style={usePageColorStyle(page.color ?? child.pageColor)}
        aria-label={`${child.name} ${parent}의 페이지 열기, 두 번 누르면 하트`}
        onClick={paperTap}
      >
        {hasPicture && <StrokePreview store={store} page={page} className="feed-drawing" />}
        {page.text.trim() && (
          <span className={`feed-text ${page.authorId}-writing`}>{page.text.trim()}</span>
        )}
        {pop > 0 && (
          <span className="feed-pop" key={pop} aria-hidden="true">
            <Icon name="heartFilled" />
          </span>
        )}
      </button>
      <div className="feed-actions">
        <button type="button" className={liked ? 'on' : ''} aria-pressed={liked} aria-label={liked ? '하트 취소' : '하트'} onClick={onHeart}>
          <Icon name={liked ? 'heartFilled' : 'heart'} />
        </button>
        <button type="button" aria-label={`댓글 ${comments.length}개`} onClick={onComments}>
          <Icon name="speech" />
        </button>
        {hearts > 0 && <span className="feed-count">하트 {hearts}</span>}
      </div>
      {first && (
        <button type="button" className="feed-comment" onClick={onComments}>
          <b>{name(first.authorId)}</b> {first.content}
          {comments.length > 1 && <small> · 댓글 {comments.length}개 모두 보기</small>}
        </button>
      )}
    </article>
  );
}
