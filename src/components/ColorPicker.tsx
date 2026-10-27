import { useState } from 'react';
import { namedPageColors, pageColors, pageColorStyle } from '../lib/pageColors';
import { useDarkMode } from '../lib/usePageColorStyle';

const recommended = namedPageColors.slice(0, 3).map(([, color]) => color);

function readRecent(storageKey: string): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
    return Array.isArray(stored)
      ? [...new Set(stored.filter((color): color is string =>
          typeof color === 'string' && pageColors.some((entry) => entry[1] === color),
        ))].filter((color) => !recommended.some((item) => item === color)).slice(0, 5)
      : [];
  } catch {
    return [];
  }
}

export function ColorPicker({ value, onChange, viewerId }: {
  value: string;
  onChange: (color: string) => void;
  viewerId: string;
}) {
  const storageKey = `diary-recent-page-colors:${viewerId}`;
  const [recent, setRecent] = useState(() => readRecent(storageKey));
  const dark = useDarkMode();
  const choose = (color: string) => {
    const next = [color, ...recent, ...readRecent(storageKey)]
      .filter((item, index, all) => all.indexOf(item) === index && !recommended.some((entry) => entry === item))
      .slice(0, 5);
    setRecent(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      // Color selection still works when browser storage is unavailable.
    }
    onChange(color);
  };
  const swatch = (color: string) => {
    const label = namedPageColors.find((entry) => entry[1] === color)?.[0] ?? color;
    return (
      <button
        type="button"
        className="color-swatch"
        key={color}
        aria-label={label}
        aria-pressed={value.toUpperCase() === color}
        onClick={() => choose(color)}
      >
        <span className="color-swatch-dot" style={pageColorStyle(color, dark)}>
          {value.toUpperCase() === color ? '✓' : ''}
        </span>
      </button>
    );
  };
  return (
    <div className="color-picker palette" role="group" aria-label="페이지 색">
      <p className="color-picker-label">추천 색</p>
      <div className="color-recommendations">{[...recommended, ...recent].map(swatch)}</div>
      <div className="pastel-grid" role="group" aria-label="파스텔 색">
        {pageColors.map(([, color]) => swatch(color))}
      </div>
    </div>
  );
}
