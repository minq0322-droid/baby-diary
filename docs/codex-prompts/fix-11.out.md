Fix 11 적용 완료.

- 데스크톱 레이아웃: diary 중심 폭, archive/calendar/settings 최대 폭, 카드 그리드, 중앙 dialog sheets, hover/focus, 수평 스크롤 방지
- diary: Ctrl+wheel 확대, 중간 버튼/Space 드래그 이동, Esc popover 닫기, Ctrl+Z 실행
- 자연스러운 seeded 별·반딧불 배치와 개별 twinkle
- `별 움직임` 설정 및 drift 경로 제거
- `dayCounter` fallback을 `생일 미정`으로 단축
- Home 접근성 라벨 중복 제거
- AGENTS.md 설계 사양 갱신

`npx tsc -b` 통과. Vitest는 sandbox의 esbuild `Access is denied`로 실행되지 않았습니다.

파일 변경:
`AGENTS.md`, `src/features/home/*`, `src/features/page/DrawingArea.tsx`, `src/features/settings/SettingsScreen.tsx`, `src/lib/date.ts`, `src/lib/date.test.ts`, `src/styles/app.css`, `src/styles/home.css`, `src/styles/page.css`

검토자는 1280×800, 1440×900, 1920×1080 및 375×812, 430×932의 light/dark 화면에서 diary·home·archive·calendar·settings와 그리기 확대/이동을 확인해 주세요.