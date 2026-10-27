import { Icon } from '../../components/Icon';
import { useState } from 'react';
import type { Comment, Member, Reaction } from '../../data/types';
import { DiarySheet } from './DiarySheet';
export function CommentsSheet({ comments, reactions, members, memberId, pageId, readOnly, onComment, onDelete, onReact, onClose }: {
  comments: Comment[];
  reactions: Reaction[];
  members: Member[];
  memberId: string;
  pageId: string;
  readOnly: boolean;
  onComment: (comment: Comment, existing: boolean) => void;
  onDelete: (id: string) => void;
  onReact: () => void;
  onClose: () => void;
}) {
  const [text, setText] = useState('');
  const [selected, setSelected] = useState<Comment>();
  const [editing, setEditing] = useState(false);
  const submit = () => {
    if (!text.trim() || readOnly)
      return;
    const now = new Date().toISOString();
    const target = editing ? selected : undefined;
    onComment({ id: target?.id ?? crypto.randomUUID(), pageId, content: text.trim(), authorId: memberId, createdAt: target?.createdAt ?? now, updatedAt: now }, !!target);
    setText('');
    setSelected(undefined);
    setEditing(false);
  };
  return <DiarySheet title="댓글" onClose={onClose}>
    {comments.map((comment) => {
      const member = members.find((item) => item.id === comment.authorId);
      return <button
        key={comment.id}
        className={`diary-comment ${member?.color ?? 'dad'}-writing`}
        disabled={readOnly || comment.authorId !== memberId}
        onClick={() => { setSelected(comment); setEditing(false); }}>
        <span className="comment-author">{member?.displayName ?? '가족'}</span><span>{comment.content}</span>
      </button>;
    })}
    {!comments.length && <p className="diary-hint">첫 댓글을 남겨 보세요</p>}
    {selected && !editing && <div className="comment-actions">
      <button onClick={() => { setText(selected.content); setEditing(true); }}>수정</button>
      <button onClick={() => { onDelete(selected.id); setSelected(undefined); setText(''); }}>삭제</button>
      <button onClick={() => setSelected(undefined)}>취소</button>
    </div>}
    <button
      className="heart-toggle"
      disabled={readOnly}
      aria-pressed={reactions.some((item) => item.memberId === memberId)}
      onClick={onReact}>
      <Icon name={reactions.some((item) => item.memberId === memberId) ? 'heartFilled' : 'heart'} /> {reactions.map((reaction) => members.find((member) => member.id === reaction.memberId)?.displayName ?? '가족').join(' · ') || '마음 남기기'}
    </button>
    {!readOnly && <form className="comment-form" onSubmit={(event) => { event.preventDefault(); submit(); }}>
      <input
        aria-label="댓글 남기기"
        placeholder="댓글 남기기"
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && event.nativeEvent.isComposing)
            event.preventDefault();
        }} />
      <button disabled={!text.trim()}>{editing ? '수정' : '등록'}</button>
      {editing && <button type="button" onClick={() => { setSelected(undefined); setText(''); setEditing(false); }}>취소</button>}
    </form>}
  </DiarySheet>;
}
