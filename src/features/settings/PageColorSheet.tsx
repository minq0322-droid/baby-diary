import { useState } from 'react';
import type { DataStore } from '../../data/DataStore';
import type { Child } from '../../data/types';
import { Sheet } from '../../components/Sheet';
import { ColorPicker } from '../../components/ColorPicker';
import { colorTarget } from './colorTarget';

type Props = { store: DataStore; children: Child[]; onClose: () => void };

export function PageColorSheet({ store, children, onClose }: Props) {
  const [target, setTarget] = useState('all');
  const [color, setColor] = useState('#F4B9B8');
  const [confirming, setConfirming] = useState(false);
  const selection = colorTarget(target, children);

  return (
    <Sheet
      title={confirming ? '페이지 색 적용 확인' : '페이지 색 고르기'}
      onClose={onClose}
    >
      {confirming ? (
        <div className="backup-actions">
          <p>
            {selection.label}의 기존 모든 페이지와 기본 페이지 색을 바꿀까요?
          </p>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => setConfirming(false)}
          >
            다시 고르기
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              store.setAllPageColors(color, selection.childId);
              onClose();
            }}
          >
            적용하기
          </button>
        </div>
      ) : (
        <>
          <div
            className="segments"
            role="group"
            aria-label="페이지 색 적용 대상"
          >
            <button
              type="button"
              aria-pressed={target === 'all'}
              onClick={() => setTarget('all')}
            >
              전체
            </button>
            {children.map((child) => (
              <button
                type="button"
                key={child.id}
                aria-pressed={target === child.id}
                onClick={() => setTarget(child.id)}
              >
                {child.name}
              </button>
            ))}
          </div>
          <ColorPicker viewerId={store.getCurrentMemberId()} value={color} onChange={setColor} />
          <button
            type="button"
            className="primary-btn"
            onClick={() => setConfirming(true)}
          >
            다음
          </button>
        </>
      )}
    </Sheet>
  );
}
