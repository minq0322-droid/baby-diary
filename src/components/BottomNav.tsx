import { Icon } from './Icon';

export type Tab = '홈' | '달력' | '설정';
type Props = { tab: Tab; onChange: (tab: Tab) => void };

export function BottomNav({ tab, onChange }: Props) {
  return (
    <nav className="tabbar" aria-label="주요 메뉴">
      {(['홈', '달력', '설정'] as const).map((item) => (
        <button
          className={`tab${tab === item ? ' on' : ''}`}
          type="button"
          key={item}
          aria-current={tab === item ? 'page' : undefined}
          onClick={() => onChange(item)}
        >
          <Icon
            name={
              item === '홈' ? 'home' : item === '달력' ? 'calendar' : 'settings'
            }
          />
          <span>{item}</span>
        </button>
      ))}
    </nav>
  );
}
