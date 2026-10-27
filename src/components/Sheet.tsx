import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type SheetProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  dismissible?: boolean;
};

export function Sheet({
  title,
  onClose,
  children,
  dismissible = true,
}: SheetProps) {
  const titleId = useId();
  const sheet = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const start = useRef<number | null>(null);
  const [drag, setDrag] = useState(0);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const canDismiss = useRef(dismissible);
  canDismiss.current = dismissible;
  const close = () => {
    if (canDismiss.current) setClosing(true);
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => setOpen(true));
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    const app = document.querySelector<HTMLElement>('.app-shell');
    const wasInert = app?.inert ?? false;
    if (app) app.inert = true;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus({ preventScroll: true });
    const trap = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && canDismiss.current) setClosing(true);
      if (event.key !== 'Tab') return;
      const controls = Array.from(
        sheet.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), textarea, input, select, [tabindex="0"]',
        ) ?? [],
      ).filter(
        (element) =>
          element.getClientRects().length &&
          getComputedStyle(element).visibility !== 'hidden' &&
          getComputedStyle(element).opacity !== '0',
      );
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = overflow;
      if (app) app.inert = wasInert;
      document.removeEventListener('keydown', trap);
      previous?.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(
      onClose,
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 350,
    );
    return () => window.clearTimeout(timer);
  }, [closing, onClose]);

  return createPortal(
    <div
      className={`bottom-sheet-layer${open && !closing ? ' sheet-open' : ''}`}
    >
      <button
        type="button"
        className="scrim"
        aria-label="시트 닫기"
        onClick={close}
        disabled={!dismissible}
      />
      <div
        ref={sheet}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={
          drag && !closing
            ? { transform: `translateY(${drag}px)`, transition: 'none' }
            : undefined
        }
        onTouchStart={(event) => {
          if (!canDismiss.current) return;
          const target = event.target as HTMLElement;
          if (
            target.closest('.sheet-handle') ||
            (sheet.current?.scrollTop === 0 &&
              !target.closest(
                'textarea, input, select, button, canvas, .palette',
              ))
          ) {
            start.current = event.touches[0].clientY;
          }
        }}
        onTouchMove={(event) => {
          if (start.current !== null)
            setDrag(Math.max(0, event.touches[0].clientY - start.current));
        }}
        onTouchEnd={(event) => {
          if (
            start.current !== null &&
            event.changedTouches[0].clientY - start.current > 80
          )
            close();
          start.current = null;
          setDrag(0);
        }}
        onTouchCancel={() => {
          start.current = null;
          setDrag(0);
        }}
      >
        <div className="sheet-handle">
          <div className="grab" />
        </div>
        <div className="sheet-head">
          <h3 id={titleId}>{title}</h3>
          <button
            ref={closeButton}
            type="button"
            className="text-btn"
            onClick={close}
            disabled={!dismissible}
          >
            닫기
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
