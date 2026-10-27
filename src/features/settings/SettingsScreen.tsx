import { useEffect, useState } from 'react';
import type { DataStore } from '../../data/DataStore';
import type { Child, StoreSnapshot } from '../../data/types';
import { ageLabel, todayKey } from '../../lib/date';
import { Icon } from '../../components/Icon';
import { Sheet } from '../../components/Sheet';
import { Toast } from '../../components/Toast';
import { ChildEditSheet } from './ChildEditSheet';
import { PageColorSheet } from './PageColorSheet';
import { FontUpload } from './FontUpload';
import { BadgeManager } from './BadgeManager';
import { applyTheme, type Theme } from '../home/sceneChoice';
import { ProfilePortrait } from '../home/ProfilePortrait';
import { BackupSection } from './BackupSection';
import { BookSection } from './BookSection';
import { FamilySettings } from './FamilySettings';

type Props = { store: DataStore; snapshot: StoreSnapshot };

export function SettingsScreen({ store, snapshot }: Props) {
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [colorOpen, setColorOpen] = useState(false);
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [theme, setTheme] = useState<Theme>(
    (document.documentElement.dataset.theme as Theme) ?? 'system',
  );

  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(''), 3500);
    return () => window.clearTimeout(timer);
  }, [message]);

  const changeTheme = (next: Theme) => {
    setTheme(next);
    applyTheme(next);
  };

  return (
    <div className="screen-scroll settings-screen">
      <h1 className="screen-title">설정</h1>
      <section className="settings-group">
        <h2>아이</h2>
        <div className="settings-list">
          {snapshot.children.map((child) => (
            <button
              className="setting"
              type="button"
              key={child.id}
              disabled={store.readOnly}
              onClick={() => setEditingChild(child)}
            >
              <span className="avatar" style={{ overflow: 'hidden' }}>
                <ProfilePortrait child={child} store={store} />
              </span>
              <span>
                {child.name}
                <small>
                  {ageLabel(child, todayKey()) ||
                    '생일 또는 예정일을 설정해 주세요'}
                </small>
              </span>
              <Icon name="arrow" />
            </button>
          ))}
        </div>
      </section>
      <FamilySettings store={store} />
      {(store.viewerMapping || store.canSwitchMember) && (
        <section className="settings-group">
          <h2>가족</h2>
          <div className="settings-list setting-theme">
            {snapshot.members.map((member) => (
              <button
                type="button"
                key={member.id}
                disabled={store.readOnly}
                aria-pressed={store.getCurrentMemberId() === member.id}
                onClick={() => store.setCurrentMemberId(member.id)}
              >
                나는 {member.displayName}
              </button>
            ))}
          </div>
        </section>
      )}
      <section className="settings-group">
        <h2>페이지 색</h2>
        <button
          className="setting settings-list"
          type="button"
          disabled={store.readOnly}
          onClick={() => setColorOpen(true)}
        >
          <span>
            페이지 색 적용<small>전체 또는 아이별로 고르기</small>
          </span>
          <span className="colors">
            {snapshot.children.map((child) => (
              <i key={child.id} style={{ background: child.pageColor }} />
            ))}
          </span>
          <Icon name="arrow" />
        </button>
      </section>
      <section className="settings-group">
        <h2>글씨체</h2>
        <div className="settings-list">
          {snapshot.members.map((member) => (
            <FontUpload
              key={member.id}
              store={store}
              member={member}
              notify={setMessage}
            />
          ))}
        </div>
      </section>
      <section className="settings-group">
        <h2>배지 관리</h2>
        <button
          className="setting settings-list"
          type="button"
          disabled={store.readOnly}
          onClick={() => setBadgesOpen(true)}
        >
          <span>
            배지 편집<small>추가 · 이름 변경 · 순서 · 숨기기</small>
          </span>
          <Icon name="arrow" />
        </button>
      </section>
      <BackupSection store={store} snapshot={snapshot} notify={setMessage} />
      <BookSection store={store} snapshot={snapshot} />
      <section className="settings-group">
        <h2>화면</h2>
        <div className="settings-list setting-theme">
          {(['system', 'light', 'dark'] as const).map((value) => (
            <button
              type="button"
              key={value}
              aria-pressed={theme === value}
              onClick={() => changeTheme(value)}
            >
              {value === 'system'
                ? '시스템'
                : value === 'light'
                  ? '라이트'
                  : '다크'}
            </button>
          ))}
        </div>
        <p className="scene-settings-hint">홈의 작은 집·무당벌레·별·풍등을 누르면 장면을 바꿀 수 있어요</p>
      </section>
      {editingChild && (
        <ChildEditSheet
          child={
            snapshot.children.find((child) => child.id === editingChild.id) ??
            editingChild
          }
          store={store}
          onClose={() => setEditingChild(null)}
        />
      )}
      {colorOpen && (
        <PageColorSheet
          store={store}
          children={snapshot.children}
          onClose={() => setColorOpen(false)}
        />
      )}
      {badgesOpen && (
        <Sheet title="배지 관리" onClose={() => setBadgesOpen(false)}>
          <BadgeManager store={store} tags={snapshot.tags} />
        </Sheet>
      )}
      <Toast message={message} visible={Boolean(message)} />
    </div>
  );
}
