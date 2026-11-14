Phase 25 — choose the app icon (3 logos). Read AGENTS.md ("Definition of done"). Read only `index.html`, `vite.config.ts`, `src/lib/pwaPaths.ts`, `src/features/settings/SettingsScreen.tsx`, `src/main.tsx` and what you must change. Design reference: `docs/design/ux-20261114/index.html` (screen 3) and `docs/design/logo-20261114/index.html` (the three SVG symbols `logo1`/`logo2`/`logo3` — copy their paths exactly).

## Why (user, 2026-11-14)
"로고 다 마음에 드는데? 홈 화면에 추가할 때 세 개 중 하나를 선택하게 하는 건 불가능해?" — iOS's Add to Home Screen sheet cannot offer a choice, but Safari reads `<link rel="apple-touch-icon">` from the current page at the moment of adding. So the user picks in 설정 first, then adds.

## Build
1. Icon files in `public/icons/`: for each of `book` (logo1 두 장 한 권), `moon` (logo2 달과 별), `heart` (logo3 크레파스 하트): `<id>.svg` (512 viewBox, full-bleed square, no rounded corners — iOS masks it) and `<id>-180.png` (180×180, opaque, for apple-touch-icon) and `<id>-512.png`. Generate the PNGs with a small node script `scripts/icons.mjs` (no new dependency: render with the already-installed Playwright/Chrome if present, otherwise write the script and leave PNG generation to the reviewer — say so in the report). Keep `public/icon.svg` = book.
2. `index.html`: add `<link rel="apple-touch-icon" href="…/icons/book-180.png">` (respect the Pages base path via `pwaPaths`), `apple-mobile-web-app-capable=yes`, `apple-mobile-web-app-title=육아기록`, `apple-mobile-web-app-status-bar-style=default`. Manifest icons: the three PNG 512s (book first) + svg.
3. `src/lib/appIcon.ts`: `getAppIcon(): 'book'|'moon'|'heart'` (device-local preference, try/catch storage, default `book`), `setAppIcon(id)`, `applyAppIcon(id)` — swaps the `apple-touch-icon` href and the `<link rel=icon>` href at runtime. Call `applyAppIcon(getAppIcon())` on startup (normal build only; the Artifact build skips it). Unit test for get/set fallback.
4. 설정: a new first group `앱 아이콘` — radiogroup of three 64px icon tiles with names (두 장 한 권 · 달과 별 · 크레파스 하트), checked tile has field background + small check. Hint text under it exactly: `고른 뒤 Safari 공유 › 홈 화면에 추가 하면 이 아이콘으로 들어가요. 이미 추가했다면 홈 화면에서 지우고 다시 추가하면 바뀝니다.` When running standalone (`matchMedia('(display-mode: standalone)')` or `navigator.standalone`), the hint instead reads `홈 화면 아이콘을 바꾸려면 Safari에서 이 주소를 열어 고른 뒤, 홈 화면의 앱을 지우고 다시 추가하세요.` Hidden in the Artifact build.
5. Plain CSS in the settings stylesheet, tokens only, 44px targets, focus ring, light + dark.

Done report → `docs/codex-prompts/phase-25.out.md` (short). No commit/push/deploy.
