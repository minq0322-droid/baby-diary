Phase 22 — calendar: recorded days obvious at a glance, day entries as a list (cards optional), no screen title. Read AGENTS.md (spec #2 app shell: on every screen the thing to choose and the most important info are obvious at a glance). Touch only src/features/calendar/*, src/features/archive/* (only to share the row component), src/styles/* for calendar/archive, tests. Do not touch src/features/home/*.

## 1. Remove the title
- Remove the `<h1 className="screen-title">달력</h1>`; the month navigation (‹ 2026년 10월 ›) becomes the top row. Keep an accessible name for the screen (e.g. aria-label on the container) so screen readers still hear "달력".

## 2. Recorded days must be obvious in the month grid
- Currently a recorded day only gets tiny dots. Replace with a clear, calm fill: a day with any page gets a soft rounded tile filled with the child's page color (display color rules from AGENTS.md incl. dark-mode mixing). If both kids have pages that day, split the tile (left/right halves or two stacked bands) in each child's color. Day number stays readable on the fill (auto ink contrast rule).
- A small count or the parents' initials are NOT needed in the cell; keep cells clean. Optional: a tiny star mark if any page that day has a badge.
- Empty days: plain number, no fill. Today: a ring. Selected day: a stronger ring/outline distinct from today's. Days outside the month: faded, still tappable.
- Keep the legend (child color + name) under the grid, compact on one line.
- Cells ≥ 44 px tall; must fit 7 columns at 375 px without overflow.

## 3. Tapping a date shows that day's diaries as a LIST by default
- Below the grid: a heading with the date (e.g. "10월 27일 화") and a list/cards toggle button identical in look and behavior to the 목록 screen's toggle.
- Extract the 목록 screen's list row (`archive-list-row`: date, child name, 엄마/아빠, badge star, first line of text) into a shared component, and use it in both places (no duplicated markup). In the calendar the date part may be omitted since the heading shows it.
- Toggle preference: share the SAME localStorage key and default as the 목록 screen (`archive-view:<memberId>`; default list, 'cards' when chosen), so the choice is one setting across both screens. Wrap storage in try/catch.
- Cards mode: the existing PageCard grid, as now.
- Kids with no page that day: in list mode show a quiet row "＋ {아이 이름} 기록하기" that opens that child's page for that date (same as the current empty PageCard click); in cards mode keep the current empty PageCard. If no one wrote that day, show the rows plus the existing hint "이 날의 기록을 남겨보세요."
- Keep openPage behavior (opens the tapped page's author).

## Done
- `npx tsc -b` passes; tests for the day-fill computation (which children recorded a date → fill segments) and the shared view preference. Vite/vitest may fail in this sandbox — expected.
- Check at 375×812 and 1280×800, light and dark.
- End with: files changed, anything not done, what the reviewer should check.
