User feedback from the phone. Read AGENTS.md. Small, focused changes.

1. Drawing tools tray covers the canvas on phones. Place the tray BELOW the drawing area (in normal flow, not overlaying the canvas), still above the writing area / bottom bar; on short screens the drawing area shrinks so canvas + tray fit. The canvas must never be covered by any control while drawing.
2. Day counter (user wording): "D+N" for a born child = days since birth relative to the PAGE's date (birth day itself = D+0). Example to put in a test: birth 2026-03-17, date 2026-10-27 → "D+224". Unborn child: due date set → "D-N" (due day = "D-day"), not set → "출산 예정일 미정".
   - Add `dayCounter(child, dateKey)` in lib/date.ts (keep ageLabel for other uses) with tests incl. month/year boundaries and the example above.
   - Show it on the diary page header next to the date (e.g. "10.27 화 · D+224"), and use it in Home face aria-labels/long-press bubble and the 목록 cards.
   - 설정 › 아이: make sure each child has clear date fields — 태어남: "태어난 날"; 출산 전: "출산 예정일 (선택)" with a "아직 미정" toggle that clears it. Saving updates immediately everywhere.
3. Rebuild nothing else.
