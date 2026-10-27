import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { DataStore } from '../../data/DataStore';
import type { Page, Stroke } from '../../data/types';
import { downscalePhoto } from '../../lib/image';
import { simplifyStroke } from '../../lib/stroke';
import { penColors } from '../../lib/pageColors';
import { useDarkMode } from '../../lib/usePageColorStyle';
import { paintStroke } from './strokes';
import { PhotoFrame } from './PhotoFrame';
import {
  clampView,
  clearDrawing,
  initialView,
  normalizedPoint,
  undoDrawing,
  type View,
} from './drawingView';

export function DrawingArea({ page, store, editing, onChange, onError, onBusy, onDrawing }: {
  page: Page;
  store: DataStore;
  editing: boolean;
  onChange: (page: Page) => void;
  onError: (message: string) => void;
  onBusy: (busy: boolean) => void;
  onDrawing: (drawing: boolean) => void;
}) {
  const [drawing, setDrawing] = useState(false);
  const [stroking, setStroking] = useState(false);
  const [penWidth, setPenWidth] = useState<2 | 5>(2);
  const [eraserWidth, setEraserWidth] = useState<8 | 14 | 28>(14);
  const [eraser, setEraser] = useState(false);
  const [penColor, setPenColor] = useState('ink');
  const [popover, setPopover] = useState<'pen' | 'eraser'>();
  const [view, setView] = useState<View>(initialView);
  const viewRef = useRef(view);
  viewRef.current = view;
  const [undo, setUndo] = useState<Stroke[][]>([]);
  const box = useRef<HTMLDivElement>(null);
  const base = useRef<HTMLCanvasElement>(null);
  const live = useRef<HTMLCanvasElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const tray = useRef<HTMLDivElement>(null);
  const active = useRef<{ id: number; stroke: Stroke }>();
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ distance: number; x: number; y: number; view: View }>();
  const pan = useRef<{ id: number; x: number; y: number; view: View }>();
  const spaceHeld = useRef(false);
  const [gesturing, setGesturing] = useState(false);
  const mounted = useRef(true);
  const latestPage = useRef(page);
  latestPage.current = page;
  const dark = useDarkMode();
  useEffect(() => { onDrawing(drawing && editing); }, [drawing, editing, onDrawing]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (!popover) return;
    const outside = (event: globalThis.PointerEvent) => {
      if (!tray.current?.contains(event.target as Node)) setPopover(undefined);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [popover]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key === ' ') spaceHeld.current = true;
      if (event.key === 'Escape') setPopover(undefined);
      if (event.isComposing || !drawing || !editing) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        const next = undoDrawing({ drawing: latestPage.current.drawing, undo });
        setUndo(next.undo);
        onChange({ ...latestPage.current, drawing: next.drawing });
      }
    };
    const keyup = (event: KeyboardEvent) => {
      if (event.key === ' ') spaceHeld.current = false;
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    return () => {
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
    };
  }, [drawing, editing, onChange, undo]);
  useEffect(() => {
    const canvas = base.current!;
    const overlay = live.current!;
    const redraw = () => {
      // Layout size, not getBoundingClientRect: the page opens with a scale-up animation,
      // and measuring mid-animation left the canvas at a fraction of its real resolution.
      const rect = { width: box.current!.clientWidth, height: box.current!.clientHeight };
      const clamped = clampView(viewRef.current, rect.width, rect.height);
      if (clamped.x !== viewRef.current.x || clamped.y !== viewRef.current.y) {
        viewRef.current = clamped;
        setView(clamped);
      }
      const ratio = Math.min((window.devicePixelRatio || 1) * view.zoom, 4096 / Math.max(rect.width, rect.height));
      for (const layer of [canvas, overlay]) {
        layer.width = Math.max(1, Math.round(rect.width * ratio));
        layer.height = Math.max(1, Math.round(rect.height * ratio));
        layer.getContext('2d')?.setTransform(layer.width / rect.width, 0, 0, layer.height / rect.height, 0, 0);
      }
      const context = canvas.getContext('2d');
      if (context) page.drawing.forEach(stroke => paintStroke(context, stroke, rect.width, rect.height, getComputedStyle(canvas).color, rect.width / 300));
      base.current!.style.visibility = '';
    };
    const observer = new ResizeObserver(redraw);
    observer.observe(box.current!);
    redraw();
    return () => observer.disconnect();
  }, [page.drawing, page.color, dark, view.zoom]);
  const finish = (cancel = false) => {
    const current = active.current;
    if (!current) return;
    active.current = undefined;
    setStroking(false);
    base.current!.style.visibility = '';
    const rect = box.current!.getBoundingClientRect();
    live.current!.getContext('2d')?.clearRect(0, 0, rect.width, rect.height);
    if (!cancel) {
      if (undo.length) setUndo(items => [...items, latestPage.current.drawing].slice(-10));
      onChange({ ...latestPage.current, drawing: [...latestPage.current.drawing, simplifyStroke(current.stroke, rect.width * viewRef.current.zoom, rect.height * viewRef.current.zoom)] });
    }
  };
  const paintLive = () => {
    if (!active.current) return;
    const rect = box.current!.getBoundingClientRect();
    const context = live.current!.getContext('2d')!;
    context.clearRect(0, 0, rect.width, rect.height);
    if (active.current.stroke.color === 'erase') {
      context.drawImage(base.current!, 0, 0, rect.width, rect.height);
      base.current!.style.visibility = 'hidden';
    }
    paintStroke(context, active.current.stroke, rect.width, rect.height, getComputedStyle(live.current!).color, rect.width / 300);
  };
  const pair = () => {
    const [a, b] = [...pointers.current.values()];
    return { distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  };
  const point = (event: { clientX: number; clientY: number }) => {
    const rect = box.current!.getBoundingClientRect();
    return normalizedPoint(event.clientX - rect.left, event.clientY - rect.top, rect.width, rect.height, viewRef.current);
  };
  const endPointer = (event: PointerEvent<HTMLDivElement>, cancel: boolean) => {
    if (active.current?.id === event.pointerId) finish(cancel);
    pointers.current.delete(event.pointerId);
    gesture.current = undefined;
    if (!pointers.current.size) setGesturing(false);
  };
  return (
    <div className={`art${drawing && editing ? ' drawing' : ''}${!stroking && !page.drawing.length && !page.photos.length ? ' empty' : ''}`}>
      <div ref={box} className="art-box"
        onWheel={(event) => {
          if (!editing || !drawing || !event.ctrlKey) return;
          event.preventDefault();
          const rect = box.current!.getBoundingClientRect();
          const oldZoom = viewRef.current.zoom;
          const zoom = Math.max(1, Math.min(4, oldZoom * Math.pow(1.0015, -event.deltaY)));
          const scale = zoom / oldZoom;
          const x = event.clientX - rect.left;
          const y = event.clientY - rect.top;
          const next = clampView({
            zoom,
            x: x - (x - viewRef.current.x) * scale,
            y: y - (y - viewRef.current.y) * scale,
          }, rect.width, rect.height);
          viewRef.current = next;
          setView(next);
        }}
        onPointerDownCapture={(event) => {
          if (!editing || !drawing) return;
          if (event.button === 1 || spaceHeld.current) {
            pan.current = { id: event.pointerId, x: event.clientX, y: event.clientY, view: viewRef.current };
            box.current!.setPointerCapture(event.pointerId);
            event.preventDefault();
            event.stopPropagation();
            return;
          }
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pointers.current.size >= 2) {
            finish(true);
            setGesturing(true);
            gesture.current = { ...pair(), view: viewRef.current };
            box.current!.setPointerCapture(event.pointerId);
            event.stopPropagation();
            return;
          }
          if ((event.target as HTMLElement).closest('.polaroid')) return;
          box.current!.setPointerCapture(event.pointerId);
          active.current = { id: event.pointerId, stroke: { color: eraser ? 'erase' : penColor, width: eraser ? eraserWidth : penWidth, points: point(event) } };
          setStroking(true);
          paintLive();
        }}
        onPointerMoveCapture={(event) => {
          if (pan.current?.id === event.pointerId) {
            const next = clampView({
              ...pan.current.view,
              x: pan.current.view.x + event.clientX - pan.current.x,
              y: pan.current.view.y + event.clientY - pan.current.y,
            }, box.current!.clientWidth, box.current!.clientHeight);
            viewRef.current = next;
            setView(next);
            return;
          }
          if (!pointers.current.has(event.pointerId)) return;
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pointers.current.size >= 2 && gesture.current) {
            event.stopPropagation();
            const next = pair();
            const start = gesture.current;
            const rect = box.current!.getBoundingClientRect();
            const zoom = Math.max(1, Math.min(4, start.view.zoom * next.distance / start.distance));
            const scale = zoom / start.view.zoom;
            const updated = clampView({
              zoom,
              x: next.x - rect.left - (start.x - rect.left - start.view.x) * scale,
              y: next.y - rect.top - (start.y - rect.top - start.view.y) * scale,
            }, rect.width, rect.height);
            viewRef.current = updated;
            setView(updated);
            return;
          }
          if (active.current?.id !== event.pointerId) return;
          const samples = event.nativeEvent.getCoalescedEvents?.();
          for (const sample of samples?.length ? samples : [event.nativeEvent]) active.current.stroke.points.push(...point(sample));
          paintLive();
        }}
        onPointerUpCapture={event => {
          if (pan.current?.id === event.pointerId) pan.current = undefined;
          else endPointer(event, false);
        }}
        onPointerCancelCapture={event => {
          if (pan.current?.id === event.pointerId) pan.current = undefined;
          else endPointer(event, true);
        }}
        onLostPointerCapture={event => {
          if (pan.current?.id === event.pointerId) pan.current = undefined;
          else endPointer(event, true);
        }}>
        <div className="art-surface" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}>
          <canvas ref={base} aria-hidden="true" />
          <canvas ref={live} className="live-stroke" tabIndex={editing ? 0 : -1} role="button" aria-label="그림 영역, 눌러서 그리기"
            onClick={() => { if (editing) setDrawing(true); }}
            onKeyDown={event => {
              if (!event.nativeEvent.isComposing && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                if (editing) setDrawing(true);
              }
            }} />
          {page.photos.map(photo => (
            <PhotoFrame key={photo.id} store={store} photo={photo}
              editing={editing && drawing} cancelGesture={gesturing}
              onChange={next => onChange({
                ...latestPage.current,
                photos: latestPage.current.photos.map(item => item.id === next.id ? next : item),
              })} />
          ))}
        </div>
      </div>
      {drawing && editing && (
        <div ref={tray} className="tray" aria-label="그리기 도구">
          {popover && (
            <div className="tool-popover" role="group" aria-label={popover === 'pen' ? '펜 설정' : '지우개 설정'}>
              {popover === 'pen' ? (
                <>
                  <div className="thickness-options">
                    {([2, 5] as const).map(width => (
                      <button key={width} aria-pressed={!eraser && penWidth === width}
                        onClick={() => {
                          setPenWidth(width);
                          setEraser(false);
                        }}>
                        {width === 2 ? '가는 펜' : '굵은 펜'}
                      </button>
                    ))}
                  </div>
                  <div className="pen-colors">
                    {penColors.map(([label, color]) => (
                      <button key={color} aria-label={label} aria-pressed={!eraser && penColor === color}
                        onClick={() => {
                          setPenColor(color);
                          setEraser(false);
                          setPopover(undefined);
                        }}>
                        <span className="pen-color-dot" style={{ background: color === 'ink' ? 'var(--page-ink)' : color }} />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="thickness-options">
                    {([8, 14, 28] as const).map((width, index) => (
                      <button key={width} aria-pressed={eraserWidth === width}
                        onClick={() => {
                          setEraserWidth(width);
                          setEraser(true);
                          setPopover(undefined);
                        }}>
                        {['작게', '보통', '크게'][index]}
                      </button>
                    ))}
                  </div>
                  <button disabled={!page.drawing.length} onClick={() => {
                    const next = clearDrawing({ drawing: page.drawing, undo });
                    setUndo(next.undo);
                    onChange({ ...page, drawing: next.drawing });
                    setPopover(undefined);
                  }}>전부 지우기</button>
                </>
              )}
            </div>
          )}
          <div className="tray-tools">
            <button aria-pressed={!eraser} aria-expanded={popover === 'pen'}
              onClick={() => setPopover(popover === 'pen' ? undefined : 'pen')}>
              <span className="pen-glyph">✎<i style={{ background: penColor === 'ink' ? 'var(--page-ink)' : penColor }} /></span>
              펜
            </button>
            <button aria-pressed={eraser} aria-expanded={popover === 'eraser'} onClick={() => {
              if (eraser) setPopover(popover === 'eraser' ? undefined : 'eraser');
              else {
                setEraser(true);
                setPopover(undefined);
              }
            }}><span>▱</span>지우개</button>
            <button disabled={!page.drawing.length && !undo.length} onClick={() => {
              const next = undoDrawing({ drawing: page.drawing, undo });
              setUndo(next.undo);
              onChange({ ...page, drawing: next.drawing });
            }}><span>↶</span>되돌리기</button>
            <button onClick={() => file.current?.click()}><span>▧</span>사진</button>
            <button aria-label={`확대, 현재 ${view.zoom.toFixed(1)}배`} onClick={() => {
              finish();
              const rect = box.current!.getBoundingClientRect();
              const zoom = view.zoom < 2 ? 2 : view.zoom < 3 ? 3 : 1;
              setView(clampView({
                zoom,
                x: rect.width / 2 - (rect.width / 2 - view.x) * zoom / view.zoom,
                y: rect.height / 2 - (rect.height / 2 - view.y) * zoom / view.zoom,
              }, rect.width, rect.height));
            }}><span>{Number(view.zoom.toFixed(1))}×</span>확대</button>
            <button onClick={() => {
              finish();
              setDrawing(false);
              setPopover(undefined);
              setView(initialView);
            }}><span>✓</span>완료</button>
          </div>
        </div>
      )}
      <input ref={file} type="file" accept="image/*" hidden onChange={async event => {
        const photo = event.target.files?.[0];
        event.target.value = '';
        if (!photo) return;
        onBusy(true);
        try {
          const uploaded = await store.uploadPhoto(await downscalePhoto(photo));
          if (mounted.current) onChange({ ...latestPage.current, photos: [...latestPage.current.photos, { id: crypto.randomUUID(), src: uploaded.src, x: .2, y: .12, w: .6, rotation: -4 }] });
        } catch {
          if (mounted.current) onError('사진을 불러오지 못했어요. 다시 골라 주세요.');
        } finally {
          if (mounted.current) onBusy(false);
        }
      }} />
    </div>
  );
}
