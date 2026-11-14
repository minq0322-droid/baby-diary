import { Icon } from './Icon';

export type Tab = '홈' | '기록' | '달력' | '설정';
type Props = { tab: Tab; onChange: (tab: Tab) => void };

const ICONS = { 홈: 'home', 기록: 'feed', 달력: 'calendar', 설정: 'settings' } as const;

// 2026-11-15: 바닥에 붙은 흰 띠 → 떠 있는 캡슐, 아이콘만(이름은 aria-label). HOUSE §10-2.
export function BottomNav({ tab, onChange }: Props) {
  return (
    <nav className="tabbar" aria-label="주요 메뉴">
      {(['홈', '기록', '달력', '설정'] as const).map((item) => (
        <button
          className={`tab${tab === item ? ' on' : ''}`}
          type="button"
          key={item}
          aria-label={item}
          aria-current={tab === item ? 'page' : undefined}
          onClick={() => onChange(item)}
        >
          <Icon name={ICONS[item]} />
        </button>
      ))}
    </nav>
  );
}
