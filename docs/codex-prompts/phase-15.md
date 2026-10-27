Phase 15 — diary page per parent, book export, dated backups. Read AGENTS.md ("Design specs" 3, data model). Data layer (phase 13) and Home (phase 14) exist.

Fix these review findings from phase 14 first:
- Fireflies are drawn at night too (seen in both 달 and 풍등 modes). Fireflies belong to the light/day garden only; at night draw stars + shooting stars only.
- The placeholder face (no profile photo yet) draws the child's initial ("조", "또") on top of the illustrated face's forehead. Use either the illustration or the initial, not both: keep the soft illustrated face, drop the letter (the accessible label already has the name).
- Light mode: the bottom 목록 · 달력 · 설정 icons sit on the flower bed and are hard to read. Give the icon row a soft translucent backdrop (blurred, page-tinted pill) or move the flowers below it, keeping it quiet but readable (≥ 4.5:1 for labels).


1. Diary page (src/features/page/):
   - Remove every visible border/frame/dashed outline/ruled line between or around the drawing and writing areas — one continuous page color. Empty drawing area shows only a faint centered hint text "여기에 그려요" that disappears on first stroke.
   - Drawing area spans the full viewport width edge to edge (no side padding; safe-area insets only for the controls). Writing area keeps comfortable side padding for text only.
   - "엄마의 페이지 · 아빠의 페이지" small switch under the top bar; horizontal swipe also switches. The current writer's own page is editable; the other parent's page is read-only (shows "엄마가 아직 안 썼어요" softly if empty). Each page has its own color/drawing/photos/text/badges/comments.
   - Drawing resolution for print: keep strokes as vectors (already normalized); photos keep their uploaded resolution (downscale to max 2560px long side, JPEG 0.9 — update lib/image.ts).
2. Book export (설정 › 책으로 만들기): pick range (start/end date), child (전체/조비안/또이), parent (둘 다/엄마/아빠). Render each page offscreen at print resolution (A5 portrait 148×210 mm at 300 dpi = 1748×2480 px): page color background, drawing (re-rendered from vectors at full res), photos, text in Gaegu (or the author's font), date + child + author footer, badges. Output:
   - PDF via `jspdf` (one diary page per PDF page, images embedded at full res, plus a simple cover page "조비안 · 또이의 일기 2026.10 – 2026.12").
   - ZIP via `jszip` of PNGs named `YYYY-MM-DD_<child>_<author>.png`.
   Lazy-load both libs (dynamic import). Show progress ("12 / 40 페이지"), allow cancel, and save through the downloads helper (artifact `downloads` capability or blob link). Fonts must be loaded (document.fonts.ready) before rendering.
3. Dated backups: settings "백업 내려받기" now produces a ZIP from `toDatedArchive` (per-date JSON + per-day Markdown) plus `backup.json` (full v3). Update scripts/backup/backup.mjs to write the same dated tree into OUT_DIR so GitHub/OneDrive backups accumulate day by day (never delete old dated files; only rewrite changed ones).
4. Tests: export page layout math (mm→px), file naming, dated archive with two parents on one day, backup script dry-run on a fixture.
