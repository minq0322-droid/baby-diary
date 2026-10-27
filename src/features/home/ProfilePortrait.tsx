import { useEffect, useState } from 'react';
import type { DataStore } from '../../data/DataStore';
import type { Child } from '../../data/types';

export function ProfilePortrait({
  child,
  store,
  src = child.photo?.src,
}: {
  child: Child;
  store: DataStore;
  src?: string;
}) {
  const [resolved, setResolved] = useState('');
  useEffect(() => {
    let active = true;
    setResolved('');
    if (src)
      void (store.resolvePhotoSrc?.(src) ?? Promise.resolve(src))
        .then((url) => {
          if (active) setResolved(url);
        })
        .catch(() => {
          /* The illustrated placeholder remains available. */
        });
    return () => {
      active = false;
    };
  }, [src, store]);
  return resolved ? (
    <img
      className="profile-image"
      src={resolved}
      alt=""
      onError={() => setResolved('')}
    />
  ) : (
    <svg
      className="profile-placeholder"
      viewBox="0 0 200 200"
      aria-hidden="true"
    >
      <rect width="200" height="200" fill={child.pageColor} />
      <ellipse cx="100" cy="205" rx="65" ry="55" fill="#f6f0dd" />
      <ellipse cx="100" cy="98" rx="57" ry="62" fill="#f9e2c7" />
      <path
        d="M73 101q5-6 10 0M117 101q5-6 10 0M91 124q9 10 18 0"
        fill="none"
        stroke="#8a7056"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <ellipse cx="67" cy="117" rx="10" ry="6" fill="#ecb0a1" opacity=".5" />
      <ellipse cx="134" cy="117" rx="10" ry="6" fill="#ecb0a1" opacity=".5" />
    </svg>
  );
}
