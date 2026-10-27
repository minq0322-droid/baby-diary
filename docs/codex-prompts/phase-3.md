Phase 3 — 달력 + 피드. Read AGENTS.md. Match the "② 달력" phone in docs/design/mockup.html. Reuse ChildCard/Composer from features/today (do not duplicate them).

src/features/calendar/* and src/components/BottomSheet.tsx:
- Month header "2026년 10월" + ‹ › and horizontal swipe on the grid to change month. The grid shows as many week rows as the month needs (4–6). Today = filled circle, selected day = field background, muted days outside the month (still tappable).
- Each day: one dot per child that has entries (child color), 💉 mark when any visible entry has the vax tag.
- Tap a day → BottomSheet (spring, scrim, drag-down or 닫기 to close) with title date, a ChildCard per child (can add/edit/delete there), and a text button "이 날로 이동" that switches to the 오늘 tab on that date (lift current date state to App).
- FilterBar (sticky): kid segment 전체/each child; 태그 multi-select popover (chips of all tags); 작성자 popover (전체/아빠/엄마); 검색 icon expands to a text input (case-insensitive substring on content). Filters apply to both the dots and the feed. A small "필터 초기화" text button shows when any filter is active.
- Feed below: all matching entries newest date first, grouped by date header ("10월 24일 토 · 오늘"), each group in a .feed-card; show the kid name tag when kid filter = 전체. Infinite scroll: load ~60 days at a time going back (IntersectionObserver), stop at the oldest entry. Tapping a feed entry opens the same day sheet.
- When the feed scrolls up past the grid, collapse the grid to the week row containing the selected/today date (smooth height transition); scrolling back to the top expands it.
- Feed empty state: one-line hint "조건에 맞는 기록이 없어요".

Also fix this review finding from phase 2:
- Tapping a TagChip moves focus out of the textarea, so typing after picking a tag goes nowhere. Keep focus in the textarea: `onPointerDown={e => e.preventDefault()}` on chips (and the send button), and the card must stay `.active`. Applies wherever Composer is used.
