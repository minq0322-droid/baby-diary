import { useState } from 'react';
import { APP_ICONS, applyAppIcon, iconHref, readAppIcon, type AppIcon } from '../../lib/appIcon';

// 2026-11-15 (작가): 홈 화면에 추가할 때 로고 세 개 중 하나를 고른다. 이미 추가한 아이콘은 지우고 다시 추가해야 바뀐다.
export function AppIconSection() {
  const [icon, setIcon] = useState<AppIcon>(readAppIcon);
  const base = import.meta.env.BASE_URL;
  const choose = (next: AppIcon) => {
    applyAppIcon(next, base);
    setIcon(next);
  };
  return (
    <section className="settings-group">
      <h2>앱 아이콘</h2>
      <div className="settings-list setting-icons" role="group" aria-label="앱 아이콘">
        {APP_ICONS.map((item) => (
          <button type="button" key={item.id} aria-pressed={icon === item.id} onClick={() => choose(item.id)}>
            <img src={iconHref(base, item.id)} alt="" width={56} height={56} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
      <p className="scene-settings-hint">
        아이콘을 고른 뒤 Safari 공유 단추 › 「홈 화면에 추가」를 누르면 그 아이콘으로 생겨요. 이미 추가했다면 홈 화면의 아이콘을 지우고 다시 추가해 주세요. 기록은 그대로예요.
      </p>
    </section>
  );
}
