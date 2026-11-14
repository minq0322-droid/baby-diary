Phase 24 — never lose a drawing (draft autosave + restore). Read AGENTS.md first ("Definition of done", "Data access"). Read only these source files: `src/features/page/PageScreen.tsx`, `src/features/page/DrawingArea.tsx`, `src/App.tsx`, `src/normalApp.tsx`, `src/data/DataStore.ts`, and whatever they import that you must change. Do not touch Home, archive, calendar or settings.

## Why (the user's words, 2026-11-14)
"그림을 그리다가 저장이 안되어서 날아가버린게 너무 많아. 저장 기능을 강화하고 싶어."
Today a page is stored only when 저장 is pressed. Anything drawn or written before that lives only in React state, so it is lost when iOS kills the backgrounded PWA, the tab reloads, the app updates itself (fix-12 self-update), the battery dies, or the Artifact host reloads the frame. `beforeunload` never fires in those cases on iPhone. (Once 저장 is pressed, SupabaseStore already keeps its outbox in localStorage, so that part is fine.)

## Build

1. **`src/lib/draft.ts` — device draft store** (pure module + tests).
   - Key: `yuga-draft:v1:<pageId>`. Value: `{ v: 1, page: Page, baseUpdatedAt: string | null, savedAt: string }` (`baseUpdatedAt` = the stored page's `updatedAt` the draft started from, null for a new page).
   - `writeDraft(pageId, page, baseUpdatedAt)`, `readDraft(pageId)`, `clearDraft(pageId)`, `listDrafts()`, `pruneDrafts(now)` (drop drafts older than 30 days).
   - Every storage access in try/catch: localStorage may throw (private mode, Artifact preview, quota). On a quota error, prune the oldest drafts once and retry once; if it still fails, return `false` so the UI can say so. Never throw to the caller.
   - Photos: drafts keep photo entries as they are in the page (uploaded URLs). A photo that is still a `data:` URL may be dropped from the draft if the write would exceed ~1.5 MB; strokes and text are never dropped.
   - Unit tests: round-trip, prune by age, quota fallback (mock storage that throws), corrupted JSON → `null`.

2. **Autosave the draft while editing** (PageScreen + DrawingArea).
   - Write the draft on every finished stroke (pointerup / pointercancel), photo add/move/remove, colour or badge change, and text input (debounced 400 ms). Only when `dirty` and the page is the current writer's own page.
   - Also flush immediately on `visibilitychange` (hidden), `pagehide`, `freeze`, and before the self-update reload (find where fix-12 reloads and flush drafts first — expose a tiny `flushDrafts()` registry in `lib/draft.ts` that open pages register into).
   - An in-progress stroke (finger still down) when the page is hidden is ended and included.
   - On a successful 저장 (`persist()` returns a page), clear that page's draft. On 버리기 (explicit discard), clear it.

3. **Restore on open.**
   - When PageScreen opens a page and a draft exists for that page id:
     - if the stored page is missing or its `updatedAt` equals the draft's `baseUpdatedAt` → load the draft into the editor (dirty, editing on) and show a quiet banner under the top bar: `저장 안 된 그림을 되살렸어요` with buttons `저장` and `버리기` (버리기 asks once inline: `되살린 내용을 버릴까요?` `버리기` `취소`).
     - if the stored page changed since (someone saved from another device) → do not overwrite. Banner: `다른 기기에서 바뀐 뒤의 임시 내용이 있어요` with `임시 내용 보기` (opens the draft as an unsaved copy the user can 저장 over, after one inline confirm `지금 저장된 내용을 이걸로 바꿀까요?`) and `버리기`.
   - New-sheet drafts (pages not yet stored, including extra sheets `__xxxxxxxx`): on Home/calendar entry for that child+date, the draft is found by id and restored the same way.
   - Home: if any draft exists for today, the child's face long-press summary keeps working; additionally show a small toast once per app start: `임시 저장된 페이지가 N장 있어요` with `열기` (opens the newest). Keep it quiet — no badge on the faces.

4. **Leaving with unsaved edits.** Replace the current pending-discard prompt (`navigate` → `setPending`) with a sheet of three choices, in this order: `저장하고 나가기` (primary, only when `canSave`), `임시로 두고 나가기` (draft stays; a later open restores it), `버리고 나가기` (danger, clears the draft). Esc/outside tap = stay. Text in Korean, 44px targets, keyboard focus ring.

5. **Visible state.** In the sheet-number row, show a tiny status after the sheet dots: `임시 저장됨` (sub colour) after a successful draft write, `임시 저장 실패 · 저장을 눌러 주세요` (error colour, role=alert) when `writeDraft` returned false. No spinner, no layout shift (fixed width slot).

6. **Artifact build** uses the same draft store (localStorage works there but may throw — already handled). Do not add capabilities.

## Rules
- Plain CSS in `src/styles/page.css`, tokens only, light + dark, reduced motion respected, safe areas.
- Korean IME: never act on Enter while composing.
- Keep components small: put the leave sheet in `src/features/page/LeaveSheet.tsx` and the banner in `src/features/page/DraftBanner.tsx`; the autosave wiring in a hook `src/features/page/useDraftAutosave.ts`. PageScreen.tsx must not grow by more than ~40 lines.
- No new dependencies. No `console.log`.

## Tests (vitest)
- `src/lib/draft.test.ts` as above.
- `src/features/page/draftRestore.test.ts`: pure decision function `decideDraft(stored: Page | undefined, draft)` → `'restore' | 'conflict' | 'none'` (put the function in `lib/draft.ts`).

## Done report (write to `docs/codex-prompts/phase-24.out.md`, short)
Files changed, what each does in one line, test names, anything you could not verify (e.g. esbuild "Access is denied"). Do not commit, push or deploy.
