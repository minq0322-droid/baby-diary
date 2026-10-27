import { useEffect, useId, useRef, type ReactNode } from 'react';
export function DiarySheet({ title, onClose, children }: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const id = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const background = document.querySelector<HTMLElement>('.diary-content');
    if (background)
      background.inert = true;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    return () => {
      if (background)
        background.inert = false;
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (<div
    className="diary-sheet-layer"
    onClick={(event) => {
      if (event.target === event.currentTarget)
        onClose();
    }}>
    <section
      ref={ref}
      tabIndex={-1}
      className="sheet"
      role="dialog"
      aria-modal="true"
      aria-labelledby={id}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing)
          return;
        if (event.key === 'Escape')
          onClose();
        if (event.key !== 'Tab')
          return;
        const controls = Array.from(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, textarea') ?? []);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
          event.preventDefault();
          last?.focus();
        }
        else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}>
      <div className="handle" />
      <div className="sheet-head"><h3 id={id}>{title}</h3><button onClick={onClose}>완료</button></div>
      {children}
    </section>
  </div>);
}
