import { useRef, useState, useEffect } from 'react';
import type { DataStore } from '../../data/DataStore';
import type { StoreSnapshot } from '../../data/types';
import { noteAuthor } from '../../data/migrate';
import { dayCounter, todayKey } from '../../lib/date';
import { useDarkMode } from '../../lib/usePageColorStyle';
import { Sheet } from '../../components/Sheet';
import { Icon } from '../../components/Icon';
import { gardenArt } from './artwork';
import { HomeFace } from './HomeFace';
import { ProfilePhotoSheet } from './ProfilePhotoSheet';
import { useHomePreferences } from './preferences';
import { writtenDays } from './history';
import { useScene } from './useScene';
import '../../styles/home.css';

export function HomeScreen({
  store,
  snapshot,
  openPage,
  onAll,
  onCalendar,
  onSettings,
}: {
  store: DataStore;
  snapshot: StoreSnapshot;
  openPage: (date: string, childId: string, authorId?: 'dad' | 'mom') => void;
  onAll: () => void;
  onCalendar: () => void;
  onSettings: () => void;
}) {
  const scene = useRef<HTMLElement>(null);
  const dark = useDarkMode();
  const [preferences] = useHomePreferences();
  const [date, setDate] = useState(todayKey);
  const [menu, setMenu] = useState<string>();
  const [photo, setPhoto] = useState<string>();
  useScene(scene, dark, preferences.stars === 'drift');
  useEffect(() => {
    const update = () => setDate(todayKey());
    const timer = window.setInterval(update, 30000);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  const selected = snapshot.children.find((child) => child.id === menu);
  const photoChild = snapshot.children.find((child) => child.id === photo);
  return (
    <main
      ref={scene}
      className={`home-scene ${dark ? 'scene-night' : ''} night-${preferences.night}`}
      aria-label="아이 선택 홈"
    >
      <div className="night-background" />
      <svg
        className="home-garden"
        viewBox="0 0 375 812"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: gardenArt }}
      />
      <canvas className="home-sky" aria-hidden="true" />
      <p className="scene-date">
        {Number(date.slice(5, 7))}월 {Number(date.slice(8))}일
      </p>
      <div className="distant-lanterns" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <i key={i} className={`distant-lantern distant-${i}`} />
        ))}
      </div>
      <div className="face-slots">
        {[...snapshot.children]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((child) => (
            <div className="face-slot" key={child.id}>
              <HomeFace
                child={child}
                store={store}
                days={writtenDays(snapshot, child.id, date)}
                date={date}
                onMenu={() => setMenu(child.id)}
                onOpen={() =>
                  openPage(
                    date,
                    child.id,
                    noteAuthor(store.getCurrentMemberId(), snapshot.members),
                  )
                }
              />
            </div>
          ))}
      </div>
      <nav className="home-navigation" aria-label="기록장 메뉴">
        {(
          [
            { label: '목록', icon: 'list', action: onAll },
            { label: '달력', icon: 'calendar', action: onCalendar },
            { label: '설정', icon: 'settings', action: onSettings },
          ] as const
        ).map((item) => (
          <button key={item.label} onClick={item.action}>
            <Icon name={item.icon} />
            <span>{item.label}</span>
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
      {photoChild && (
        <ProfilePhotoSheet
          child={photoChild}
          store={store}
          onClose={() => setPhoto(undefined)}
        />
      )}
    </main>
  );
}
