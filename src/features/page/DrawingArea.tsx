import { useEffect, useRef, useState } from 'react';
import type { DataStore } from '../../data/DataStore';
import type { Page, Stroke } from '../../data/types';
import { downscalePhoto } from '../../lib/image';
import { simplifyStroke } from '../../lib/stroke';
import { penColors } from '../../lib/pageColors';
import { useDarkMode } from '../../lib/usePageColorStyle';
import { paintStroke } from './strokes';
import { PhotoFrame } from './PhotoFrame';
export function DrawingArea({ page, store, editing, onChange, onPalette, onError, onBusy, onDrawing }: {
  page: Page;
  store: DataStore;
  editing: boolean;
  onChange: (page: Page) => void;
  onPalette: () => void;
  onError: (message: string) => void;
  onBusy: (busy: boolean) => void;
  onDrawing: (drawing: boolean) => void;
}) {
  const [drawing, setDrawing] = useState(false);
  const [stroking, setStroking] = useState(false);
  const dark = useDarkMode();
  useEffect(() => { onDrawing(drawing && editing); }, [drawing, editing, onDrawing]);
  useEffect(() => {
    if (!import.meta.env.DEV || !drawing || !editing || warnedOverlap.current) return;
    const frame = requestAnimationFrame(() => {
      const canvasRect = live.current?.getBoundingClientRect();
      const trayRect = tray.current?.getBoundingClientRect();
      if (!canvasRect || !trayRect) return;
      const intersects = canvasRect.left < trayRect.right && canvasRect.right > trayRect.left
        && canvasRect.top < trayRect.bottom && canvasRect.bottom > trayRect.top;
      if (intersects) {
        warnedOverlap.current = true;
        console.warn('Drawing canvas overlaps the drawing tray.');
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [drawing, editing]);
  const [tool, setTool] = useState<2 | 5 | 14>(2);
  const [penColor, setPenColor] = useState<string>('ink');
  const base = useRef<HTMLCanvasElement>(null);
  const live = useRef<HTMLCanvasElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const tray = useRef<HTMLDivElement>(null);
  const warnedOverlap = useRef(false);
  const active = useRef<{
    id: number;
    stroke: Stroke;
  }>();
  const mounted = useRef(true);
  const latestPage = useRef(page);
  latestPage.current = page;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    const canvas = base.current!;
    const overlay = live.current!;
    const redraw = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      for (const layer of [canvas, overlay]) {
        layer.width = Math.round(rect.width * ratio);
        layer.height = Math.round(rect.height * ratio);
        layer.getContext('2d')?.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      const context = canvas.getContext('2d');
      if (context)
        page.drawing.forEach((stroke) => paintStroke(context, stroke, rect.width, rect.height, getComputedStyle(canvas).color, rect.width / 300));
    };
    const observer = new ResizeObserver(redraw);
    observer.observe(canvas);
    redraw();
    return () => { observer.disconnect(); };
  }, [page.drawing, page.color, dark]);
  const finish = (cancel = false) => {
    const current = active.current;
    if (!current)
      return;
    active.current = undefined;
    setStroking(false);
    base.current!.style.visibility = '';
    const canvas = live.current!;
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    if (!cancel) {
      const rect = canvas.getBoundingClientRect();
      onChange({ ...page, drawing: [...page.drawing, simplifyStroke(current.stroke, rect.width, rect.height)] });
    }
  };
  return (<div
    onClick={() => {
      if (editing && !drawing) setDrawing(true);
    }}
    className={`art${drawing && editing ? ' drawing' : ''}${!stroking && !page.drawing.length && !page.photos.length ? ' empty' : ''}`}>
    <div className="art-box">
    <canvas ref={base} aria-hidden="true" />
    <canvas
      ref={live}
      className="live-stroke"
      tabIndex={editing ? 0 : -1}
      role="button"
      aria-label="그림 영역, 눌러서 그리기"
      onClick={() => {
        if (editing)
          setDrawing(true);
      }}
      onKeyDown={(event) => {
        if (!event.nativeEvent.isComposing && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          if (editing)
            setDrawing(true);
        }
      }}
      onPointerDown={(event) => {
        if (!editing || !drawing || active.current)
          return;
        setStroking(true);
        event.currentTarget.setPointerCapture(event.pointerId);
        const rect = event.currentTarget.getBoundingClientRect();
        active.current = { id: event.pointerId, stroke: { color: tool === 14 ? 'erase' : penColor, width: tool, points: [(event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height] } };
        const context = event.currentTarget.getContext('2d')!;
        if (tool === 14) {
          context.drawImage(base.current!, 0, 0, rect.width, rect.height);
          base.current!.style.visibility = 'hidden';
        }
        paintStroke(context, active.current.stroke, rect.width, rect.height, getComputedStyle(event.currentTarget).color, rect.width / 300);
      }}
      onPointerMove={(event) => {
        const current = active.current;
        if (!current || current.id !== event.pointerId)
          return;
        const canvas = event.currentTarget;
        const rect = canvas.getBoundingClientRect();
        const points = event.nativeEvent.getCoalescedEvents?.();
        for (const point of points?.length ? points : [event.nativeEvent]) {
          current.stroke.points.push(Math.max(0, Math.min(1, (point.clientX - rect.left) / rect.width)), Math.max(0, Math.min(1, (point.clientY - rect.top) / rect.height)));
        }
        const context = canvas.getContext('2d')!;
        context.clearRect(0, 0, rect.width, rect.height);
        if (tool === 14)
          context.drawImage(base.current!, 0, 0, rect.width, rect.height);
        paintStroke(context, current.stroke, rect.width, rect.height, getComputedStyle(canvas).color, rect.width / 300);
      }}
      onPointerUp={() => finish()}
      onPointerCancel={() => finish(true)}
      onLostPointerCapture={() => finish()} />
    {page.photos.map((photo) => <PhotoFrame
      key={photo.id}
      store={store}
      photo={photo}
      editing={editing && drawing}
      onChange={(next) => onChange({ ...page, photos: page.photos.map((item) => item.id === next.id ? next : item) })} />)}
    </div>
    {drawing && editing && <div ref={tray} className="tray" aria-label="그리기 도구">
      <div className="tray-tools">
      <button aria-pressed={tool === 2} onClick={() => setTool(2)}><span>✎</span>가는 펜</button>
      <button aria-pressed={tool === 5} onClick={() => setTool(5)}><span>✎</span>굵은 펜</button>
      <button aria-pressed={tool === 14} onClick={() => setTool(14)}><span>▱</span>지우개</button>
      <button
        disabled={!page.drawing.length}
        onClick={() => onChange({ ...page, drawing: page.drawing.slice(0, -1) })}><span>↶</span>되돌리기</button>
      <button onClick={() => file.current?.click()}><span>▧</span>사진</button>
      <button onClick={onPalette}><span>◉</span>페이지 색</button>
      <button onClick={(event) => { event.stopPropagation(); finish(); setDrawing(false); }}><span>✓</span>완료</button>
      </div>
      <div className="pen-colors" role="group" aria-label="펜 색">
        {penColors.map(([label, color]) => (
          <button
            key={color}
            type="button"
            aria-label={label}
            aria-pressed={penColor === color && tool !== 14}
            onClick={() => {
              setPenColor(color);
              if (tool === 14) setTool(2);
            }}
          >
            <span className="pen-color-dot" style={{ background: color === 'ink' ? 'var(--page-ink)' : color }} />
          </button>
        ))}
      </div>
    </div>}
    <input
      ref={file}
      type="file"
      accept="image/*"
      hidden
      onChange={async (event) => {
        const photo = event.target.files?.[0];
        event.target.value = '';
        if (!photo)
          return;
        onBusy(true);
        try {
          const uploaded = await store.uploadPhoto(await downscalePhoto(photo));
          if (mounted.current)
            onChange({ ...latestPage.current, photos: [...latestPage.current.photos, { id: crypto.randomUUID(), src: uploaded.src, x: .2, y: .12, w: .6, rotation: -4 }] });
        }
        catch {
          if (mounted.current)
            onError('사진을 불러오지 못했어요. 다시 골라 주세요.');
        }
        finally {
          if (mounted.current)
            onBusy(false);
        }
      }} />
  </div>);
}
