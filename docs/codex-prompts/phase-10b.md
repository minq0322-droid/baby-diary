Phase 10b — rework of phase 10 (review failed). Read AGENTS.md (esp. "Definition of done") and docs/design/mockup-v3.html. Behaviour of phase 10 mostly works; the problems are structure and missing features.

1. Structure: src/App.tsx is ~105 lines of 300-char one-liners holding every screen. Split into readable, Prettier-formatted files:
   `src/App.tsx` (shell + view state only), `src/features/home/{HomeScreen,KidCard,PageCard,RecentPages,SearchPill}.tsx`, `src/features/archive/ArchiveScreen.tsx`, `src/features/calendar/{CalendarScreen,MonthGrid,DayPreview}.tsx`, `src/features/settings/{SettingsScreen,ChildEditSheet,PageColorSheet,FontUpload,BadgeManager,BackupSection}.tsx`, `src/components/{BottomNav,Sheet,Toast,Icon,StrokePreview,Palette}.tsx`. One component per file, JSX on multiple lines.
2. Restore features lost in phase 10 (they existed before):
   - 아이 편집 sheet: 이름, 태명, 상태 태어남/출산 전, 생일 or 출산 예정일, 기본 페이지 색 (Palette, AGENTS.md order) → `store.updateChild`.
   - 글씨체: uploading a font must save it: add `DataStore.updateMember(member)` (Local/Artifact/Supabase) and store `fontAssetId` (the uploaded asset src). Show the current state ("기본 손글씨" / "내 글씨체 사용 중" + 되돌리기).
   - 배지 관리: add / rename / reorder ↑↓ / hide (preset) / delete (custom), as the old tag editor did.
   - 백업: JSON and Markdown export (via the downloads helper already in src/lib/download.ts), import with a preview "N개 페이지 추가, M개 건너뜀" before applying.
   - Artifact mode: "나는 아빠 / 엄마" in 설정 › 가족 (uses the viewer mapping), and the first-visit writer picker if it was removed.
   - 페이지 색 sheet: choose target 전체 / 조비안 / 또이, then the confirm step, then `setAllPageColors`.
3. Home fixes: kid card title must be the child's `name` (조비안), not the nickname; 또이 shows "출산 전" only once (status line below shows the record state); replace the 🏷️ emoji badge marker with the hand-drawn star icon used in the mockup; keep `word-break: keep-all`.
4. Keep all existing tests passing; add a small test for the settings color-target logic if you extract it into a pure function.
