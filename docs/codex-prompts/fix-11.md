Fix 11 — PC (desktop) layout + natural starfield. Read AGENTS.md. Do only what is listed. fix-10 just landed (diary tools, 5:4 drawing box, zoom, archive list view); keep its behavior.

## 1. Desktop / wide screens (the user will use the app a lot on an office PC)
Today the app is built for phones and looks broken on a 1280–1920px browser window: full-bleed elements use `100vw` (adds a horizontal scrollbar on Windows because 100vw includes the scrollbar), the diary header/writing stretch across the whole window, and sheets/cards are sized for phones. Fix it with plain CSS media queries (`@media (min-width: 768px)` and, where useful, `(min-width: 1100px)`), no new deps, phone layout unchanged.
- No horizontal page scroll at any width. Replace `100vw`-based full-bleed tricks (e.g. `.art { width: 100vw; margin-inline: calc(50% - 50vw) }`) with a layout that does not depend on the scrollbar (full-bleed inside the column container, or `width: 100%` of a full-width parent).
- Diary page: page color fills the whole window background. Content is a centered column, max-width ~ 640px (header, parent faces, drawing box, writing, bottom bar all inside it). The 5:4 drawing box fills the column width (and still respects the 60svh height cap from fix-10). The bottom bar (💬 · 저장/수정 · 페이지색) stays at the bottom of the column, not stretched across the window. Mouse drawing and wheel/trackpad: Ctrl+wheel (or trackpad pinch, which arrives as ctrl+wheel) zooms the drawing in drawing mode, plain wheel scrolls the page; when zoomed, drag with the middle button or Space+drag pans. Keyboard: Esc closes sheets/popovers; Ctrl+Z = 되돌리기 in drawing mode.
- Home: scene fills the window; faces stay centered and reasonably sized (cap their size so they don't become huge; on wide screens the two faces may sit side by side if there is plenty of horizontal room and it looks balanced — your call, keep lantern strings non-overlapping). Bottom quiet icons centered.
- 목록 (archive): centered container max-width ~ 1040px; card grid uses auto-fill columns (minmax ~ 220px) so 3–4 columns on PC; 목록(text) view is a centered column max ~ 720px.
- 달력 (calendar): centered, max-width ~ 720px; the day preview beside or below the month grid, whichever is cleaner.
- 설정 (settings) and all sheets: on ≥ 768px, sheets open as a centered dialog (max-width ~ 480px, rounded, backdrop) instead of a bottom sheet; settings page centered max ~ 640px.
- Hover/focus states for buttons on pointer devices (`@media (hover: hover)`), visible focus ring for keyboard.
- Verify at 1280×800, 1440×900, 1920×1080 and still at 375×812 / 430×932, light and dark.

## 2. Natural night sky (home, dark theme)
In `src/features/home/useScene.ts` the 120 background stars are placed with linear formulas (`(i * 47.13 + 9) % 100`, `(i * 23.7 + 4) % 100`), which makes them line up in visible rows/diagonals. Make the sky look like a real night sky:
- Positions from a small seeded PRNG (e.g. mulberry32 with a fixed seed so the sky is stable across reloads), with light jitter/clustering is fine but NO visible lattice. Star count scales with area (~1 star per 6,000–9,000 px², clamp 60–260) so PC windows aren't sparse.
- Varied sizes (mostly tiny 0.4–0.9px, a few 1.2–1.8px), varied base brightness, a few faintly warm/cool tints; each star twinkles at its own random speed/phase (subtle). Respect prefers-reduced-motion (static).
- Background stars do NOT move. Remove the "별 움직임: 반짝임/사선 흐름" setting (preferences `stars`, the settings control, and the drift code path); old saved prefs with `stars: 'drift'` are simply ignored. Update AGENTS.md design spec #1 accordingly ("starfield with twinkle + shooting stars").
- Shooting stars stay as they are now (diagonal).
- Do the same random (non-lattice) treatment for the day-mode fireflies if they use a similar linear formula.

## Done
- `npx tsc -b` passes; keep tests passing (adjust preferences tests if any). Vite/vitest may fail in this sandbox — expected.
- End with: files changed, anything not done, what the reviewer should check.

## 3. Small bugs found in review
- Diary header overflows horizontally at 375px when `dayCounter` returns the long fallback "태어난 날을 입력해 주세요" (kid1 without birth date): page scrollWidth 486 > 375. Shorten that fallback to "생일 미정" (update dayCounter tests) and make `.diary-date` shrink safely (min-width: 0, ellipsis) so nothing can push the badge button off screen.
- Home face accessible label repeats the summary twice ("조비안, 태어난 날을 입력해 주세요, 태어난 날을 입력해 주세요 · 최근 30일 중 0일 기록, …"). Each piece once: "조비안, D+224, 최근 30일 중 N일 기록, 오늘 페이지 열기. 메뉴는 길게 누르세요."
