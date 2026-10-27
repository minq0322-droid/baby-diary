import { useState, type CSSProperties } from 'react';
import { DayMarks } from './DayMarks';
import { useFaceGesture } from './useFaceGesture';
import type { DataStore } from '../../data/DataStore';
import type { Child } from '../../data/types';
import { dayCounter } from '../../lib/date';
import { lanternArt } from './artwork';
import { ProfilePortrait } from './ProfilePortrait';

export function HomeFace({
  dayStyle,
  child,
  store,
  days,
  date,
  onOpen,
  onMenu,
}: {
  dayStyle: 'sunset' | 'dandelion';
  child: Child;
  store: DataStore;
  days: boolean[];
  date: string;
  onOpen: () => void;
  onMenu: () => void;
}) {
  const [bubble, setBubble] = useState(false);
  const counter = dayCounter(child, date);
  const summary = `${counter} · 최근 30일 중 ${days.filter(Boolean).length}일 기록`;
  const { shouldOpen, ...gesture } = useFaceGesture(onMenu, setBubble);
  return (
    <button
      {...gesture}
      style={{ '--kid-color': child.pageColor } as CSSProperties}
      className={`home-face${days.every(Boolean) ? ' complete' : ''}`}
      aria-label={[
        child.name,
        counter,
        `최근 30일 중 ${days.filter(Boolean).length}일 기록`,
        '오늘 페이지 열기. 메뉴는 길게 누르세요.',
      ]
        .filter(Boolean)
        .join(', ')}
      onFocus={() => setBubble(true)}
      onBlur={() => setBubble(false)}
      onPointerLeave={() => setBubble(false)}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setBubble(true);
      }}
      onKeyDown={(event) => {
        if (
          (event.key === 'F10' && event.shiftKey) ||
          event.key === 'ContextMenu'
        ) {
          event.preventDefault();
          onMenu();
        }
      }}
      onClick={(event) => {
        if (shouldOpen() || event.detail === 0) onOpen();
      }}
    >
      {dayStyle === 'dandelion' && (
        <svg
          className="day-stem"
          viewBox="0 0 90 240"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M45 0C40 80 62 145 42 240"
            fill="none"
            stroke="#729779"
            strokeWidth="2.1"
          />
          <path
            d="M49 148Q14 140 10 110Q38 120 49 148M49 201Q80 175 84 155Q57 165 49 201"
            fill="#8eaf85"
            opacity=".65"
          />
        </svg>
      )}
      <DayMarks days={days} style={dayStyle} />
      <svg className="moon-art" viewBox="0 0 160 160" aria-hidden="true">
        <circle cx="80" cy="80" r="72" fill="#bddcff" opacity=".07" />
        {days.map((lit, day) => (
          <g key={day} transform={`rotate(${day * 12} 80 80)`}>
            {lit ? (
              <path
                className="animated-mark lit-star"
                d="M80 13L81.5 17.5L86 19L81.5 20.5L80 25L78.5 20.5L74 19L78.5 17.5Z"
              />
            ) : (
              <circle cx="80" cy="19" r="1.15" fill="#a9c3e2" opacity=".24" />
            )}
          </g>
        ))}
      </svg>
      <svg className="lantern-art" viewBox="0 0 160 160" aria-hidden="true">
        <g
          dangerouslySetInnerHTML={{
            __html: lanternArt
              .split('lantern-frame')
              .join(`lantern-${child.id}`),
          }}
        />
        <path
          d="M40 167L12 183Q80 209 148 183L120 167"
          fill="none"
          stroke="#d8b27b"
          strokeOpacity=".38"
          strokeWidth=".5"
        />
        {days.map((lit, day) => {
          const p = (29 - day) / 29;
          return (
            <circle
              key={day}
              className={lit ? 'animated-mark lit-bead' : 'unlit-bead'}
              cx={12 + p * 136}
              cy={183 + 13 * Math.sin(p * Math.PI)}
              r="1.7"
            />
          );
        })}
      </svg>
      <span className="home-portrait">
        <ProfilePortrait child={child} store={store} />
        <span className="moon-texture" />
      </span>
      <span
        className={`home-bubble${bubble ? ' visible' : ''}`}
        aria-hidden="true"
      >
        {summary}
      </span>
    </button>
  );
}
