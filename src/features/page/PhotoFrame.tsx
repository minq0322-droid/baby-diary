import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { DataStore } from '../../data/DataStore';
import type { Photo } from '../../data/types';
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export function PhotoFrame({ photo, store, editing, cancelGesture = false, onChange }: {
  photo: Photo;
  store: DataStore;
  editing: boolean;
  cancelGesture?: boolean;
  onChange: (photo: Photo) => void;
}) {
  const [src, setSrc] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const draft = useRef(photo);
  const gesture = useRef<{
    id: number;
    x: number;
    y: number;
    photo: Photo;
    resize: boolean;
  }>();
  useEffect(() => {
    if (!cancelGesture || !gesture.current) return;
    gesture.current = undefined;
    const element = ref.current;
    if (element) {
      element.style.left = `${photo.x * 100}%`;
      element.style.top = `${photo.y * 100}%`;
      element.style.width = `${photo.w * 100}%`;
      element.style.transform = `rotate(${photo.rotation}deg)`;
    }
  }, [cancelGesture, photo]);
  useEffect(() => {
    let cancelled = false;
    void (store.resolvePhotoSrc ? store.resolvePhotoSrc(photo.src) : Promise.resolve(photo.src))
      .then((url) => {
        if (!cancelled)
          setSrc(url);
      })
      .catch(() => {
        if (!cancelled)
          setSrc('');
      });
    return () => { cancelled = true; };
  }, [photo.src, store]);
  const finish = () => {
    if (!gesture.current)
      return;
    gesture.current = undefined;
    onChange(draft.current);
  };
  const start = (event: PointerEvent<HTMLDivElement>) => {
    if (!editing || cancelGesture || gesture.current)
      return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    draft.current = photo;
    gesture.current = { id: event.pointerId, x: event.clientX, y: event.clientY, photo, resize: !!(event.target as HTMLElement).closest('.photo-resize') };
  };
  return (<div
    ref={ref}
    className="polaroid"
    style={{ left: `${photo.x * 100}%`, top: `${photo.y * 100}%`, width: `${photo.w * 100}%`, transform: `rotate(${photo.rotation}deg)` }}
    onPointerDown={start}
    onPointerUp={finish}
    onPointerCancel={finish}
    onLostPointerCapture={finish}
    onPointerMove={(event) => {
      const active = gesture.current;
      const element = ref.current;
      if (!active || !element || active.id !== event.pointerId)
        return;
      const rect = element.parentElement!.getBoundingClientRect();
      const dx = (event.clientX - active.x) / rect.width;
      const dy = (event.clientY - active.y) / rect.height;
      const next = active.resize
        ? { ...active.photo, w: clamp(active.photo.w + dx, .18, .9), rotation: clamp(active.photo.rotation + dy * 30, -20, 20) }
        : { ...active.photo, x: clamp(active.photo.x + dx, 0, 1 - active.photo.w), y: clamp(active.photo.y + dy, 0, .7) };
      draft.current = next;
      element.style.left = `${next.x * 100}%`;
      element.style.top = `${next.y * 100}%`;
      element.style.width = `${next.w * 100}%`;
      element.style.transform = `rotate(${next.rotation}deg)`;
    }}>
    {src ? <img src={src} alt="일기에 붙인 사진" draggable={false} /> : <span>사진을 불러오고 있어요</span>}
    {editing && <button className="photo-resize" aria-label="사진 크기와 기울기 조절" title="가로로 끌어 크기, 세로로 끌어 기울기 조절">↘</button>}
  </div>);
}
