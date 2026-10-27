Phase 7 — 댓글 & 하트 UI. Read AGENTS.md.

First fix these review findings from phase 6 (blocking bugs):
- supabase/migrations/001_init.sql: `entries` lost its update/delete policies when it was removed from the generic loop, so nobody can edit or delete entries. Add `writer_update` (using/with check is_writer()) and `writer_delete` (using is_writer()) on public.entries. Keep the insert policy and keep_entry_author trigger as they are.
- .github/workflows/backup.yml: it checks out the `backups` branch and then runs `npm ci`/`npm run backup` there, but that branch has no app code. Check out the default branch into `app/` and the `backups` branch (or a new orphan) into `out/` (two actions/checkout steps with `path:`), run `npm ci` and `npm run backup` in `app/` with `OUT_DIR: ${{ github.workspace }}/out`, then commit/push from `out/`. Make sure the orphan case works on the first run.

Then:
 Data layer already exists (phase 4/5). Keep the calm mockup style: comments must feel like quiet margin notes, not a chat app.

- Under each entry (오늘 cards, day sheet, feed): its comments render inline, indented 12px with a 2px left border in the commenter's member color; body 16px, meta 13px. Author dot + name + relative time ("방금", "3분 전", "어제 오후 9:20").
- Entry meta row gains, at the end: ❤️ with the names who hearted (e.g. "❤️ 아빠") when any, and "💬 2" count only in the feed (where comments are collapsed to the latest one + "댓글 2개 모두 보기").
- ActionSheet order for an entry: 댓글 달기 / ❤️ 좋아요 (or 좋아요 취소) / 수정 / 삭제 / 취소. 수정·삭제 stay available for both spouses.
- 댓글 달기 opens a compact composer right under that entry (same .field style, placeholder "댓글 남기기", ✓ / Enter to save, Esc or tapping elsewhere cancels). Double-tap on an entry toggles the heart with a small pop animation (respect reduced motion).
- Tap own comment → ActionSheet 수정 / 삭제 / 취소. Others' comments are read-only.
- New-reaction cue: when the other member commented or hearted since this device last opened that day, show a small dot (member color) next to the entry count on the card header and on the calendar day; clear it once the card is seen. Store last-seen per date in localStorage.
- Tests for relative-time formatting.
