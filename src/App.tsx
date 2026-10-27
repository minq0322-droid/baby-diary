import { useEffect, useRef, useState } from 'react';
import type { DataStore } from './data/DataStore';
import { useStore } from './data/DataStore';
import { todayKey } from './lib/date';
import { BottomNav, type Tab } from './components/BottomNav';
import { HomeScreen } from './features/home/HomeScreen';
import { PageScreen, type PageOrigin } from './features/page/PageScreen';
import { Toast } from './components/Toast';
import { ArchiveScreen } from './features/archive/ArchiveScreen';
import { CalendarScreen } from './features/calendar/CalendarScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { useMemberFonts } from './features/settings/useMemberFonts';
import { MemberPicker } from './features/auth/MemberPicker';
import { SyncBanner } from './components/SyncBanner';

type Screen =
  | { kind: 'shell'; tab: Tab }
  | { kind: 'archive' }
  | {
      kind: 'page';
      date: string;
      childId: string;
      authorId?: 'dad' | 'mom';
      editing: boolean;
      origin?: PageOrigin;
    };

export default function App({ store }: { store: DataStore }) {
  const snapshot = useStore(store);
  const [date, setDate] = useState(todayKey);
  const [screen, setScreen] = useState<Screen>({ kind: 'shell', tab: '홈' });
  const [savedToast, setSavedToast] = useState(false);
  const source = useRef<{ origin?: PageOrigin; editing: boolean }>({
    editing: false,
  });
  useMemberFonts(snapshot.members, store);
  useEffect(() => {
    if (!savedToast) return;
    const timer = window.setTimeout(() => setSavedToast(false), 2500);
    return () => window.clearTimeout(timer);
  }, [savedToast]);

  if (store.preparing)
    return (
      <>
        <SyncBanner store={store} />
        <div className="artifact-welcome">기록장을 준비하고 있어요…</div>
      </>
    );
  if (store.needsMember)
    return <MemberPicker store={store} members={snapshot.members} />;

  const openPage = (
    nextDate: string,
    childId: string,
    authorId?: 'dad' | 'mom',
  ) =>
    setScreen({
      kind: 'page',
      date: nextDate,
      childId,
      authorId,
      ...source.current,
    });
  const goHome = () => setScreen({ kind: 'shell', tab: '홈' });

  if (screen.kind === 'page') {
    const child = snapshot.children.find((item) => item.id === screen.childId);
    if (!child) return <button onClick={goHome}>홈으로 돌아가기</button>;
    return (
      <>
        <SyncBanner store={store} />
        <PageScreen
          key={`${screen.date}__${screen.childId}__${screen.authorId ?? store.getCurrentMemberId()}`}
          store={store}
          snapshot={snapshot}
          child={child}
          date={screen.date}
          authorId={screen.authorId}
          onAuthor={(authorId) => setScreen({ ...screen, authorId })}
          startEditing={screen.editing}
          origin={screen.origin}
          onBack={goHome}
          onDate={(nextDate) => setScreen({ ...screen, date: nextDate })}
          onSaved={() => {
            setDate(screen.date);
            setSavedToast(true);
            goHome();
          }}
        />
      </>
    );
  }

  const tab = screen.kind === 'archive' ? '홈' : screen.tab;
  return (
    <div
      className={`app-shell${screen.kind === 'shell' && screen.tab === '홈' ? ' home-shell' : ''}`}
      onClickCapture={(event) => {
        const card = (event.target as HTMLElement).closest(
          '.kid-card, .page-card, .home-face',
        );
        if (!card) return;
        const rect = card.getBoundingClientRect();
        source.current = {
          editing:
            card.classList.contains('kid-card') ||
            card.classList.contains('home-face'),
          origin: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          },
        };
      }}
    >
      <SyncBanner store={store} />
      {screen.kind === 'archive' ? (
        <ArchiveScreen
          store={store}
          snapshot={snapshot}
          openPage={openPage}
          onBack={goHome}
        />
      ) : (
        <>
          {tab === '홈' && (
            <HomeScreen
              store={store}
              snapshot={snapshot}
              openPage={openPage}
              onCalendar={() => setScreen({ kind: 'shell', tab: '달력' })}
              onSettings={() => setScreen({ kind: 'shell', tab: '설정' })}
              onAll={() => setScreen({ kind: 'archive' })}
            />
          )}
          {tab === '달력' && (
            <CalendarScreen
              store={store}
              snapshot={snapshot}
              openPage={openPage}
              date={date}
              setDate={setDate}
            />
          )}
          {tab === '설정' && (
            <SettingsScreen store={store} snapshot={snapshot} />
          )}
        </>
      )}
      {!(screen.kind === 'shell' && tab === '홈') && (
        <BottomNav
          tab={tab}
          onChange={(nextTab) => setScreen({ kind: 'shell', tab: nextTab })}
        />
      )}
      <Toast message="저장했어요" visible={savedToast} />
    </div>
  );
}
