import { clampCrop, type Crop } from './crop';
import { useEffect, useRef, useState } from 'react';

type Point = { x: number; y: number };
export function CropEditor({
  image,
  busy,
  onConfirm,
}: {
  image: HTMLImageElement;
  busy: boolean;
  onConfirm: (blob: Blob) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [crop, setCrop] = useState<Crop>({ zoom: 1, x: 0, y: 0 });
  const current = useRef(crop);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<{ points: Point[]; crop: Crop }>();
  const change = (next: Crop) => {
    current.current = clampCrop(image, next);
    setCrop(current.current);
  };
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const scale = Math.max(480 / image.width, 480 / image.height) * crop.zoom;
    ctx.clearRect(0, 0, 600, 600);
    ctx.fillStyle = '#bdc7c2';
    ctx.fillRect(0, 0, 600, 600);
    ctx.drawImage(
      image,
      300 + crop.x - (image.width * scale) / 2,
      300 + crop.y - (image.height * scale) / 2,
      image.width * scale,
      image.height * scale,
    );
    ctx.fillStyle = '#12242b99';
    ctx.beginPath();
    ctx.rect(0, 0, 600, 600);
    ctx.arc(300, 300, 240, 0, Math.PI * 2, true);
    ctx.fill('evenodd');
    ctx.strokeStyle = '#ffffffdf';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(300, 300, 240, 0, Math.PI * 2);
    ctx.stroke();
  }, [image, crop]);
  const reset = () => {
    gesture.current = {
      points: [...pointers.current.values()],
      crop: current.current,
    };
  };
  const local = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) * 600) / box.width,
      y: ((event.clientY - box.top) * 600) / box.height,
    };
  };
  const end = (event: React.PointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(event.pointerId);
    reset();
  };
  return (
    <div className="crop-editor" aria-busy={busy}>
      <canvas
        ref={canvas}
        width="600"
        height="600"
        tabIndex={busy ? -1 : 0}
        role="img"
        aria-label="원형 사진 크롭. 드래그 또는 방향키로 이동, 두 손가락 또는 아래 슬라이더로 확대"
        onPointerDown={(event) => {
          if (busy) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          pointers.current.set(event.pointerId, local(event));
          reset();
        }}
        onPointerMove={(event) => {
          if (
            busy ||
            !pointers.current.has(event.pointerId) ||
            !gesture.current
          )
            return;
          pointers.current.set(event.pointerId, local(event));
          const points = [...pointers.current.values()];
          const initial = gesture.current;
          if (points.length > 1 && initial.points.length > 1) {
            const midpoint = (values: Point[]) => ({
              x: (values[0].x + values[1].x) / 2,
              y: (values[0].y + values[1].y) / 2,
            });
            const distance = (values: Point[]) =>
              Math.hypot(values[0].x - values[1].x, values[0].y - values[1].y);
            const zoom = Math.max(
              1,
              Math.min(
                3,
                (initial.crop.zoom * distance(points)) /
                  Math.max(1, distance(initial.points)),
              ),
            );
            const ratio = zoom / initial.crop.zoom;
            const before = midpoint(initial.points);
            const after = midpoint(points);
            change({
              zoom,
              x: after.x - 300 - (before.x - 300 - initial.crop.x) * ratio,
              y: after.y - 300 - (before.y - 300 - initial.crop.y) * ratio,
            });
          } else
            change({
              ...initial.crop,
              x: initial.crop.x + points[0].x - initial.points[0].x,
              y: initial.crop.y + points[0].y - initial.points[0].y,
            });
        }}
        onPointerUp={end}
        onPointerCancel={end}
        onLostPointerCapture={end}
        onKeyDown={(event) => {
          if (busy || event.nativeEvent.isComposing) return;
          const delta: Record<string, number[]> = {
            ArrowLeft: [-12, 0],
            ArrowRight: [12, 0],
            ArrowUp: [0, -12],
            ArrowDown: [0, 12],
          };
          if (delta[event.key]) {
            event.preventDefault();
            change({
              ...crop,
              x: crop.x + delta[event.key][0],
              y: crop.y + delta[event.key][1],
            });
          }
        }}
      />
      <p className="crop-help">
        드래그로 이동 · 두 손가락으로 확대 · 방향키 지원
      </p>
      <label className="crop-zoom">
        −
        <input
          type="range"
          min="1"
          max="3"
          step=".01"
          value={crop.zoom}
          disabled={busy}
          aria-label="사진 확대"
          onChange={(event) =>
            change({ ...crop, zoom: Number(event.target.value) })
          }
        />
        ＋
      </label>
      <button
        className="primary-btn"
        disabled={busy}
        onClick={() => {
          const output = document.createElement('canvas');
          output.width = output.height = 1024;
          const ctx = output.getContext('2d');
          if (!ctx) return;
          const scale =
            Math.max(480 / image.width, 480 / image.height) * crop.zoom;
          const factor = 1024 / 480;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 1024, 1024);
          ctx.drawImage(
            image,
            (240 + crop.x - (image.width * scale) / 2) * factor,
            (240 + crop.y - (image.height * scale) / 2) * factor,
            image.width * scale * factor,
            image.height * scale * factor,
          );
          output.toBlob(
            (blob) => {
              if (blob) onConfirm(blob);
            },
            'image/jpeg',
            0.94,
          );
        }}
      >
        {busy ? '저장 중…' : '확정'}
      </button>
    </div>
  );
}
