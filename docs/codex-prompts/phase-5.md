Phase 5 — Supabase backend. Read AGENTS.md. No Supabase project exists yet: write code + SQL only, do not try to connect. The app must keep working with LocalStore when env vars are absent.

1. supabase/migrations/001_init.sql: tables children, members (id = auth.users.id, display_name, color, role 'writer'|'reader'), tags, entries (uuid pk default gen_random_uuid(), child_id, date date, content, author_id, created_at, updated_at trigger), entry_tags; table allowed_emails(email, display_name, color, role). Trigger on auth.users insert: if email in allowed_emails, create members row. RLS: select for any member; insert/update/delete only for role='writer'; entries update/delete by any writer (spouses edit each other's notes). Seed children (조비안/조이, 또이) and preset tags. Enable realtime publication for entries, entry_tags, tags, children.
2. src/data/supabaseStore.ts implementing DataStore: email magic-link sign-in, realtime subscriptions that patch the local cache, optimistic writes. Offline outbox: queued mutations in localStorage, flushed on `online` and on app start; entries created offline use client-generated uuid so they are idempotent.
3. Sign-in screen (only in Supabase mode, before any tab): centered card, app name, email input, "로그인 링크 받기" button, sent state "메일함에서 링크를 눌러 주세요". Same design tokens.
4. Store selection in main.tsx by `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`. Add `.env.example`.
5. docs/SETUP.md (Korean, step by step for a non-developer): create Supabase project (region Northeast Asia/Seoul), run migration in SQL editor, insert both emails into allowed_emails, plus one backup reader email, set Auth redirect URL, copy keys into .env / Vercel env. Keep it short and numbered.
6. Include comments (uuid pk, entry_id fk on delete cascade, content, author_id, timestamps) and reactions (entry_id, member_id, emoji, pk(entry_id, member_id)) tables with the same RLS (writers may edit/delete only their own comments/reactions) and realtime, implemented in SupabaseStore.

Also fix these review findings from phase 4 (small, do first):
- 설정 아이 row: an unborn child without dates shows "생일을 입력해 주세요"; it must show "출산 전 · 예정일을 입력해 주세요" (with a due date: "출산 예정일 YYYY. M. D · D-N").
- 자동 백업 row shows the green `.ok` dot even when status is "설정 안 됨"; show it only when a lastBackupAt was fetched (use a `--line`-colored dot otherwise).
- src/lib/exportFormat.test.ts expects '- 첫 걸음 🌟처음 — 아빠' but the (correct, per spec) output is '- 첫 걸음 #🌟처음 — 아빠'. Fix the test expectation, not the formatter.
