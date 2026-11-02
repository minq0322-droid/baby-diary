Phase 23 — (A) dark-mode text bug, (B) one parent can write several sheets per child per day. Read AGENTS.md first. Do not touch anything else (iPad layout, home motion, etc.).

## A. Dark mode
Root cause, confirmed in a browser: the old shell rule `.note { background: var(--card); border-radius; padding: 18px; box-shadow; font-size: 14px }` (app.css:191) and `.notes { max-width; margin: 40px auto 0; display: grid; ... }` (app.css:190) leak into the diary page. `.note` there is the read-only paragraph in `WritingArea`, shown when reading a page not in edit mode (e.g. the other parent's page). Text uses `--page-ink` (dark) on `--card` (dark navy in dark mode): contrast 1.13, invisible. In light mode it shows as a white framed card, which also violates the "no frames" spec.
1. Fix so the read paragraph sits directly on the page color, same size/line-height as the editor (20px/35px, handwriting font, no background, shadow, radius, padding), and `.notes` in the diary is not a grid and has no 40px margin. Scope to `.diary`; remove the old rules if nothing else uses them (grep first).
2. Render no empty `.note` paragraph when the text is blank (today the other parent's empty page shows an empty card).
3. `.initial` opacity .5 → .7 (contrast 2.6 today).
4. `tokens.css`: `color-scheme: light` on `:root`; `color-scheme: dark` in both dark blocks, so native controls (date picker, select popups, file buttons, scrollbars) follow the theme.
5. Any other `input`/`textarea`/`select` in `src/styles` without an explicit color: give it `color: inherit` or a token. No other visual changes.

## B. Several sheets per day, per parent
Spec change: **one or more sheets per child per day per parent.**

### IDs (no data migration; existing rows must keep working untouched)
- First sheet keeps `${date}__${childId}__${authorId}`. Additional sheets: that base + `__` + 8 random `[a-z0-9]` chars (random so two devices of one parent cannot collide).
- New `src/lib/pageId.ts` holds everything about this format: `basePageId(...)`, `newSheetId(...)`, `isValidPageId(page)`, and `sheetsFor(pages, date, childId, authorId)` sorted by `createdAt`, then `id`. Use it instead of string concatenation in new code.
- Audit every place that assumes one page: `src/lib/exportFormat.ts:75` validator (version 3 must accept both forms, or restoring a backup would reject real data; keep rejecting malformed ids), `src/data/migrate.ts`, `legacyAdapter.ts`, `artifactStore.ts`, `supabaseStore.ts`, `localStore.ts`, `importPhotos.ts`, `src/lib/datedArchive.mjs`, `features/settings/bookExport.ts`, `bookLayout.ts`, `scripts/backup/*`. A sheet must never be merged into, overwritten by, or dropped because of another sheet of the same day. In particular check dated-archive and book output keep all sheets, in order.
- Add `supabase/migrations/20261102000000_multi_page_sheets.sql`: drop the unnamed `pages` check on `id` (find it by definition in `pg_constraint` in a DO block, it must fail loudly if not found) and add a named check allowing the base id, or base + `__` + `[a-z0-9]{8}`. Do NOT run it; the reviewer applies it.

### Stores
Add `getPageById(id)` to `DataStore`, following each store's existing `getPage` semantics (ArtifactStore lazily loads bodies: return undefined when not cached so `loadPage` still runs). Keep `getPage` working.

### Navigation
- `Screen.page` and `openPage` gain optional `pageId`. Archive rows, cards and calendar entries pass the tapped `page.id`. Include `pageId` in the `PageScreen` key in `App.tsx`.
- No `pageId` given (Home tap, ‹ › date change, parent switch): open that parent's **latest** sheet of that date, else a blank first sheet with the base id.
- `PageScreen` opening a `pageId` with no saved page = blank sheet with that id, in edit mode.

### UI
Page spec still applies: quiet, no frames. Directly under the parent faces, one small row `.page-sheets`, keeping the row's height stable so the layout does not jump:
- Numbers `1 2 3` for the displayed parent's sheets of this day (`aria-label="N번째 장"`, `aria-pressed` on the current one). Show only when there are 2+ sheets or an unsaved new one; an unsaved new sheet shows as the last number.
- `＋` (`aria-label="한 장 더 쓰기"`), only on the writer's own parent, not read-only, and only when the current sheet is saved. It opens a new blank sheet with `newSheetId`, in edit mode.
- All of these go through the existing `navigate()` unsaved-changes guard. Hit area ≥44px, using `--page-ink`/`currentColor`, Gaegu.
- Saving returns Home with the toast as today. Comments and reactions stay per sheet. Home's 30 marks, calendar fill and `DayPreview` count days as before; lists show each sheet as its own row or card.
- No sheet delete UI (none exists for pages today).

## Docs
Update AGENTS.md: first paragraph, the `Page` id line, and spec #3 top-area list.

## Done
- `npx tsc -b` passes. Add tests: `pageId.ts`, export validator accepts/rejects, `migrateSnapshot` keeps two same-day sheets, store save/load of a second sheet (local, artifact, supabase test doubles), `datedArchive` keeps both, and `sheetsFor` order. Vite/vitest may fail in this sandbox, expected.
- End with: files changed, anything not done, what the reviewer should check.
