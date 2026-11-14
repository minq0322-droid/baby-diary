Phase 26 — the archive becomes an Instagram-like feed. Read AGENTS.md ("Design specs", "Data model", "Definition of done"). Read only `src/features/archive/*`, `src/components/BottomNav.tsx`, `src/components/StrokePreview.tsx`, `src/App.tsx` and what you must change. Design: `docs/design/ux-20261114/index.html` screen 1 and `docs/design/ux-20261114/steps.md` §1–3 (grid, detail, functions). Do not change Home, the page editor or data stores.

## Why (user, 2026-11-14)
"지금은 카드 형태인데 일기를 피드 형태로 만들고 싶어 … 인스타그램처럼 피드 형태로 볼 수 있게." Reference: Instagram post order + Pieceful (chronological, 1년 전 오늘).

## Build
1. `ArchiveScreen` shows a vertical feed (newest first), replacing the list/card toggle (remove `archiveView` toggle UI and its stored preference; keep search).
   - Sticky day header 40px: `11월 14일 금요일` + right `N장` (tabular-nums).
   - Post (`src/features/archive/FeedPost.tsx`): writer row 44 (28px avatar circle in dad/mom colour with 아/엄 initial · child name bold · `아빠의 페이지 · 오후 8:05` sub) + `⋯` 44 button (opens the existing page actions if any, else omit) → **paper full-bleed** (page colour, dark-mode mix rule from AGENTS) with the drawing via `StrokePreview` at 4:3 and photos as in the page, then the full handwriting text (Gaegu 22/1.35, padding 0 20 18) → action row 44: heart toggle (existing `toggleReaction`), comment button (opens the existing comments sheet), `하트 N`, badges as filled blocks on the right → first comment line (`아빠 …`) if any.
   - Double-tap on the paper = heart on (never off), with a 600ms heart pop (none with reduced motion). Single tap opens the page (existing navigation, preserving feed scroll position on return).
   - Child chips above the feed: `함께 · <kid1> · <kid2>` (existing filter).
   - Top of feed, only when a page exists exactly 1 year ago (same month/day) for the filtered children: one-line memory card (48px paper thumb · `1년 전 오늘 · 이름 · 엄마` · first line in Gaegu). Tap opens that page.
   - Infinite scroll: load the next month when the sentinel is within 600px (replaces `더 불러오기`; keep a visible `다시 불러오기` on error).
   - Empty state: `아직 기록이 없어요` + button `오늘 기록 쓰기`.
2. Navigation (`BottomNav`): floating capsule (left/right 20, height 60, 8 above the home indicator + safe area, glass blur background, 1px hairline), **icons only** with aria-labels, 4 tabs `홈 · 기록 · 달력 · 설정`, current screen highlighted (the archive is `기록`, not 홈). Content scrolls under the capsule; add bottom padding so the last post clears it.
3. Top bar on 기록: left round `‹ 홈` (44, glass), centre `기록` 17 bold, right round search (toggles the existing search field).
4. Floating `+` (56, primary) bottom-right above the capsule: opens today's page for the first child (same as Home face tap).
5. Performance: render posts lazily (`content-visibility: auto` with an intrinsic size) — months can hold 60+ pages.

Plain CSS (`src/styles/app.css` or a new `src/styles/feed.css`), tokens only, light + dark, 44px targets, focus rings, safe areas, Korean `word-break: keep-all`. Tests: pure helpers for day grouping and the 1-year-ago match (`src/features/archive/feed.test.ts`). Delete `PageCard.tsx`/`ArchiveListRow.tsx` if no longer used.

Done report → `docs/codex-prompts/phase-26.out.md`. No commit/push/deploy.
