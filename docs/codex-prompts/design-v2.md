Design task — mockup v2 "한 장 일기". Output ONE file: docs/design/mockup-v2.html. Do not touch src/ or any app code. The attached images (docs/design/ref/grug-*.png) are the mood reference the user loves.

## What the user wants
A parenting diary for a couple (아빠/엄마) and two kids: 첫째 조비안 (태명 조이, born) and 둘째 또이 (not born yet). The v1 mockup (docs/design/mockup.html) is clean but too plain; its dark mode was too dark and card edges disappeared. The new direction is the reference app: each day is ONE full-bleed page in a single bold flat color, with hand-drawn ink line drawings, handwritten text, almost no chrome, and a hand-drawn bottom bar that steps through dates.

## Decisions already made (follow exactly)
- One page per CHILD per DAY. A handwritten switch at the top: "조비안 · 또이" (active one underlined with a wobbly hand-drawn stroke).
- Page background: the user picks a color per page from a crayon palette; Settings can also change the default color for all pages at once (and per child). Ink color is automatic: dark ink on light pages, light ink on dark pages.
- Hand-drawn feel across the WHOLE app: page, calendar, list, search, settings, icons, tags, buttons.
- Quick notes, tags, author, comments and hearts all live INSIDE the page.

## Page anatomy (main screen, what opens first = today, 조비안)
1. Top line (small, handwritten): "조비안 · 또이" switch on the left, a small filled ink dot on the right (sync state; like the reference's corner dot).
2. Drawing/photo area (upper ~45%): a hand-drawn ink doodle (draw it as SVG paths that look hand-drawn: a little sock with a heart — today's note is "혼자 양말 신음!"), plus ONE photo taped onto the page like a polaroid (light rotation, two semi-transparent tape strips; use a CSS-drawn placeholder image, no external images).
3. Notes (lower area), handwritten, left aligned like the reference text block:
   - "처음으로 혼자 양말 신음! 왼발 오른발 바뀐 건 비밀" — by 아빠
   - "낮잠 안 자고 4시까지 버팀" — by 엄마
   Each note ends with tiny doodle sticker tags (hand-drawn mini icons + word, e.g. a star "처음", a moon "수면") and a small author mark: a hand-drawn circle with "아" / "엄" (each author's text may later use their OWN handwriting font — design so per-author font is natural).
   - A margin comment under the first note, drawn as a short curved ink arrow + smaller text: "엄마: 오늘 밤엔 일찍 재우자 ㅎㅎ", and a small hand-drawn heart with "아빠".
4. Date signature like the reference: "조비안. 10.26 월 · 3년 2개월" (age only when birth date known — keep the sample).
5. Bottom bar exactly in the spirit of the reference: two previous dates (doodle icon + "10.24", "10.25"), a large hand-drawn oval in the center with a "+" (opens write/draw), two next dates (or empty for future), and a far-right handwritten stacked label "달력 / 목록" that opens the archive. Dates with a page show their doodle icon; empty days show a faint dot.

## Other screens to show (side by side as phone frames, like v1's layout)
- ② 또이 on the same day: a different color (개나리 yellow), not born yet: header "또이. 10.26 월 · 출산 전", drawing of a tiny heart + "콩콩", note "산전검진 — 또이 2.1kg, 잘 크고 있대요" with a doodle tag "산전검진". Shows the per-page color picker opened as a row of 8 hand-drawn color blobs.
- ③ Draw mode: the same page color full screen; bottom tool row hand-drawn: 펜 (2 thicknesses), 지우개, 되돌리기, ink colors (ink + 3 crayons), 사진 넣기, 완료. Canvas must actually draw with pointer/touch (smoothed strokes, round caps) in the mockup.
- ④ 목록 + 검색: a handwritten search field with a wobbly underline and doodle filter chips (아이 · 태그 · 작성자); below, pages grouped by month as small colored page thumbnails (each a mini of its page: color + doodle + first line + date). Two-column grid of thumbnails.
- ⑤ 달력: hand-drawn month grid for 2026년 10월; each day with a page is a small blob filled with that page's color (two kids on one day → split the blob in two halves); today circled with a sketchy circle; tapping a day previews that page.
- ⑥ 설정: hand-drawn list — 아이 (조비안 생일, 또이 출산 예정일), 페이지 색 (기본 색, "모든 페이지에 적용" button, 아이별 기본 색), 글씨체 (아빠 글씨 / 엄마 글씨 — "내 글씨체 올리기" placeholder, currently 기본 손글씨), 백업, 화면 (라이트/다크/시스템).

## Visual system (put it as CSS tokens on :root)
- Fonts: Google Fonts only (allowed in the final app): "Gaegu" (weights 400/700) for everything; fallback "Nanum Pen Script", then system sans. Link via fonts.googleapis.com.
- Page palette (8 crayons, flat, saturated but friendly): 하늘 #7CC7F5, 개나리 #FFD23F, 숲 #0F4D3A, 코랄 #FF8B6E, 라벤더 #B8A4F2, 민트 #8FDCC2, 종이 #F4EBDD, 밤 #2E3550. Ink: #1E2326 on light pages, #F5F0E1 on dark pages (숲, 밤). Name the colors in Korean in the picker.
- Hand-drawn lines: no perfect geometry. Use SVG paths with slight wobble (write a tiny JS helper that turns a rect/line into a jittered path with a fixed seed so it is stable), stroke 2–2.5px, round caps/joins. Buttons and chips get hand-drawn outlines, never CSS border-radius pills.
- Chrome around pages (archive/settings backgrounds): 종이 #F4EBDD in light.
- DARK MODE (important, the user disliked v1's): not near-black. Chrome background #2B2F3A (soft night), surfaces #353A47, ink #F5F0E1, and hand-drawn outlines stay clearly visible (≥ 4.5:1 for text, ≥ 3:1 for outlines). Page colors switch to deeper but still colorful variants (e.g. 하늘 → #2F6F9E, 개나리 → #C79A1E, 코랄 → #C2593F, 라벤더 → #6E5BB8, 민트 → #2F8F74, 종이 → #4A4339; 숲/밤 stay) with light ink. Every card/thumbnail keeps a visible hand-drawn outline in dark mode.
- Provide the theme toggle (라이트/다크/시스템) at the top of the mockup page like v1, using :root tokens, @media (prefers-color-scheme: dark) guarded by :root:not([data-theme="light"]), and :root[data-theme="dark"].
- Motion: page change = horizontal slide with a 1–2° tilt (220ms); "+" oval wobbles slightly on press; respect prefers-reduced-motion.
- Touch targets ≥ 44px. Text ≥ 17px for notes (handwriting fonts read small), 15px minimum anywhere.

## Interactivity in the mockup (keep it light)
Switch 조비안/또이; open/close the color picker and recolor the page live (ink flips automatically); bottom-bar dates change the shown page among 3–4 sample pages; draw mode canvas works; theme toggle works. No persistence needed.

## Deliverable checks
Single self-contained HTML (inline CSS/JS; only external = Google Fonts link). Works at 375px wide frames. Below the phones, a short notes section (Korean) listing the tokens and rules, like v1. End your reply with what you could not do.
