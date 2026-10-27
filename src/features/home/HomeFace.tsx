import { useRef, useState, useEffect } from 'react';
import type { DataStore } from '../../data/DataStore';
import type { Child } from '../../data/types';
import { dayCounter } from '../../lib/date';
import { lanternArt } from './artwork';
import { ProfilePortrait } from './ProfilePortrait';

export function HomeFace({
  child,
  store,
  days,
  date,
  onOpen,
  onMenu,
}: {
  child: Child;
  store: DataStore;
  days: boolean[];
  date: string;
  onOpen: () => void;
  onMenu: () => void;
}) {
  const timer = useRef(0);
  const held = useRef(false);
  const start = useRef({ x: 0, y: 0 });
  const [bubble, setBubble] = useState(false);
  const counter = dayCounter(child, date);
  const summary = `${counter} · 최근 30일 중 ${days.filter(Boolean).length}일 기록`;
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const clear = () => window.clearTimeout(timer.current);
  return (
    <button
      className={`home-face${days.every(Boolean) ? ' complete' : ''}`}
      aria-label={[
        child.name,
        counter,
        `최근 30일 중 ${days.filter(Boolean).length}일 기록`,
        '오늘 페이지 열기. 메뉴는 길게 누르세요.',
      ]
        .filter(Boolean)
        .join(', ')}
      onPointerDown={(event) => {
        held.current = false;
        start.current = { x: event.clientX, y: event.clientY };
        timer.current = window.setTimeout(() => {
          held.current = true;
          setBubble(true);
          onMenu();
        }, 550);
      }}
      onPointerMove={(event) => {
        if (
          Math.hypot(
            event.clientX - start.current.x,
            event.clientY - start.current.y,
          ) > 10
        ) {
          clear();
          held.current = true;
        }
      }}
      onPointerUp={clear}
      onPointerCancel={clear}
      onPointerLeave={() => {
        clear();
        setBubble(false);
      }}
      onFocus={() => setBubble(true)}
      onBlur={() => setBubble(false)}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setBubble(true);
      }}
      onContextMenu={(event) => {
        event.preventDefault();
        onMenu();
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
        if (!held.current || event.detail === 0) onOpen();
        held.current = false;
      }}
    >
      <svg className="sun-art" viewBox="0 0 160 160" aria-hidden="true">
        <defs>
          <linearGradient id={`sun-${child.id}`} x1="0" y1="1" x2="0" y2="0">
            <stop stopColor="#ecaa47" />
            <stop offset=".55" stopColor="#ffd779" />
            <stop offset="1" stopColor="#fff2b4" />
          </linearGradient>
        </defs>
        <circle cx="80" cy="80" r="65" fill="#ffd987" opacity=".12" />
        {days.map((lit, day) => (
          <g
            key={day}
            className={lit ? 'animated-ray' : undefined}
            data-day={day}
            transform={`rotate(${day * 12} 80 80)`}
          >
            <path
              className={lit ? 'animated-mark' : 'unlit-ray'}
              fill={lit ? `url(#sun-${child.id})` : 'none'}
              d="M80 23 C72 17 77 9 80 -1.5 C84 9 88 17 80 23Z"
            />
          </g>
        ))}
      </svg>
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
