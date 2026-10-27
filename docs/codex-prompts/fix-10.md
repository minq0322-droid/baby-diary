Fix 10 — diary page tools, drawing ratio + zoom, archive list. Read AGENTS.md. Do only what is listed; keep changes focused. Korean UI only.

## 1. Diary page (src/features/page/*, src/styles/page.css)

A. Parent switch (`.parent-pages` in PageScreen.tsx). Replace the text "엄마의 페이지 / 아빠의 페이지" with two small hand-drawn FACES (inline SVG, ink line style like the other diary icons: stroke currentColor, round caps, slightly wobbly paths). 엄마 = round face with long hair framing the face; 아빠 = round face with short hair (and simple glasses if it still reads at small size). About 34–40px drawn, each button ≥ 44px touch. No visible text; aria-label "엄마 페이지" / "아빠 페이지", aria-pressed. Selected = full opacity + a small hand-drawn underline; unselected = 0.45 opacity. Put the SVG faces in a small component (e.g. src/features/page/ParentFace.tsx). Swipe behavior stays as it is.

B. Drawing tray (DrawingArea.tsx). Reduce the tray to ONE row of icon buttons (icon + tiny label, touch ≥ 44px):
   - 펜: one button whose icon shows the current pen color (a pen glyph with a dot of the current color). Tapping it opens a small popover just above the tray with: two thickness choices (가는 펜 = width 2, 굵은 펜 = width 5) and the pen color swatches (existing `penColors`: auto ink + 8 crayons). Choosing a thickness or color selects the pen tool; the popover closes on outside tap or after a color choice. Remove the always-visible color row.
   - 지우개: tapping selects the eraser; tapping it again while selected (or a small ▾) opens a popover with 3 sizes (작게 / 보통 / 크게) and "전부 지우기". "전부 지우기" clears drawing strokes only (not photos) and must be undoable: 되돌리기 restores the cleared strokes (keep a small local undo stack of drawing arrays in DrawingArea; 되돌리기 pops it, falling back to removing the last stroke).
   - 되돌리기, 사진, 확대 (see D), 완료.
   - Remove 페이지 색 from the tray.
   Data: eraser strokes keep color 'erase'. Change `Stroke.width` in src/data/types.ts to `2 | 5 | 8 | 14 | 28` (pens 2/5, eraser 8/14/28, default eraser 14). Make sure every place that validates/normalizes/paints/exports strokes (lib/stroke.ts, migrate, stores' validation, book export, StrokePreview, tests) accepts the new eraser widths and still accepts old data.

C. Page color button: remove from the tray; add a small icon button (hand-drawn palette/drop icon, ≥ 44px touch, visually small and quiet) at the RIGHT end of the bottom bar `.diary-bottom`, opposite the 💬 comment button on the left; the 저장/수정 oval stays centered. Show it only when the current writer can edit this page (editing && ownPage); otherwise keep an equal-width empty spacer so the oval stays centered. It opens the existing 'palette' sheet. Add the icon to src/components/Icon.tsx in the existing style.

D. Same ratio while drawing and after 완료 (bug). Today `.art` is `min(80vw, 60svh)` tall when viewing but `calc(100dvh - 308px …)` tall in drawing mode; strokes are normalized 0..1 on both axes, so after 완료 the picture shrinks and its proportions change. Fix: the drawing surface (`.art-box`) has ONE fixed aspect ratio, width:height = 5:4, in BOTH modes, full screen width edge to edge (no borders). On screens where 5:4 at full width would be taller than 60svh, keep the ratio and reduce the width (centered, page color around it — no frame). In drawing mode the tray sits below the box; if the screen is short, the page may scroll rather than the box changing ratio. Use the same 5:4 ratio for StrokePreview cards (src/components/StrokePreview.tsx / `.drawing-preview`) and in the book export drawing area if it currently uses a different ratio for strokes (strokes must never be stretched; letterbox instead). Existing drawings keep their normalized coordinates.

E. 확대 (zoom for fine drawing), drawing mode only:
   - A 확대 button in the tray cycles 1× → 2× → 3× → 1× and shows the current level (e.g. "2×"). Pinch with two fingers also zooms (1×–4×, clamped) and two-finger drag pans while zoomed. One finger (or mouse/pen) always draws. Never start a stroke from a two-finger gesture; if a second pointer arrives during a stroke, cancel that stroke.
   - Implement as a view transform on the surface (scale + translate, clamped so the surface always covers the box), with canvas backing resolution = box size × devicePixelRatio × zoom (cap the backing canvas at 4096px on the long side) so zoomed lines stay sharp. Pointer → normalized point mapping must account for the transform so strokes land exactly under the finger. Stroke widths are in surface units (a thin pen looks thicker when zoomed, thinner when zoomed out — like real zoom).
   - The box itself keeps its 5:4 size and position; only the content inside is zoomed (overflow hidden). Photos inside zoom with the content. 완료 resets zoom to 1×. Respect prefers-reduced-motion (no zoom animation).
   - Stroke simplification (simplifyStroke) should use the zoomed pixel size so fine detail drawn at 3× is not simplified away, while the page JSON budget (~150 KB, hard 200 KB) is still enforced as today.

F. Writing placeholder: "오늘 조비안은…" → "오늘 비안이는…". Add `callName(name)` to src/lib/josa.ts: if the name is 3 Hangul syllables, drop the first syllable (surname); then if the last syllable has a final consonant (batchim) append '이'. Examples: 조비안 → 비안이, 또이 → 또이, 김민 → 김민이 (2 syllables: keep all). Placeholder = `오늘 ${topic(callName(child.name))}…` → "오늘 비안이는…", "오늘 또이는…". Add tests in josa.test.ts.

## 2. Archive (src/features/archive/*)
- Remove the row of per-child KidCards at the top of 목록 (delete KidCard.tsx if nothing else uses it, and its CSS).
- Top of the screen, right under the title: the segment pills 전체 / 조비안 / 또이 (child names from data), then the search pill, then the pages immediately as cards (existing PageCard grid).
- Add a small view toggle at the right end of the segments row (icon button ≥ 44px, aria-label "카드로 보기"/"목록으로 보기", aria-pressed): 카드 (default) or 목록. 목록 view = a text-only list grouped by month: each row shows date (M.D 요일), child name, author (엄마/아빠), up to two lines of text (line-clamp, word-break keep-all), and a small star if it has badges; no drawing or photo. Tapping a row opens the page like a card does. Remember the choice per viewer in localStorage (wrap in try/catch; default 카드).
- Keep search, filter, 더 불러오기 working for both views.

## Done
- `npx tsc -b` passes; add/adjust vitest tests (josa callName, stroke width validation incl. old data, pointer→normalized mapping under zoom as a pure function, undo stack for 전부 지우기 as a pure function). Vite/vitest may fail in this sandbox — expected.
- Light + dark, 375px and 430px width, touch ≥ 44px, safe-area kept.
- End with: files changed, anything not done, what the reviewer should check.
