type ToastProps = {
  message: string;
  visible: boolean;
  onUndo?: () => void;
};

export function Toast({ message, visible, onUndo }: ToastProps) {
  return (
    <div
      className={`toast${visible ? ' show' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span>{message}</span>
      {onUndo ? (
        <button type="button" onClick={onUndo}>
          되돌리기
        </button>
      ) : null}
    </div>
  );
}
