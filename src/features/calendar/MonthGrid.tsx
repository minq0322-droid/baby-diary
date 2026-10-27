import type { Child, Page } from '../../data/types';
import { addDays, fromKey, todayKey } from '../../lib/date';
import { useDarkMode } from '../../lib/usePageColorStyle';
import { dayFillSegments } from './dayFill';

type Props = {
  month: string;
  date: string;
  pages: Page[];
  children: Child[];
  onSelect: (date: string) => void;
};

export function MonthGrid({ month, date, pages, children, onSelect }: Props) {
  const dark = useDarkMode();
  const today = todayKey();
  const first = fromKey(`${month}-01`);
  const days = Array.from({ length: 42 }, (_, index) =>
    addDays(`${month}-01`, index - first.getDay()),
  );

  return (
    <>
      <div className="weekdays">
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="month-grid">
        {days.map((day) => {
          const dayPages = pages.filter((page) => page.date === day);
          const segments = dayFillSegments(day, dayPages, children, dark);
          const number = day.slice(-2).replace(/^0/, '');
          return (
            <button
              type="button"
              key={day}
              className={`day${day === today ? ' today' : ''}${day === date ? ' selected' : ''}${day.startsWith(month) ? '' : ' outside'}`}
              aria-label={`${day} 기록 ${dayPages.length}개`}
              aria-current={day === today ? 'date' : undefined}
              aria-pressed={day === date}
              onClick={() => onSelect(day)}
            >
              <span className="day-tile" aria-hidden="true">
                {/* Clip the same centered number with each fill so its ink
                    contrasts with that segment, even across the split. */}
                {segments.length ? segments.map((segment, index) => (
                  <span
                    className="day-fill-segment"
                    key={segment.childId}
                    style={{
                      background: segment.color,
                      color: segment.ink,
                      clipPath: `inset(0 ${100 - (index + 1) * 100 / segments.length}% 0 ${index * 100 / segments.length}%)`,
                    }}
                  >
                    {number}
                  </span>
                )) : number}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
