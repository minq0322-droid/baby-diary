Design task — mockup v3. Output ONE file: docs/design/mockup-v3.html. Do not touch src/. Attached refs: home-travel.png, home-shop.png, home-dark.png (for the app shell) and grug-single.png (for the diary page only).

## Why v3
v2 (docs/design/mockup-v2.html) put the hand-drawn style everywhere and got messy as elements piled up. The user's new rule: **intuitive = on every screen, what I must choose and the single most important information are obvious at a glance.** Fewer elements, stronger hierarchy.

## Two visual worlds
1. **App shell** (home, list, calendar, settings): clean, modern, the v1 font (Pretendard) and v1 spirit (docs/design/mockup.html), upgraded with the refs: large friendly header, a search pill, segmented pills where the active one is a dark filled pill, big rounded cards with imagery, one dark rounded primary button style, bottom nav with a small active dot. Calm, generous spacing.
2. **Diary page** (one child, one day): the grug style from v2 — full-bleed crayon color, Gaegu handwriting, hand-drawn ink — but with ONLY: top drawing area, bottom writing area, and the controls 저장/수정, 날짜, 댓글, plus ONE badge icon. Nothing else on the page.

## Flow
Home → tap 조비안 or 또이 → that child's page for the selected date → 저장 → back to Home (the list shows the new page at the top with a short "저장했어요" toast).

## Screens to show (phone frames side by side, like v1/v2)
① **Home (today)** — the most important thing is "오늘 누구의 하루를 남길까?".
   - Header: small "10월 26일 월요일" above a big greeting "오늘, 아이들의 하루" (or similar short Korean line); right: a round avatar chip for the current writer ("아빠").
   - Primary choice: two LARGE kid cards side by side (each ~half width, tall), each filled with that kid's page color, a doodle thumbnail of today's page if written, name big (조비안 / 또이), one status line: "오늘 기록 완료 · 아빠" or "아직 안 썼어요" with a small arrow. 또이 shows "출산 전 · D-34". These two cards must be the visual focus.
   - A small date switcher (‹ 오늘 ›) near the header to choose another day — it changes what the kid cards open.
   - Below: search pill "기록 검색", then section "최근 기록" with "전체 보기", segmented pills 전체 / 조비안 / 또이, and a horizontal row of page cards (like the travel ref's image cards): each card = the page's color + its doodle, overlaid bottom label: date, kid, first line, badge icon if any.
   - Bottom nav: 홈 · 달력 · 설정 (icons + labels, active dot).
② **Diary page — 조비안, editing** (벚꽃 color):
   - Top bar (handwritten, ink color): ← back; center date "10.26 월" with tiny ‹ › to step days; right: ONE badge icon (a hand-drawn star outline; filled + count when badges chosen).
   - Drawing area: upper ~50%, the sock doodle from v2; tap it to draw. A light dashed hand-drawn frame only while empty: "여기에 그리거나 사진을 붙여요".
   - Writing area: lower part, handwritten lines (faint ruled lines), placeholder "오늘 조비안은…", the two sample notes as plain handwritten paragraphs with a tiny author initial at the end of each (아 / 엄).
   - Bottom row: left "💬 1" comment button (hand-drawn speech bubble + count); center the big grug-style oval button "저장"; nothing else.
③ **Diary page — saved view** (박하, 또이): same layout read-only; the center oval becomes "수정"; comment button shows "💬 2". Also show the comments sheet open from the bottom: two short comments (엄마/아빠, handwritten), a ❤️ toggle, and a single input "댓글 남기기".
④ **Badge picker**: tapping the badge icon opens a compact sheet with hand-drawn badge stickers in a grid (예방접종, 열·아픔, 병원, 처음, 키·몸무게, 수유·이유식, 수면, 약, 산전검진); selected ones get a filled circle; "완료".
⑤ **Drawing tools**: when drawing, a slim floating tray appears at the bottom of the drawing area only: pen (2 sizes), 지우개, 되돌리기, 사진, 페이지 색 (opens the 16-color picker from v2), 완료. Canvas must really draw (pointer + touch, smoothed, round caps).
⑥ **Calendar** (app shell style): month grid, days with pages show small dots in each kid's page color, today in a dark filled circle; tapping a day shows a bottom card with the two kids' page thumbnails for that day.
⑦ **Settings** (app shell style): grouped lists — 아이 (생일, 출산 예정일, 기본 페이지 색), 페이지 색 (모든 페이지에 적용), 글씨체 (아빠/엄마 "내 글씨체 올리기"), 백업, 화면.

## Tokens
- Shell light: bg #F6F5F2, surface #FFFFFF, text #1E1F24, sub #74757C, line #E6E4DF, primary (buttons, active pill) #1E1F24 with white text, kid accents = each kid's default page color.
- Shell dark (follow home-dark.png: soft navy-violet, NOT black): bg #262638, surface #31314A, raised #3B3B57, text #F1F0F7, sub #A9A8BE, line #46465F, primary #F1F0F7 with #262638 text. Cards must stay clearly separated (surface vs bg contrast + 1px line).
- Page palette: reuse the 16 crayon colors and their dark variants from mockup-v2.html exactly; ink auto by contrast.
- Fonts: shell = Pretendard (jsDelivr CDN link like v1), page = Gaegu (Google Fonts). Sizes shell: 28 greeting / 20 kid name / 17 section / 15 body / 13 meta. Page: 20 handwriting body.
- Theme toggle (라이트/다크/시스템) on the mockup page, tokens on :root with prefers-color-scheme guarded by :root:not([data-theme="light"]) and :root[data-theme="dark"].
- Touch targets ≥ 44px; reduced motion respected; page open = card expands into the page (shared-element feel, 250ms); save = page shrinks back into its card in the list.

## Interactivity
Tap kid card → page; 저장 → back to home with toast and the card updated; badge icon → picker; comments → sheet; drawing works; theme toggle. No persistence.

End your reply with what you could not do.
