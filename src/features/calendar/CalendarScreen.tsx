import type { DataStore } from '../../data/DataStore';
import { useState } from 'react';
import type { StoreSnapshot } from '../../data/types';
import { addDays, fromKey } from '../../lib/date';
import { Icon } from '../../components/Icon';
import { MonthGrid } from './MonthGrid';
import { DayPreview } from './DayPreview';

type Props = {
  store: DataStore;
  snapshot: StoreSnapshot;
  openPage: (date: string, childId: string, authorId?: 'dad' | 'mom') => void;
  date: string;
  setDate: (date: string) => void;
};

export function CalendarScreen({
  store,
  snapshot,
  openPage,
  date,
  setDate,
}: Props) {
  const [month, setMonth] = useState(date.slice(0, 7));
  const first = fromKey(`${month}-01`);

  return (
    <div className="screen-scroll calendar-screen">
      <h1 className="screen-title">달력</h1>
      <div className="month-nav">
        <button
          type="button"
          aria-label="이전 달"
          onClick={() => setMonth(addDays(`${month}-01`, -1).slice(0, 7))}
        >
          <Icon name="back" />
        </button>
        <h2>
          {first.getFullYear()}년 {first.getMonth() + 1}월
        </h2>
        <button
          type="button"
          aria-label="다음 달"
          onClick={() => setMonth(addDays(`${month}-01`, 32).slice(0, 7))}
        >
          <Icon name="arrow" />
        </button>
      </div>
      <MonthGrid
        children={snapshot.children}
        month={month}
        date={date}
        pages={snapshot.pages}
        onSelect={setDate}
      />
      <div className="legend">
        {snapshot.children.map((child) => (
          <span key={child.id}>
            <i className="dot" style={{ background: child.pageColor }} />
            {child.name}
          </span>
        ))}
      </div>
      <DayPreview
        store={store}
        snapshot={snapshot}
        date={date}
        openPage={openPage}
      />
    </div>
  );
}
