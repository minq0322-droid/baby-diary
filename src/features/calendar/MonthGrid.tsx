import type { Child, Page } from '../../data/types';
import { addDays, fromKey, todayKey } from '../../lib/date';

type Props = {
  month: string;
  date: string;
  pages: Page[];
  children: Child[];
  onSelect: (date: string) => void;
};

export function MonthGrid({ month, date, pages, children, onSelect }: Props) {
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
          return (
            <button
              type="button"
              key={day}
              className={`day${day === todayKey() ? ' today' : ''}${day === date ? ' selected' : ''}`}
              aria-label={`${day} 기록 ${dayPages.length}개`}
              aria-pressed={day === date}
              onClick={() => onSelect(day)}
            >
              <span className="day-num">{day.slice(-2).replace(/^0/, '')}</span>
              <span className="dots">
                {dayPages.map((page) => (
                  <i
                    key={page.id}
                    style={{
                      background:
                        page.color ??
                        children.find((child) => child.id === page.childId)
                          ?.pageColor,
                    }}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
