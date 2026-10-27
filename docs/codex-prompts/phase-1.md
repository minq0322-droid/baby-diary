Phase 1 — foundation. Read AGENTS.md first.

1. Scaffold Vite + React + TS in this folder (package.json, tsconfig, vite.config.ts, index.html). Scripts: dev, build, preview, test (vitest run). Install deps with npm.
2. vite-plugin-pwa: manifest name "육아 기록", short_name "육아기록", lang ko, display standalone, theme/background `#FAF8F5`; simple placeholder SVG icon (rounded square, coral dot + mint dot) in public/, plus 192/512 PNGs generated from it if easy, otherwise SVG only.
3. Port the mockup CSS into src/styles/tokens.css + app.css (see AGENTS.md "Design"). Add the prenatal tag tokens. Body is the app (no phone frame); tab bar fixed bottom with safe-area padding; content max-width 520px centered.
4. App shell: tab bar 오늘 / 달력 / 설정 with the mockup's icons; each tab renders a placeholder page for now.
5. src/data: types.ts, DataStore.ts (interface + a `useStore` React hook that subscribes), seed.ts (kids, 아빠/엄마 members, preset tags; no sample entries), localStore.ts (localStorage-backed, emits change events, current member id stored in localStorage key `me`, default 아빠).
6. src/lib/date.ts: toKey(date) local date key, fromKey, addDays, todayKey (Asia/Seoul), formatHeader ("10월 26일 월요일"), ageLabel per AGENTS.md. date.test.ts covering: month/year age labels, day-of-month boundary, D-day labels, unborn without due date, key never shifts across midnight.

Do not build the real screens yet.
