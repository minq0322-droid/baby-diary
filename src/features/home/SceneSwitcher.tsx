import { useEffect, useId, useRef, useState } from 'react';
import { SceneObject, SceneThumbnail } from './SceneArtwork';
import { recordHomeVisit, type SceneChoice } from './sceneChoice';

const groups = [
  { label: '낮', scenes: [{ id: 'sunset', label: '노을' }, { id: 'dandelion', label: '민들레' }] },
  { label: '밤', scenes: [{ id: 'moon', label: '달' }, { id: 'lantern', label: '풍등' }] },
] as const;

export function SceneSwitcher({ current, onChoose }: {
  current: SceneChoice;
  onChoose: (scene: SceneChoice) => void;
}) {
  const [open, setOpen] = useState(false);
  const [shimmer, setShimmer] = useState(false);
  const [keyboardInput, setKeyboardInput] = useState(false);
  const visited = useRef(false);
  const eligible = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const picker = useRef<HTMLDivElement>(null);
  const historyEntry = useRef(false);
  const id = useId();

  useEffect(() => {
    const pointer = () => setKeyboardInput(false);
    const keyboard = () => setKeyboardInput(true);
    document.addEventListener('pointerdown', pointer, true);
    document.addEventListener('keydown', keyboard, true);
    return () => {
      document.removeEventListener('pointerdown', pointer, true);
      document.removeEventListener('keydown', keyboard, true);
    };
  }, []);

  useEffect(() => {
    if (!visited.current) {
      visited.current = true;
      try {
        eligible.current = recordHomeVisit(localStorage);
      } catch {
        // Storage unavailable: skip discovery rather than repeat it forever.
      }
    }
    if (!eligible.current) return;
    const timer = window.setTimeout(() => setShimmer(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  const close = (restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus({ preventScroll: true });
    if (historyEntry.current) {
      historyEntry.current = false;
      window.history.back();
    }
  };

  useEffect(() => {
    if (!open) return;
    picker.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      if (!picker.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) close(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    const back = () => {
      historyEntry.current = false;
      setOpen(false);
      trigger.current?.focus({ preventScroll: true });
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', key);
    window.addEventListener('popstate', back);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', key);
      window.removeEventListener('popstate', back);
    };
  }, [open]);

  useEffect(() => () => {
    if (historyEntry.current) {
      historyEntry.current = false;
      window.history.back();
    }
  }, []);

  return <>
    <button
      ref={trigger}
      type="button"
      className={`scene-switch-object${shimmer ? ' scene-discovery' : ''}`}
      data-keyboard={keyboardInput}
      data-scene={current}
      aria-label="장면 바꾸기"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls={open ? id : undefined}
      onClick={() => {
        if (open) close();
        else {
          try {
            window.history.pushState({ ...window.history.state, homeScenePicker: true }, '');
            historyEntry.current = true;
          } catch {
            // Embedded previews may disallow history updates.
          }
          setOpen(true);
        }
      }}
    ><SceneObject scene={current} /></button>
    {open && <div ref={picker} id={id} role="dialog" aria-label="장면 고르기" className="scene-picker">
      {groups.map((group) => <div key={group.label} role="group" aria-label={group.label} className="scene-picker-group">
        <span>{group.label}</span>
        <div>{group.scenes.map((scene) => <button
          key={scene.id}
          type="button"
          aria-pressed={current === scene.id}
          aria-label={scene.id === 'sunset' ? '노을 언덕' : scene.label}
          onClick={() => {
            close();
            onChoose(scene.id);
          }}
        ><SceneThumbnail scene={scene.id} /><small>{scene.label}</small></button>)}</div>
      </div>)}
    </div>}
  </>;
}
