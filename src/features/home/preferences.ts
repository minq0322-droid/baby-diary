import { useEffect, useState } from 'react';

export type HomePreferences = {
  night: 'moon' | 'lantern';
  stars: 'twinkle' | 'drift';
};
const defaults: HomePreferences = { night: 'moon', stars: 'twinkle' };
let memory: HomePreferences | undefined;
function read(): HomePreferences {
  if (memory) return memory;
  try {
    const saved = JSON.parse(localStorage.getItem('yuga-home') ?? '{}');
    return {
      night: saved.night === 'lantern' ? 'lantern' : 'moon',
      stars: saved.stars === 'drift' ? 'drift' : 'twinkle',
    };
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
