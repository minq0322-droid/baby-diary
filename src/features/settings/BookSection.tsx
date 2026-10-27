import { useEffect, useRef, useState } from 'react';
import type { DataStore } from '../../data/DataStore';
import type { StoreSnapshot } from '../../data/types';
import { todayKey } from '../../lib/date';
import { Sheet } from '../../components/Sheet';
import { exportBook, type BookOptions } from './bookExport';
import '../../styles/book.css';

export function BookSection({
  store,
  snapshot,
}: {
  store: DataStore;
  snapshot: StoreSnapshot;
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<BookOptions>({
    start: snapshot.pages.map((page) => page.date).sort()[0] ?? todayKey(),
    end: todayKey(),
    childId: '',
    authorId: '',
    format: 'pdf',
  });
  const [progress, setProgress] = useState('');
  const [message, setMessage] = useState('');
  const controller = useRef<AbortController>();
  const [busy, setBusy] = useState(false);
  useEffect(() => () => controller.current?.abort(), []);
  const close = () => {
    controller.current?.abort();
    setOpen(false);
  };
  return (
    <section className="settings-group">
      <h2>책</h2>
      <button className="setting settings-list" onClick={() => setOpen(true)}>
        책으로 만들기
      </button>
      {open && (
        <Sheet title="책으로 만들기" onClose={close}>
          <form
            className="book-form"
            onSubmit={async (event) => {
              event.preventDefault();
              if (busy) return;
              const abort = new AbortController();
              controller.current = abort;
              setBusy(true);
              setMessage('');
              setProgress('기록을 불러오고 있어요…');
              try {
                await exportBook(
                  store,
                  options,
                  abort.signal,
                  (done, total) => setProgress(`${done} / ${total} 페이지`),
                  () => setProgress('내보내기 도구를 불러오는 중…'),
                );
                setMessage('책을 내보냈어요');
              } catch (reason) {
                setMessage(
                  abort.signal.aborted
                    ? '취소했어요'
                    : reason instanceof Error
                      ? reason.message
                      : '책을 내보내지 못했어요.',
                );
              } finally {
                setBusy(false);
                setProgress('');
              }
            }}
          >
            <fieldset disabled={busy}>
              <label>
                시작일
                <input
                  required
                  type="date"
                  value={options.start}
                  max={options.end}
                  onChange={(event) =>
                    setOptions({ ...options, start: event.target.value })
                  }
                />
              </label>
              <label>
                종료일
                <input
                  required
                  type="date"
                  value={options.end}
                  min={options.start}
                  onChange={(event) =>
                    setOptions({ ...options, end: event.target.value })
                  }
                />
              </label>
              <label>
                아이
                <select
                  value={options.childId}
                  onChange={(event) =>
                    setOptions({ ...options, childId: event.target.value })
                  }
                >
                  <option value="">전체</option>
                  {snapshot.children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                부모
                <select
                  value={options.authorId}
                  onChange={(event) =>
                    setOptions({ ...options, authorId: event.target.value })
                  }
                >
                  <option value="">둘 다</option>
                  <option value="mom">엄마</option>
                  <option value="dad">아빠</option>
                </select>
              </label>
              <label>
                파일 형식
                <select
                  value={options.format}
                  onChange={(event) =>
                    setOptions({
                      ...options,
                      format: event.target.value as 'pdf' | 'zip',
                    })
                  }
                >
                  <option value="pdf">PDF</option>
                  <option value="zip">PNG 모음 ZIP</option>
                </select>
              </label>
            </fieldset>
            <p role="status">{progress || message}</p>
            {busy ? (
              <button
                type="button"
                className="primary-btn"
                onClick={() => controller.current?.abort()}
              >
                취소
              </button>
            ) : (
              <button className="primary-btn" type="submit">
                내려받기
              </button>
            )}
          </form>
        </Sheet>
      )}
    </section>
  );
}
