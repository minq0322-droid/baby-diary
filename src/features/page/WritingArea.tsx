import type { Note } from '../../data/types';
import { topic } from '../../lib/josa';

type Props = {
  name: string;
  notes: Note[];
  editing: boolean;
  writer?: Note['authorId'];
  onText: (text: string) => void;
};

export function WritingArea({ name, notes, editing, writer, onText }: Props) {
  const current = notes.find((note) => note.authorId === writer);

  return (
    <section className="writing" aria-label={`${name}의 일기`}>
      <div className="notes">
        {notes.filter((note) => !editing || note.id !== current?.id).map((note) => (
          <p key={note.id} className={`note ${note.authorId}-writing`}>
            {note.text}
            <span className="initial">{note.authorId === 'dad' ? '아' : '엄'}</span>
          </p>
        ))}
        {editing && writer && (
          <div className="editable-note">
            <span className="initial">{writer === 'dad' ? '아' : '엄'}</span>
            <textarea
              key={writer}
              className={`note-editor ${writer}-writing`}
              aria-label={`${writer === 'dad' ? '아빠' : '엄마'}의 일기`}
              placeholder={`오늘 ${topic(name)}…`}
              value={current?.text ?? ''}
              onChange={(event) => onText(event.target.value)}
            />
          </div>
        )}
      </div>
    </section>
  );
}
