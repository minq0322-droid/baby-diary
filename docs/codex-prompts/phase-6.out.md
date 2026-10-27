Phase 6 is implemented. The migration now gives members read access and self-update access only to `display_name` and `color`; entry inserts require the authenticated writer’s own `author_id`, which updates preserve.

Added the Node backup script and npm command, GitHub Actions workflow, OneDrive scripts, and Korean backup guide. Updated `docs/SETUP.md` with the backup reader account setup.

**Verification:** `npx.cmd tsc -b`, `node --check scripts/backup/backup.mjs`, and `git diff --check` passed. No scheduler task was registered and no Supabase network calls were made.

**Files changed:** `supabase/migrations/001_init.sql`, `docs/SETUP.md`, `docs/BACKUP.md`, `package.json`, `.github/workflows/backup.yml`, and `scripts/backup/{backup.mjs,onedrive-backup.ps1,register-task.ps1,unregister-task.ps1}`.

**Reviewer check:** Confirm the Task Scheduler trigger timing and the workflow’s creation of the `backups` branch.