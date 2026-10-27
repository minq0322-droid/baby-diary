import { useEffect, useRef, useState } from 'react';
import type { DataStore } from '../../data/DataStore';
import type { Child } from '../../data/types';
import { Sheet } from '../../components/Sheet';
import { CropEditor } from './CropEditor';
import { ProfilePortrait } from './ProfilePortrait';
import '../../styles/home.css';

export function ProfilePhotoSheet({
  child,
  store,
  onClose,
}: {
  child: Child;
  store: DataStore;
  onClose: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<HTMLImageElement>();
  const [deleting, setDeleting] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [retrying, setRetrying] = useState(false);
  const pending = useRef<() => Promise<void>>();
  const mounted = useRef(true);
  const token = useRef(0);
  const timer = useRef(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      token.current++;
      window.clearTimeout(timer.current);
    };
  }, []);
  const run = async () => {
    if (!pending.current) return;
    window.clearTimeout(timer.current);
    if (store.readOnly) {
      pending.current = undefined;
      setRetrying(false);
      setError('프로필 사진을 바꿀 권한이 없어요.');
      return;
    }
    setBusy(true);
    setRetrying(false);
    try {
      await pending.current();
      if (!mounted.current) return;
      pending.current = undefined;
      setError('');
      setImage(undefined);
      setDeleting(undefined);
    } catch (reason) {
      if (!mounted.current) return;
      setError(
        reason instanceof Error ? reason.message : '사진을 저장하지 못했어요.',
      );
      setRetrying(true);
      timer.current = window.setTimeout(() => void run(), 5000);
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <Sheet
      title={`${child.name} · 프로필 사진`}
      dismissible={!busy && !pending.current}
      onClose={onClose}
    >
      <div className="profile-photo-flow">
        <div className="profile-current">
          <ProfilePortrait child={child} store={store} />
        </div>
        <p>가장 사랑스러운 순간을 골라 주세요.</p>
        <button
          className="primary-btn"
          disabled={busy || !!pending.current || store.readOnly}
          onClick={() => input.current?.click()}
        >
          사진첩에서 고르기 ↗
        </button>
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            const request = ++token.current;
            const url = URL.createObjectURL(file);
            const next = new Image();
            next.src = url;
            try {
              await next.decode();
              if (mounted.current && request === token.current) {
                setImage(next);
                setError('');
              }
            } catch {
              if (mounted.current && request === token.current)
                setError(
                  '사진을 열 수 없어요. JPG, PNG 등 다른 사진을 골라 주세요.',
                );
            } finally {
              URL.revokeObjectURL(url);
            }
          }}
        />
        {image && (
          <CropEditor
            key={image.src}
            image={image}
            busy={busy || !!pending.current || !!store.readOnly}
            onConfirm={(blob) => {
              pending.current = () => store.setChildPhoto(child.id, blob);
              void run();
            }}
          />
        )}
        {error && (
          <div className="profile-error" role="alert">
            {error}
            {retrying && (
              <>
                <p>사진을 보관하고 있어요. 자동으로 다시 시도해요.</p>
                <button disabled={busy} onClick={() => void run()}>
                  다시 시도
                </button>
                <button
                  disabled={busy}
                  onClick={() => {
                    window.clearTimeout(timer.current);
                    pending.current = undefined;
                    setRetrying(false);
                    setError('');
                  }}
                >
                  재시도 취소
                </button>
              </>
            )}
          </div>
        )}
        <h3>지난 프로필 사진</h3>
        <p className="crop-help">눌러서 다시 사용해요</p>
        <div className="profile-history">
          {child.photoHistory.map((photo) => (
            <div className="profile-past" key={photo.id}>
              <button
                disabled={busy || !!pending.current || store.readOnly}
                aria-label={`${photo.createdAt.slice(0, 10)} 프로필 사진 다시 쓰기`}
                onClick={() => {
                  pending.current = async () =>
                    store.useHistoryPhoto(child.id, photo.id);
                  void run();
                }}
              >
                <ProfilePortrait child={child} store={store} src={photo.src} />
              </button>
              <button
                className="profile-delete"
                disabled={busy || !!pending.current || store.readOnly}
                aria-label={`${photo.createdAt.slice(0, 10)} 사진 삭제`}
                onClick={() => setDeleting(photo.id)}
              >
                ×
              </button>
              <small>{photo.createdAt.slice(0, 10).replace(/-/g, '.')}</small>
            </div>
          ))}
        </div>
        {!child.photoHistory.length && (
          <p className="crop-help">아직 지난 사진이 없어요.</p>
        )}
        {deleting && (
          <div
            className="profile-confirm"
            role="group"
            aria-label="사진 삭제 확인"
          >
            <h3>이 사진을 지울까요?</h3>
            <p>지난 프로필 사진 목록에서 삭제해요.</p>
            <div>
              <button
                autoFocus
                disabled={busy || !!pending.current}
                onClick={() => setDeleting(undefined)}
              >
                취소
              </button>
              <button
                disabled={busy || !!pending.current}
                onClick={() => {
                  const id = deleting;
                  pending.current = () =>
                    store.deleteHistoryPhoto(child.id, id);
                  void run();
                }}
              >
                삭제
              </button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
