Phase 8 — claude.ai Artifact build. Read AGENTS.md, then docs/artifact-api/{claude,db,user,downloads}.d.ts (authoritative API). Keep LocalStore and SupabaseStore working; this adds a third store and a build mode.

The app will be published as a claude.ai Artifact: one self-contained HTML file shown in an iframe. The two spouses open the same link; the platform's `db` capability is the shared database, `user` tells who is viewing.

1. `src/data/artifactStore.ts` implementing DataStore on `await claude.use("db")` + `await claude.use("user")` (both may resolve null → fall back to LocalStore so local preview still works). Type `window.claude` from the copied d.ts files (add them to tsconfig include or a `src/types/claude.d.ts` reference).
   Storage layout (keep it — the DB is capped at 25k docs and collection scans must stay small):
   - `meta/config` → `{ children: {[id]: Child}, tags: {[id]: Tag}, members: {dad: Member, mom: Member}, memberByUser: {[userId]: 'dad'|'mom'} }`
   - `months/<YYYY-MM>` → `{ entries: {[id]: Entry & {deletedAt?}}, comments: {[id]: Comment & {deletedAt?}}, reactions: {[`${entryId}__${memberId}`]: Reaction & {on: boolean}} }`
   - Every write is `update()` with a nested single-key patch (e.g. `{entries: {[id]: entry}}`) so concurrent writers never overwrite each other; use `set()` only when the month doc does not exist yet (get → set, then update). Deletes are tombstones (`deletedAt`), filtered out on read; undo clears the tombstone. Moving an entry to another month = tombstone in old + write in new.
   - Subscribe ONCE (on store init) to `meta/config` and to the `months` collection; build the snapshot from them. Never subscribe from render.
   - Writes are optimistic (update local cache first, then write; on rejection revert and emit a quiet error state). Serialize writes per document (a small promise queue per path) — the API requires one write at a time per doc.
   - If `meta/config` does not exist: show a centered calm message "기록장을 준비하고 있어요" (Claude seeds it after publishing). Do not write seed data from the page.
2. Who am I: `memberId = config.memberByUser[await user.id()]`. If unmapped (first visit), show a one-time full-screen picker in the app style: "누가 쓰고 있나요?" with two large buttons 아빠 / 엄마 → `update({memberByUser: {[uid]: 'dad'}})`. In 설정 › 가족, replace the LocalStore "이 기기 사용자" control with "나는 아빠/엄마" (changes this viewer's mapping). If `user.can("data.write")` is false, render read-only (hide composers) with a small note "보기 전용으로 열렸어요".
3. Backup download in 설정: when `await claude.use("downloads")` is non-null use `downloads.save({filename, data})` for JSON/Markdown; else fall back to the existing blob link. Restore (import JSON) writes via the same store methods, batching by month.
4. Build mode: `npm run build:artifact` → `vite build --mode artifact` producing ONE file `dist-artifact/index.html` with all JS/CSS inlined (add dev dep `vite-plugin-singlefile`). In artifact mode: no vite-plugin-pwa, no service worker registration, no manifest, store = ArtifactStore, no Supabase code in the bundle (dynamic import or mode check that tree-shakes).
   No external requests at all in this file: replace the Pretendard CDN <link> with a self-hosted font — add dev dep `pretendard`, and in artifact mode inline the smallest file that covers all Korean (prefer the variable woff2 subset if the package ships one) as a base64 `@font-face` data URI. Keep the CDN link for normal builds.
   `<title>육아 기록</title>`. The `:root` tokens and dark-mode blocks stay exactly as they are; `body` keeps its explicit background.
5. Tests: unit-test the month-doc merge logic (snapshot building, tombstones, reaction toggles, month move) with a tiny in-memory fake of the db API.

Report the final dist-artifact/index.html size.
