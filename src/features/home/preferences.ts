import { useEffect, useState } from 'react';

export type HomePreferences = {
  day: 'sunset' | 'dandelion';
  night: 'moon' | 'lantern';
};
const defaults: HomePreferences = { day: 'sunset', night: 'moon' };
let memory: HomePreferences | undefined;

export function normalizeHomePreferences(saved: unknown): HomePreferences {
  const value = saved && typeof saved === 'object' ? saved : {};
  return {
    day: 'day' in value && value.day === 'dandelion' ? 'dandelion' : 'sunset',
    night: 'night' in value && value.night === 'lantern' ? 'lantern' : 'moon',
  };
}

function read(): HomePreferences {
  if (memory) return memory;
  try {
    const saved = JSON.parse(localStorage.getItem('yuga-home') ?? '{}');
    return normalizeHomePreferences(saved);
  } catch {
    return defaults;
  }
}
export function useHomePreferences() {
  const [value, setValue] = useState(read);
  useEffect(() => {
    const update = () => {
      memory = undefined;
      setValue(read());
    };
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  }, []);
  const change = (next: HomePreferences) => {
    memory = next;
    setValue(next);
    try {
      localStorage.setItem('yuga-home', JSON.stringify(next));
    } catch {
      /* Viewer preference remains active in memory. */
    }
  };
  return [value, change] as const;
}
