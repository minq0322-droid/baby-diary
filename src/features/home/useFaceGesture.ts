import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
export type DragDetail = {
  phase: 'pick' | 'move' | 'release' | 'cancel';
  x: number;
  y: number;
  vx: number;
  vy: number;
};
export function useFaceGesture(onMenu: () => void, setBubble: (value: boolean) => void) {
  const button = useRef<HTMLButtonElement>(null);
  const press = useRef<{
    id: number;
    x: number;
    y: number;
    ready: boolean;
    dragging: boolean;
    cancelled: boolean;
    samples: {
      x: number;
      y: number;
      t: number;
    }[];
  }>();
  const timer = useRef(0);
  const suppress = useRef(false);
  const emit = (detail: DragDetail) => button.current?.dispatchEvent(new CustomEvent('home-drag', {
    bubbles: true,
    detail
  }));
  useEffect(() => {
    const node = button.current;
    const stopScroll = (event: TouchEvent) => {
      if (press.current?.ready && event.cancelable) event.preventDefault();
    };
    node?.addEventListener('touchmove', stopScroll, {
      passive: false
    });
    return () => {
      clearTimeout(timer.current);
      node?.removeEventListener('touchmove', stopScroll);
    };
  }, []);
  const finish = (event: ReactPointerEvent<HTMLButtonElement>, cancel = false) => {
    const current = press.current;
    if (!current || current.id !== event.pointerId) return;
    clearTimeout(timer.current);
    if (current.dragging) {
      const last = current.samples.at(-1)!;
      const first = current.samples.find(sample => sample.t >= event.timeStamp - 80) ?? last;
      const seconds = Math.max(0.001, (event.timeStamp - first.t) / 1000);
      emit({
        phase: cancel ? 'cancel' : 'release',
        x: event.clientX,
        y: event.clientY,
        vx: Math.max(-1800, Math.min(1800, (last.x - first.x) / seconds)),
        vy: Math.max(-1800, Math.min(1800, (last.y - first.y) / seconds))
      });
    } else if (current.ready && !cancel && !current.cancelled) onMenu();
    suppress.current = current.ready || current.cancelled || cancel;
    setBubble(false);
    press.current = undefined;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return {
    ref: button,
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (!event.isPrimary || event.button !== 0 || press.current) return;
      suppress.current = false;
      const current = {
        id: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        ready: false,
        dragging: false,
        cancelled: false,
        samples: [{
          x: event.clientX,
          y: event.clientY,
          t: event.timeStamp
        }]
      };
      press.current = current;
      event.currentTarget.setPointerCapture(event.pointerId);
      timer.current = window.setTimeout(() => {
        current.ready = true;
        setBubble(true);
      }, 550);
    },
    onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => {
      const current = press.current;
      if (!current || current.id !== event.pointerId || current.cancelled) return;
      const moved = Math.hypot(event.clientX - current.x, event.clientY - current.y) > 6;
      if (!current.ready && moved) {
        clearTimeout(timer.current);
        current.cancelled = true;
        suppress.current = true;
        return;
      }
      if (current.ready && moved && !current.dragging) {
        current.dragging = true;
        suppress.current = true;
        setBubble(false);
        emit({
          phase: 'pick',
          x: current.x,
          y: current.y,
          vx: 0,
          vy: 0
        });
      }
      if (current.dragging) {
        event.preventDefault();
        current.samples.push({
          x: event.clientX,
          y: event.clientY,
          t: event.timeStamp
        });
        current.samples = current.samples.filter(sample => sample.t >= event.timeStamp - 100);
        emit({
          phase: 'move',
          x: event.clientX,
          y: event.clientY,
          vx: 0,
          vy: 0
        });
      }
    },
    onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => finish(event),
    onPointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) => finish(event, true),
    onLostPointerCapture: (event: ReactPointerEvent<HTMLButtonElement>) => finish(event, true),
    shouldOpen: () => !suppress.current,
    onContextMenu: (event: React.MouseEvent) => event.preventDefault()
  };
}
