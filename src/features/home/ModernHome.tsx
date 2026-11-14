import { useEffect, useState } from 'react';
import type { DataStore } from '../../data/DataStore';
import type { StoreSnapshot } from '../../data/types';
import { noteAuthor } from '../../data/migrate';
import { dayCounter, fromKey, todayKey } from '../../lib/date';
import { Sheet } from '../../components/Sheet';
import { Icon } from '../../components/Icon';
import { ProfilePortrait } from './ProfilePortrait';
import { ProfilePhotoSheet } from './ProfilePhotoSheet';
import { writtenDays } from './history';

// 2026-11-14 (작가): 모던 테마의 홈 — 그림 풍경 대신 단정한 아이 카드. 사진 둘레의 30칸 고리 = 최근 30일 중 쓴 날.
// 카드를 누르면 오늘 내 페이지, ⋯ 은 프로필 사진 바꾸기(그림 테마의 길게 누르기와 같은 메뉴).
export function ModernHome({ store, snapshot, openPage, onAll, onCalendar, onSettings }: {
  store: DataStore;
  snapshot: StoreSnapshot;
  openPage: (date: string, childId: string, authorId?: 'dad' | 'mom') => void;
  onAll: () => void;
  onCalendar: () => void;
  onSettings: () => void;
}) {
  const [date, setDate] = useState(todayKey);
  const [menu, setMenu] = useState<string>();
  const [photo, setPhoto] = useState<string>();
  useEffect(() => {
    const update = () => setDate(todayKey());
    const timer = window.setInterval(update, 30000);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  const weekday = '일월화수목금토'[fromKey(date).getDay()];
  const writer = noteAuthor(store.getCurrentMemberId(), snapshot.members);
  const selected = snapshot.children.find((child) => child.id === menu);
  const photoChild = snapshot.children.find((child) => child.id === photo);
  return (
    <main className="modern-home" aria-label="아이 선택 홈">
      <header className="modern-home-head">
        <p>{Number(date.slice(5, 7))}월 {Number(date.slice(8))}일 {weekday}요일</p>
        <h1>오늘의 기록</h1>
      </header>
      <div className="modern-kids">
        {[...snapshot.children]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((child) => {
            const days = writtenDays(snapshot, child.id, date);
            const count = days.filter(Boolean).length;
            const today = snapshot.pages.filter((page) => page.childId === child.id && page.date === date);
            const wrote = (author: 'mom' | 'dad') => today.some((page) => page.authorId === author);
            return (
              <article className="modern-kid" key={child.id}>
                <button
                  className="modern-kid-open"
                  aria-label={`${child.name} · ${dayCounter(child, date)} · 최근 30일 중 ${count}일 기록 · 오늘 쓰기`}
                  onClick={() => openPage(date, child.id, writer)}
                >
                  <span className="modern-ring" aria-hidden="true">
                    <svg viewBox="0 0 100 100">
                      {days.map((on, index) => {
                        // 30 short arcs clockwise from 12 o'clock, today first.
                        const a0 = ((index * 12 + 1.5) * Math.PI) / 180;
                        const a1 = ((index * 12 + 10.5) * Math.PI) / 180;
                        const point = (angle: number) => `${50 + 46 * Math.sin(angle)} ${50 - 46 * Math.cos(angle)}`;
                        return <path key={index} className={on ? 'on' : ''} d={`M${point(a0)} A46 46 0 0 1 ${point(a1)}`} />;
                      })}
                    </svg>
                    <span className="modern-photo">
                      <ProfilePortrait child={child} store={store} />
                    </span>
                  </span>
                  <span className="modern-kid-text">
                    <b>{child.name}</b>
                    <small>{dayCounter(child, date) || ' '}</small>
                    <small>최근 30일 중 {count}일</small>
                  </span>
                  <span className="modern-today" aria-hidden="true">
                    <i className={wrote('mom') ? 'on' : ''}>엄마</i>
                    <i className={wrote('dad') ? 'on' : ''}>아빠</i>
                  </span>
                </button>
                <button className="modern-kid-more" aria-label={`${child.name} 메뉴`} onClick={() => setMenu(child.id)}>
                  <span aria-hidden="true">⋯</span>
                </button>
              </article>
            );
          })}
      </div>
      <nav className="home-navigation modern-navigation" aria-label="기록장 메뉴">
        {(
          [
            { label: '목록', icon: 'list', action: onAll },
            { label: '달력', icon: 'calendar', action: onCalendar },
            { label: '설정', icon: 'settings', action: onSettings },
          ] as const
        ).map((item) => (
          <button key={item.label} aria-label={item.label} onClick={item.action}>
            <Icon name={item.icon} />
          </button>
        ))}
      </nav>
      {selected && (
        <Sheet title={selected.name} onClose={() => setMenu(undefined)}>
          <div className="profile-menu">
            <p role="status">{dayCounter(selected, date)} · 최근 30일 중 {writtenDays(snapshot, selected.id, date).filter(Boolean).length}일 기록</p>
            <button
              className="primary-btn"
              disabled={store.readOnly}
              onClick={() => {
                setMenu(undefined);
                setPhoto(selected.id);
              }}
            >
              프로필 사진 바꾸기
            </button>
          </div>
        </Sheet>
      )}
      {photoChild && <ProfilePhotoSheet child={photoChild} store={store} onClose={() => setPhoto(undefined)} />}
    </main>
  );
}
