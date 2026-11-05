Fix 12 — four diary-page complaints from daily use. Read AGENTS.md. Do only this. `public/fonts/Gaegu-Regular.woff2` and `public/fonts/Gaegu-OFL.txt` are already in place (added by the reviewer); do not download anything.

## 1. Typed letters grow, then shrink (font swap)
Cause, from the code: `src/normalApp.tsx` loads Gaegu from Google Fonts with `display=swap`. Google splits Korean into ~120 unicode-range files, so the first time a character from a new slice is typed it renders in the larger `cursive` fallback, then swaps to Gaegu.
- Normal (PWA) build: remove the Google Fonts link from normalApp.tsx. Add one `@font-face` for family `Gaegu`, weight 400, `font-display: block`, src the self-hosted woff2, resolved under Vite's base path (`/baby-diary/` in production; put the rule where Vite rewrites the URL correctly, or set it from `import.meta.env.BASE_URL` in normalApp.tsx). Preload it (`<link rel="preload" as="font" type="font/woff2" crossorigin>` created in normalApp.tsx, right where the old link was), and call `document.fonts.load('20px Gaegu', '가')` at startup.
- Grep for `font-weight: 700`/bold use of Gaegu in diary and book-export code. Only 400 is shipped; browser-synthesized bold is acceptable, do not add a second file.
- `vite.config.ts`: PWA precache must include the font. Add `woff2` to workbox `globPatterns` (keep the default js/css/html) and raise `maximumFileSizeToCacheInBytes` just enough for this file. The Artifact build keeps its Google Fonts link unchanged and must not gain the font.
- Book export must still draw with Gaegu (`bookExport.ts` uses `document.fonts.load`); confirm no change is needed.

## 2. No page transition when moving between dates
`PageScreen` plays its 340 ms grow-from-origin animation on every mount, and `App.tsx` remounts it (key) on ‹ › date change, parent switch and sheet change, keeping `screen.origin`. The user says it hurts their eyes.
- Play the open animation ONLY when the page is opened from another screen (Home, list, calendar). ‹ ›, swipe, parent switch and sheet change must switch instantly with no animation, no scale, no fade. In `App.tsx`, clear `origin` for those three transitions and make the animation conditional so a missing origin means none (today it falls back to `translate(12vw, 20vh) scale(.76)`; check whether any real open path relies on that fallback, and if one does, pass an explicit flag rather than animating date changes).
- The exit animation when going back Home stays as it is. Do not leave a flash: scroll position resets as today.

## 3. "Add another sheet" must be findable
`.page-sheets` shows a bare `＋` only when the current sheet is already saved (`currentSaved`). Saving returns Home, so a parent writing today never sees it, and when it does appear it is an unlabeled faint glyph.
- On the writer's own page, not read-only: ALWAYS show the control, labeled `＋ 한 장 더`, not just `＋`. Gaegu, `--page-ink`, opacity 0.85, quiet with no frame, hit area ≥ 44px, `word-break: keep-all`, `white-space: nowrap`, no wrapping at 320px. It must stay visible with the sheet numbers beside it; let the row scroll horizontally if there are many.
- Behavior by state:
  - Current sheet saved, no unsaved edits: opens a new blank sheet in edit mode (as today).
  - Current sheet has unsaved content (`canSave` true): save it through the same store write path `save` uses, WITHOUT the return-Home and toast part, then open the new sheet in edit mode. If it cannot be saved, stay and show the normal error. Extract a shared helper, do not duplicate the save logic.
  - Current sheet blank: keep it visible but inactive (`aria-disabled="true"`, opacity 0.4); tapping shows the existing hint area text "이 장을 먼저 써 주세요". No navigation.
  - While busy, leaving or loading: inactive.
- Other parent's page and read-only: unchanged, no control.
- Keep `aria-label="한 장 더 쓰기"`. Keep the row height stable.
- Update the existing tests that cover this row, and add tests for a pure helper deciding the control state (`ready` / `save-first` / `blank` / `hidden`).

## 4. Old app versions stay on users' phones
Phase 23 fixed the dark card behind the other parent's text and added sheets, and the deployed CSS has the fix, yet the user still sees the old dark text area and no sheet control. The likely cause: an installed PWA resumed from the background never reloads, and `registerType: 'autoUpdate'` with the auto-injected register script does not reload an open page.
- New small module `src/lib/appUpdate.ts`, used only by the normal build (never in the Artifact build, and no-op when `serviceWorker` is unavailable or in dev): on startup and whenever the page becomes visible (`visibilitychange`), call `registration.update()`, throttled to once per 10 minutes. On `controllerchange` (only if a controller already existed at startup, so first install does not reload), reload the page, but NEVER while there are unsaved edits: `setUnsavedEdits(boolean)` is called from `PageScreen`'s existing `dirty` state; if dirty, defer the reload until dirty clears. No reload loops: guard with a module flag.
- With `workbox` keep `clientsClaim` and `skipWaiting` so the new worker takes over (set them explicitly).
- Add tests for the reload-decision logic as a pure function.
- Also recheck that no CSS outside `.diary` can put a background behind `.note` in the production bundle order. Report what you find.

## Done
- `npx tsc -b` passes; update and add tests. Vite/vitest may fail in this sandbox, expected.
- Update AGENTS.md: spec #3 row wording (`＋ 한 장 더`, always visible on own page) and Stack (Gaegu is self-hosted in the PWA build).
- End with: files changed, anything not done, what the reviewer should check.
