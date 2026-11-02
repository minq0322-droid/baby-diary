OpenAI Codex v0.164.0
--------
workdir: C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
model: gpt-6.1-sol
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR]
reasoning effort: high
reasoning summaries: none
session id: 01a199a9-dbe9-7330-ab63-aab6ef7f2966
--------
user
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

codex
먼저 AGENTS.md와 페이지 저장·탐색 경로를 확인한 뒤, 다크 모드 글쓰기 영역과 여러 장 지원만 수정하겠습니다. iPad 레이아웃과 홈 애니메이션은 건드리지 않겠습니다.

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content AGENTS.md; git status --short; rg --files -g '*page*' -g '*Page*' -g '*Store*' -g '*store*' -g '*migrat*' -g '*export*' -g '*book*' -g '*datedArchive*' -g '*legacyAdapter*' -g '*importPhotos*' -g '*test*' -g '*.css' -g '*App*' -g '*navigation*' -g '*Screen*' -g 'package.json' -g '*backup*'" in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
 exited 1 in 3281ms:
# ?≪븘 ?쇨린 ??Codex ?묒뾽 洹쒖튃

A couple (?꾨튌/?꾨쭏) keeps a diary for their two kids: **one page per child per day per parent** (?꾨쭏???섏씠吏 and ?꾨튌???섏씠吏 are separate), with a drawing/photo area on top and handwritten-style text below. Mobile-first web app (PWA build + claude.ai Artifact build; an app-store release via a native wrapper is planned, so keep everything web-standard and backend-agnostic), Korean UI only. The pages may become a printed book: drawings and exports must stay high-resolution.
Do only the phase you are asked to do. Keep changes minimal and focused; do not refactor other phases' code.

## Kids (seed data)
| id | name | nickname | birth_date | due_date | default page color |
|---|---|---|---|---|---|
| `kid1` | 議곕퉬??| 議곗씠 | null (set in ?ㅼ젙) | null | 踰싰퐙 `#F4B9B8` |
| `kid2` | ?먯씠 | ?먯씠 | null ??**not born yet** | null (set in ?ㅼ젙) | 諛뺥븯 `#CDEFE2` |

Age label (`lib/date.ts#ageLabel`, already implemented):
- birth_date set ??`N媛쒖썡` (<24 months), `N??M媛쒖썡` (??4), `?앺썑 N?? (<1 month).
- no birth_date, due_date set ??`異쒖궛 ?덉젙 D-N` (or `D-day`, or `異쒖궛 ?덉젙??吏??).
- neither ??`異쒖궛 ?? for kid2, nothing for kid1.

## Stack (do not add other runtime deps)
- Vite + React 18 + TypeScript (strict), `vite-plugin-pwa`, `date-fns` (ko locale), `@supabase/supabase-js`, `vitest`, plus `jspdf` and `jszip` for book export (lazy-loaded with dynamic import).
- **Plain CSS, no Tailwind, no CSS-in-JS.** Styles in `src/styles/`.
- No router library: view state in React state.

## Design specs (user approved)
1. **Home** = `docs/design/home-c1-moon.html` (night style ?? and `docs/design/home-c3-lantern.html` (night style ?띾벑); the user picks the night style on Home (default ??. Day (light theme): select ?몄쓣 ?몃뜒 (default, `docs/design/home-day-sunset.html`) or 誘쇰뱾??(`docs/design/home-day-dandelion.html`) on Home. Sunset suns have 30 ridge wildflowers (bloom/bud), with periodic bird flocks; dandelion heads have 30 seeds (fluffy/faint), with drifting background seeds and soft meadow grass. Stems end above navigation. Night (dark theme): starfield with twinkle + shooting stars, faces as moons with a 30-star crown, or as sky-lanterns with 30 beads. The 30 marks = the last 30 days; a day counts as written if EITHER parent saved a page for that child. No names on the home; accessible labels carry name + summary. Long-press a face ??"理쒓렐 30??以?N??湲곕줉". All four styles wander smoothly across the whole safe scene below the date and above navigation (12?20 px/s on mobile, faster on desktop), with gentle tilt/bob, soft face separation, and steering away from the scene switcher. One shared animation clock pauses when hidden. Dandelion stems stretch/bend from fixed ground roots; sunset suns float freely while their 30 flowers slide horizontally along the hill below. After long-press, moving over 6px picks up the face and its marks; release flings it within safe scene bounds above navigation, with friction and edge/circle bounces; wandering resumes where the fling settles without springing home. A fling never opens a page. Reduced motion is static and drag returns directly home. Lanterns must not overlap each other's bead strings. Scene selection lives in one artwork object placed naturally per scene, with face steering avoiding its own area: sunset has a small 30px orange-rose setting sun half-occluded by the actual far ridge toward the right (6s breathing halo, faint rim shimmer, 14s gentle sinking); dandelion keeps the ladybug on its drifting seed; moon has a quiet warm-white thin four-point glint only slightly larger than background stars (4.5s subtle twinkle, soft flare every 12s); lantern has a small dim distant lantern (8s rise/sway plus flicker). Object motion shares the paused-when-hidden scene clock; all objects are static with reduced motion. Each is an accessible button named ?λ㈃ 諛붽씀湲?with an invisible ??4px hit area and keyboard-only focus ring, behind faces and never a collision body. First three device-local Home visits shimmer once after 1.5s (no reduced-motion animation). A frosted strip groups four SVG scene thumbnails under ??諛? choosing persists the corresponding HomePreferences style and explicit light/dark theme, crossfades for 400ms (instant with reduced motion), and closes. Outside tap, Esc and back also close it. ?ㅼ젙 ???붾㈃ keeps only ?쒖뒪???쇱씠???ㅽ겕 and the hint ?덉쓽 ?묒? 吏뫢룸Т?밸쾶?댟룸퀎쨌?띾벑???꾨Ⅴ硫??λ㈃??諛붽? ???덉뼱??
2. **App shell** (archive list, calendar, settings, sheets): `docs/design/mockup-v3.html` ??Pretendard, clean cards, dark filled pills/buttons, soft navy-violet dark mode. Intuitive = on every screen the thing to choose and the most important info are obvious at a glance.
3. **Diary page** (one child, one day, one parent): full-bleed page color, Gaegu handwriting, hand-drawn ink. NO visible borders/frames between the drawing and writing areas; the drawing area spans the full screen width edge to edge. ONLY: top bar (??back, date with ???? ONE badge icon), a small "?꾨쭏???섏씠吏 쨌 ?꾨튌???섏씠吏" switch (swipe or tap), drawing, writing, bottom (?뮠 comments, big oval ????섏젙).
- Flow: Home ??tap a face ??that child's page for today, opened on the current writer's own page ???????back to Home with toast "??ν뻽?댁슂". Reaching Home's archive/calendar/settings: small, quiet icons at the bottom of Home (not competing with the faces).
- **Current writer**: use store.getCurrentMemberId() (first-visit full-screen picker / settings). No per-page writer choice. The current writer's paragraph is editable, with a small author initial beside each paragraph. Save requires text, drawing, or photo.
- Page palette: shared ColorPicker with 3 recommended colors (踰싰퐙 #F4B9B8, 諛뺥븯 #CDEFE2, 洹?#F59157), up to 5 viewer-local recent colors, and a frozen 40-swatch pastel grid (10 rainbow hue families 횞 4 tones), including all 16 legacy named colors. Normalize old colors to the nearest grid color on load. Pen colors are separate: auto ink plus 8 deeper crayons, stored per Stroke.color; `ink` means auto ink. Display colors mix 90% page color + 10% #262638 in dark mode. Auto ink chooses #1E2326 or #F5F0E1 by highest WCAG contrast against the displayed color.
- Light + dark via `prefers-color-scheme`, overridable with `data-theme` on `<html>`. Touch ??44px. Respect `prefers-reduced-motion`. Safe-area insets on fixed/sticky edges.
- Korean IME: never act on Enter while `isComposing`. Use `word-break: keep-all` for Korean labels (mockup bug to avoid: "湲곕줉 ?꾨즺 쨌 ??鍮? wrapping).

## Data model (`src/data/types.ts`)
```ts
Child    { id; name; nickname?; birthDate?; dueDate?; color: 'kid1'|'kid2'; pageColor: string; sortOrder;
           photo?: ProfilePhoto; photoHistory: ProfilePhoto[] }   // history kept until the user deletes an item
ProfilePhoto { id; src: string /* asset url */; createdAt }       // already cropped to a 1024px circle-ready square
Member   { id: 'dad'|'mom'; displayName; color: 'dad'|'mom'; fontAssetId?: string }   // own handwriting font later
Tag      { id; label; emoji; tone; sortOrder; preset; hidden? }                        // "諛곗?" in the UI
Page     { id: `${date}__${childId}__${authorId}`; childId; date: 'YYYY-MM-DD'; authorId: 'dad'|'mom';
           color?: string /* only when the author picked one; otherwise the child's pageColor applies */;
           drawing: Stroke[]; photos: Photo[]; text: string; tagIds: string[]; createdAt; updatedAt }
Stroke   { color: string; width: 2|5|14 (eraser = 14 with color 'erase'); points: number[] /* x,y pairs normalized 0..1, 3 decimals */ }
Photo    { id; src: string /* asset url or data URL */; x; y; w; rotation }            // normalized 0..1 placement
Note     { id; authorId: 'dad'|'mom'; text; createdAt; updatedAt }                      // paragraphs, each with its author
Comment  { id; pageId; content; authorId; createdAt; updatedAt }
Reaction { pageId; memberId; emoji: '?ㅿ툘' }
```
Page size budget: keep a page JSON under ~150 KB (simplify strokes; photos are stored outside the page as assets/URLs ??never inline a full-size photo).
Dates are Asia/Seoul calendar dates; never use `toISOString()` for a date key.

## Data access
All UI talks to `DataStore` (`src/data/DataStore.ts`). Stores: `LocalStore` (no setup), `ArtifactStore` (claude.ai db), `SupabaseStore`. Writes are optimistic, but a failed write must NEVER silently switch the app to read-only: keep the edit, show a visible retry banner with the reason, and retry automatically. Only `revoked`/`not_granted` disable writing.
ArtifactStore layout: `meta/config` (children incl. profile photos, tags, members, memberByUser); `index/<YYYY-MM>` (small per-month summaries: pageId ??{date, childId, authorId, color?, firstLine, tagIds, hasDrawing, photoCount, updatedAt, deletedAt?} + comments/reactions); `pages/<pageId>` (one full page per document, ??200 KB enforced before writing ??simplify strokes further or refuse with a clear message). Photos and profile photos go to the `assets` capability, never inline.

## Definition of done (every phase)
- `npx tsc -b` passes. In this sandbox `vite build`/`vitest` may fail with "Access is denied" (esbuild spawn) ??expected; the reviewer runs them.
- Readable code: Prettier-style formatting, one statement per line, small components.
- No `console.log`, no unused files. Old v1 UI files that a phase replaces are deleted in that phase.
- End your reply with: files changed, anything not done, what the reviewer should check.
?? docs/codex-prompts/phase-23.md
?? docs/codex-prompts/phase-23.out.md
rg : 'rg' 용어가 cmdlet, 함수, 스크립트 파일 또는 실행할 수 있는 프로그램 이름으로 인식되지 않습니다. 이름이 정확한지 확인하고 경로가 포함된 경우 경로가 올바른지 검증한 다음 다시 시도하십시오.
위치 줄:2 문자:44
+ Get-Content AGENTS.md; git status --short; rg --files -g '*page*' -g  ...
+                                            ~~
    + CategoryInfo          : ObjectNotFound: (rg:String) [], CommandNotFoundException
    + FullyQualifiedErrorId : CommandNotFoundException
 

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$OutputEncoding = [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new(); Get-Content -Encoding UTF8 AGENTS.md; Get-Content -Encoding UTF8 package.json; Get-ChildItem src -Recurse -File | Select-Object -ExpandProperty FullName; Get-ChildItem scripts/backup,supabase/migrations -Recurse -File | Select-Object -ExpandProperty FullName' in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
 succeeded in 358ms:
# 육아 일기 — Codex 작업 규칙

A couple (아빠/엄마) keeps a diary for their two kids: **one page per child per day per parent** (엄마의 페이지 and 아빠의 페이지 are separate), with a drawing/photo area on top and handwritten-style text below. Mobile-first web app (PWA build + claude.ai Artifact build; an app-store release via a native wrapper is planned, so keep everything web-standard and backend-agnostic), Korean UI only. The pages may become a printed book: drawings and exports must stay high-resolution.
Do only the phase you are asked to do. Keep changes minimal and focused; do not refactor other phases' code.

## Kids (seed data)
| id | name | nickname | birth_date | due_date | default page color |
|---|---|---|---|---|---|
| `kid1` | 조비안 | 조이 | null (set in 설정) | null | 벚꽃 `#F4B9B8` |
| `kid2` | 또이 | 또이 | null — **not born yet** | null (set in 설정) | 박하 `#CDEFE2` |

Age label (`lib/date.ts#ageLabel`, already implemented):
- birth_date set → `N개월` (<24 months), `N년 M개월` (≥24), `생후 N일` (<1 month).
- no birth_date, due_date set → `출산 예정 D-N` (or `D-day`, or `출산 예정일 지남`).
- neither → `출산 전` for kid2, nothing for kid1.

## Stack (do not add other runtime deps)
- Vite + React 18 + TypeScript (strict), `vite-plugin-pwa`, `date-fns` (ko locale), `@supabase/supabase-js`, `vitest`, plus `jspdf` and `jszip` for book export (lazy-loaded with dynamic import).
- **Plain CSS, no Tailwind, no CSS-in-JS.** Styles in `src/styles/`.
- No router library: view state in React state.

## Design specs (user approved)
1. **Home** = `docs/design/home-c1-moon.html` (night style 달) and `docs/design/home-c3-lantern.html` (night style 풍등); the user picks the night style on Home (default 달). Day (light theme): select 노을 언덕 (default, `docs/design/home-day-sunset.html`) or 민들레 (`docs/design/home-day-dandelion.html`) on Home. Sunset suns have 30 ridge wildflowers (bloom/bud), with periodic bird flocks; dandelion heads have 30 seeds (fluffy/faint), with drifting background seeds and soft meadow grass. Stems end above navigation. Night (dark theme): starfield with twinkle + shooting stars, faces as moons with a 30-star crown, or as sky-lanterns with 30 beads. The 30 marks = the last 30 days; a day counts as written if EITHER parent saved a page for that child. No names on the home; accessible labels carry name + summary. Long-press a face → "최근 30일 중 N일 기록". All four styles wander smoothly across the whole safe scene below the date and above navigation (12?20 px/s on mobile, faster on desktop), with gentle tilt/bob, soft face separation, and steering away from the scene switcher. One shared animation clock pauses when hidden. Dandelion stems stretch/bend from fixed ground roots; sunset suns float freely while their 30 flowers slide horizontally along the hill below. After long-press, moving over 6px picks up the face and its marks; release flings it within safe scene bounds above navigation, with friction and edge/circle bounces; wandering resumes where the fling settles without springing home. A fling never opens a page. Reduced motion is static and drag returns directly home. Lanterns must not overlap each other's bead strings. Scene selection lives in one artwork object placed naturally per scene, with face steering avoiding its own area: sunset has a small 30px orange-rose setting sun half-occluded by the actual far ridge toward the right (6s breathing halo, faint rim shimmer, 14s gentle sinking); dandelion keeps the ladybug on its drifting seed; moon has a quiet warm-white thin four-point glint only slightly larger than background stars (4.5s subtle twinkle, soft flare every 12s); lantern has a small dim distant lantern (8s rise/sway plus flicker). Object motion shares the paused-when-hidden scene clock; all objects are static with reduced motion. Each is an accessible button named 장면 바꾸기 with an invisible ≥44px hit area and keyboard-only focus ring, behind faces and never a collision body. First three device-local Home visits shimmer once after 1.5s (no reduced-motion animation). A frosted strip groups four SVG scene thumbnails under 낮/밤; choosing persists the corresponding HomePreferences style and explicit light/dark theme, crossfades for 400ms (instant with reduced motion), and closes. Outside tap, Esc and back also close it. 설정 › 화면 keeps only 시스템/라이트/다크 and the hint 홈의 작은 집·무당벌레·별·풍등을 누르면 장면을 바꿀 수 있어요.
2. **App shell** (archive list, calendar, settings, sheets): `docs/design/mockup-v3.html` — Pretendard, clean cards, dark filled pills/buttons, soft navy-violet dark mode. Intuitive = on every screen the thing to choose and the most important info are obvious at a glance.
3. **Diary page** (one child, one day, one parent): full-bleed page color, Gaegu handwriting, hand-drawn ink. NO visible borders/frames between the drawing and writing areas; the drawing area spans the full screen width edge to edge. ONLY: top bar (← back, date with ‹ ›, ONE badge icon), a small "엄마의 페이지 · 아빠의 페이지" switch (swipe or tap), drawing, writing, bottom (💬 comments, big oval 저장/수정).
- Flow: Home → tap a face → that child's page for today, opened on the current writer's own page → 저장 → back to Home with toast "저장했어요". Reaching Home's archive/calendar/settings: small, quiet icons at the bottom of Home (not competing with the faces).
- **Current writer**: use store.getCurrentMemberId() (first-visit full-screen picker / settings). No per-page writer choice. The current writer's paragraph is editable, with a small author initial beside each paragraph. Save requires text, drawing, or photo.
- Page palette: shared ColorPicker with 3 recommended colors (벚꽃 #F4B9B8, 박하 #CDEFE2, 귤 #F59157), up to 5 viewer-local recent colors, and a frozen 40-swatch pastel grid (10 rainbow hue families × 4 tones), including all 16 legacy named colors. Normalize old colors to the nearest grid color on load. Pen colors are separate: auto ink plus 8 deeper crayons, stored per Stroke.color; `ink` means auto ink. Display colors mix 90% page color + 10% #262638 in dark mode. Auto ink chooses #1E2326 or #F5F0E1 by highest WCAG contrast against the displayed color.
- Light + dark via `prefers-color-scheme`, overridable with `data-theme` on `<html>`. Touch ≥ 44px. Respect `prefers-reduced-motion`. Safe-area insets on fixed/sticky edges.
- Korean IME: never act on Enter while `isComposing`. Use `word-break: keep-all` for Korean labels (mockup bug to avoid: "기록 완료 · 아/빠" wrapping).

## Data model (`src/data/types.ts`)
```ts
Child    { id; name; nickname?; birthDate?; dueDate?; color: 'kid1'|'kid2'; pageColor: string; sortOrder;
           photo?: ProfilePhoto; photoHistory: ProfilePhoto[] }   // history kept until the user deletes an item
ProfilePhoto { id; src: string /* asset url */; createdAt }       // already cropped to a 1024px circle-ready square
Member   { id: 'dad'|'mom'; displayName; color: 'dad'|'mom'; fontAssetId?: string }   // own handwriting font later
Tag      { id; label; emoji; tone; sortOrder; preset; hidden? }                        // "배지" in the UI
Page     { id: `${date}__${childId}__${authorId}`; childId; date: 'YYYY-MM-DD'; authorId: 'dad'|'mom';
           color?: string /* only when the author picked one; otherwise the child's pageColor applies */;
           drawing: Stroke[]; photos: Photo[]; text: string; tagIds: string[]; createdAt; updatedAt }
Stroke   { color: string; width: 2|5|14 (eraser = 14 with color 'erase'); points: number[] /* x,y pairs normalized 0..1, 3 decimals */ }
Photo    { id; src: string /* asset url or data URL */; x; y; w; rotation }            // normalized 0..1 placement
Note     { id; authorId: 'dad'|'mom'; text; createdAt; updatedAt }                      // paragraphs, each with its author
Comment  { id; pageId; content; authorId; createdAt; updatedAt }
Reaction { pageId; memberId; emoji: '❤️' }
```
Page size budget: keep a page JSON under ~150 KB (simplify strokes; photos are stored outside the page as assets/URLs — never inline a full-size photo).
Dates are Asia/Seoul calendar dates; never use `toISOString()` for a date key.

## Data access
All UI talks to `DataStore` (`src/data/DataStore.ts`). Stores: `LocalStore` (no setup), `ArtifactStore` (claude.ai db), `SupabaseStore`. Writes are optimistic, but a failed write must NEVER silently switch the app to read-only: keep the edit, show a visible retry banner with the reason, and retry automatically. Only `revoked`/`not_granted` disable writing.
ArtifactStore layout: `meta/config` (children incl. profile photos, tags, members, memberByUser); `index/<YYYY-MM>` (small per-month summaries: pageId → {date, childId, authorId, color?, firstLine, tagIds, hasDrawing, photoCount, updatedAt, deletedAt?} + comments/reactions); `pages/<pageId>` (one full page per document, ≤ 200 KB enforced before writing — simplify strokes further or refuse with a clear message). Photos and profile photos go to the `assets` capability, never inline.

## Definition of done (every phase)
- `npx tsc -b` passes. In this sandbox `vite build`/`vitest` may fail with "Access is denied" (esbuild spawn) — expected; the reviewer runs them.
- Readable code: Prettier-style formatting, one statement per line, small components.
- No `console.log`, no unused files. Old v1 UI files that a phase replaces are deleted in that phase.
- End your reply with: files changed, anything not done, what the reviewer should check.
{
  "name": "yuga-record",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:backup": "node --test scripts/backup/backup.check.mjs",
    "backup": "node scripts/backup/backup.mjs",
    "build:artifact": "vite build --mode artifact"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.57.0",
    "date-fns": "^4.1.0",
    "jspdf": "^4.2.1",
    "jszip": "^3.10.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^22.20.5",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.4.1",
    "pretendard": "^1.3.9",
    "supabase": "^2.122.0",
    "typescript": "~5.7.2",
    "vite": "^6.1.0",
    "vite-plugin-pwa": "^0.21.1",
    "vite-plugin-singlefile": "^2.3.4",
    "vitest": "^3.0.5"
  }
}
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\App.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\main.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\normalApp.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\vite-env.d.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\components\BottomNav.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\components\ColorPicker.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\components\Icon.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\components\Sheet.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\components\StrokePreview.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\components\SyncBanner.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\components\Toast.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\artifactStore.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\artifactStore.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\DataStore.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\familyAccess.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\familyAccess.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\importPhotos.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\legacyAdapter.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\localStore.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\localStore.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\migrate.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\phase13.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\photoAssets.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\photoAssets.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\seed.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\supabaseStore.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\supabaseStore.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\testDb.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\types.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\archive\ArchiveListRow.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\archive\ArchiveScreen.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\archive\archiveView.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\archive\archiveView.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\archive\PageCard.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\archive\SearchPill.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\auth\MemberPicker.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\auth\SupabaseGate.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\calendar\calendar.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\calendar\calendar.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\calendar\CalendarScreen.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\calendar\dayFill.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\calendar\dayFill.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\calendar\DayPreview.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\calendar\MonthGrid.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\artwork.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\crop.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\crop.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\CropEditor.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\crossfadeScene.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\DayMarks.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\DayMarks.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\dayScene.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\faceMotion.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\fling.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\fling.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\history.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\history.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\HomeFace.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\HomeScreen.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\preferences.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\preferences.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\ProfilePhotoSheet.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\ProfilePortrait.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\SceneArtwork.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\sceneChoice.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\sceneChoice.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\SceneSwitcher.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\switcherPosition.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\switcherPosition.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\useFaceGesture.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\useScene.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\wander.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\wander.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\BadgeSheet.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\CommentsSheet.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\DiarySheet.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\DrawingArea.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\drawingView.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\drawingView.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\notes.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\notes.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\PageScreen.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\ParentFace.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\PhotoFrame.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\strokes.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\WritingArea.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\settings\BackupSection.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\settings\BadgeManager.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\settings\bookExport.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\settings\bookLayout.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\settings\bookLayout.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\settings\BookSection.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\settings\ChildEditSheet.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\settings\colorTarget.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\settings\colorTarget.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\settings\FamilySettings.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\settings\FontUpload.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\settings\PageColorSheet.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\settings\SettingsScreen.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\settings\useMemberFonts.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\date.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\date.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\datedArchive.d.mts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\datedArchive.mjs
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\download.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\exportFormat.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\exportFormat.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\image.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\image.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\josa.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\josa.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\loadExportLibs.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\pageColors.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\pageColors.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\pwaPaths.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\stroke.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\stroke.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\usePageColorStyle.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\styles\app.css
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\styles\book.css
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\styles\home.css
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\styles\page.css
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\styles\tokens.css
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\types\build.d.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\types\claude.d.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\scripts\backup\backup.check.mjs
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\scripts\backup\backup.mjs
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\scripts\backup\encrypt.mjs
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\scripts\backup\onedrive-backup.ps1
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\scripts\backup\register-task.ps1
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\scripts\backup\unregister-task.ps1
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\scripts\backup\fixtures\two-parents.json
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\supabase\migrations\20261027000000_family.sql

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Encoding UTF8 src/data/DataStore.ts,src/data/migrate.ts,src/data/legacyAdapter.ts,src/features/page/PageScreen.tsx,src/features/page/WritingArea.tsx,src/App.tsx' in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
 succeeded in 288ms:
import { useSyncExternalStore } from 'react';
import { projectEntries, type LegacyEntry } from './legacyAdapter';
import type {
  Child,
  Comment,
  Page,
  PageRange,
  Member,
  Reaction,
  StoreSnapshot,
  Tag,
} from './types';

export interface DataStore {
  readonly syncState: import('./types').SyncState;
  readonly canSwitchMember?: boolean;
  readonly viewerMapping?: boolean;
  readonly readOnly?: boolean;
  readonly needsMember?: boolean;
  readonly preparing?: boolean;
  readonly errorMessage?: string;
  retry?(): void;
  getSnapshot(): StoreSnapshot;
  subscribe(listener: () => void): () => void;
  listChildren(): Child[];
  listMembers(): Member[];
  listTags(): Tag[];
  listPages(range?: PageRange): Page[];
  getPage(
    date: string,
    childId: string,
    authorId?: 'dad' | 'mom',
  ): Page | undefined;
  loadPage(id: string): Promise<Page>;
  loadAllPages(): Promise<void>;
  savePage(page: Page): void;
  deletePage(id: string): void;
  setAllPageColors(color: string, childId?: string): void;
  uploadPhoto(blob: Blob): Promise<{ src: string }>;
  resolvePhotoSrc?(src: string): Promise<string>;
  listComments(pageId?: string): Comment[];
  createComment(comment: Comment): void;
  updateComment(comment: Comment): void;
  deleteComment(id: string): void;
  listReactions(pageId?: string): Reaction[];
  toggleReaction(pageId: string, memberId?: string): void;
  updateChild(child: Child): void;
  setChildPhoto(childId: string, blob: Blob): Promise<void>;
  useHistoryPhoto(childId: string, photoId: string): void;
  deleteHistoryPhoto(childId: string, photoId: string): Promise<void>;
  updateMember(member: Member): void;
  uploadFont(blob: Blob): Promise<{ src: string }>;
  createTag(tag: Tag): void;
  updateTag(tag: Tag): void;
  deleteTag(id: string): void;
  reorderTags(ids: string[]): void;
  getCurrentMemberId(): string;
  setCurrentMemberId(id: string): void;
  exportAll(): StoreSnapshot;
  importAll(data: StoreSnapshot): void | Promise<void>;
}

/** Existing screens consume this projection until phases 10–11. */
export function useStore(
  store: DataStore,
): StoreSnapshot & { entries: LegacyEntry[] } {
  const data = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  return { ...data, entries: projectEntries(data) };
}
import { normalizePageColor } from '../lib/pageColors';
import type { LegacyEntry } from './legacyAdapter';
import type {
  Child,
  Comment,
  Member,
  Note,
  Page,
  Reaction,
  StoreSnapshot,
} from './types';

export type OldPage = Omit<Page, 'authorId' | 'text'> & { notes: Note[] };
export type LegacySnapshot = Omit<
  StoreSnapshot,
  'pages' | 'comments' | 'reactions' | 'children'
> & {
  children: (Omit<Child, 'pageColor' | 'photoHistory'> & {
    pageColor?: string;
    photoHistory?: Child['photoHistory'];
  })[];
  entries: LegacyEntry[];
  comments: (Omit<Comment, 'pageId'> & { entryId: string })[];
  reactions: (Omit<Reaction, 'pageId'> & { entryId: string })[];
};
export type OldSnapshot = Omit<StoreSnapshot, 'pages' | 'children'> & {
  pages: (OldPage | Page)[];
  children: LegacySnapshot['children'];
};

/** Merge interrupted v1→v2 sources by note ID before splitting by author. */
export function migrateMonthSnapshot(
  metadata: Pick<StoreSnapshot, 'children' | 'members' | 'tags'>,
  doc: Record<string, unknown>,
): StoreSnapshot {
  const active = <T>(value: unknown): T[] =>
    Object.values(
      (value ?? {}) as Record<string, T & { deletedAt?: string }>,
    ).filter((item) => !item.deletedAt);
  const pages = structuredClone(active<OldPage | Page>(doc.pages));
  for (const entry of active<LegacyEntry>(doc.entries)) {
    let page = pages.find(
      (page) =>
        page.date === entry.date &&
        page.childId === entry.childId &&
        'notes' in page,
    ) as OldPage | undefined;
    if (!page) {
      page = {
        id: entry.date + '__' + entry.childId,
        date: entry.date,
        childId: entry.childId,
        notes: [],
        drawing: [],
        photos: [],
        tagIds: [],
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };
      pages.push(page);
    }
    if (!page.notes.some((note) => note.id === entry.id)) {
      page.notes.push({
        id: entry.id,
        authorId: noteAuthor(entry.authorId, metadata.members),
        text: entry.content,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
      page.tagIds = [...new Set([...page.tagIds, ...entry.tagIds])];
    }
  }
  const ids = new Map(
    pages.flatMap((page) =>
      'notes' in page
        ? page.notes.map((note) => [note.id, page.id] as const)
        : [],
    ),
  );
  const pageId = (item: { pageId?: string; entryId?: string }) =>
    item.pageId || ids.get(item.entryId ?? '') || '';
  const comments = active<Comment & { entryId?: string }>(doc.comments).map(
    (item) => ({ ...item, pageId: pageId(item) }),
  );
  const reactions = active<Reaction & { entryId?: string; on?: boolean }>(
    doc.reactions,
  )
    .filter((item) => item.on !== false)
    .map((item) => ({ ...item, pageId: pageId(item) }));
  return migrateSnapshot({ ...metadata, pages, comments, reactions });
}
export const defaultPageColor = (child: Pick<Child, 'color'>): string =>
  child.color === 'kid2' ? '#CDEFE2' : '#F4B9B8';

export const defaultChildStatus = (child: Pick<Child, 'id'>): 'born' | 'expecting' =>
  child.id === 'kid2' ? 'expecting' : 'born';

export function noteAuthor(id: string, members: Member[]): 'dad' | 'mom' {
  if (id === 'dad' || id === 'mom') return id;
  const member = members.find((item) => item.id === id);
  if (!member) throw new Error('기록의 작성자를 확인해 주세요.');
  return member.color;
}

/** Pure and deterministic. Sources remain untouched until the caller confirms persistence. */
export function migrateSnapshot(
  data: StoreSnapshot | OldSnapshot | LegacySnapshot,
): StoreSnapshot {
  const children = data.children.map((child) => ({
    ...child,
    status: child.status ?? defaultChildStatus(child),
    photoHistory: child.photoHistory ?? [],
    pageColor: normalizePageColor(child.pageColor ?? defaultPageColor(child)),
  }));
  const sources: (OldPage | Page)[] =
    'pages' in data ? structuredClone(data.pages) : [];
  const aliases = new Map<string, string>();
  if ('entries' in data) {
    const grouped = new Map<string, OldPage>();
    for (const entry of [...data.entries].sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    )) {
      const id = entry.date + '__' + entry.childId;
      const page = grouped.get(id) ?? {
        id,
        date: entry.date,
        childId: entry.childId,
        drawing: [],
        photos: [],
        notes: [],
        tagIds: [],
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };
      page.notes.push({
        id: entry.id,
        authorId: noteAuthor(entry.authorId, data.members),
        text: entry.content,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      });
      page.tagIds = [...new Set([...page.tagIds, ...entry.tagIds])];
      if (entry.updatedAt > page.updatedAt) page.updatedAt = entry.updatedAt;
      grouped.set(id, page);
      aliases.set(entry.id, id);
    }
    sources.push(...grouped.values());
  }
  const pages = new Map<string, Page>();
  const owners = new Map<string, string>();
  for (const source of sources) {
    if (!('notes' in source)) {
      const value = {
        ...source,
        color: source.color ? normalizePageColor(source.color) : undefined,
      };
      pages.set(value.id, value);
      owners.set(value.id, value.id);
      continue;
    }
    const notes = [...source.notes].sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    );
    const owner = notes[0]?.authorId ?? 'dad';
    owners.set(source.id, source.date + '__' + source.childId + '__' + owner);
    for (const authorId of [
      ...new Set([owner, ...notes.map((note) => note.authorId)]),
    ]) {
      const id = source.date + '__' + source.childId + '__' + authorId;
      const { notes: _, ...rest } = source;
      const value: Page = {
        ...rest,
        id,
        authorId,
        color: source.color ? normalizePageColor(source.color) : undefined,
        text: notes
          .filter((note) => note.authorId === authorId)
          .map((note) => note.text)
          .join('\n\n'),
        drawing: authorId === owner ? source.drawing : [],
        photos: authorId === owner ? source.photos : [],
        tagIds: authorId === owner ? source.tagIds : [],
      };
      if (!pages.has(id)) pages.set(id, value);
    }
  }
  const target = (item: { pageId: string } | { entryId: string }) => {
    const old = 'pageId' in item ? item.pageId : item.entryId;
    return owners.get(aliases.get(old) ?? old) ?? old;
  };
  const comments = (data.comments ?? []).map((item) => {
    const { ...rest } = item;
    return {
      id: rest.id,
      pageId: target(item),
      content: rest.content,
      authorId: rest.authorId,
      createdAt: rest.createdAt,
      updatedAt: rest.updatedAt,
    };
  });
  const reactions = new Map<string, Reaction>();
  for (const item of data.reactions ?? []) {
    const pageId = target(item);
    reactions.set(pageId + '__' + item.memberId, {
      pageId,
      memberId: item.memberId,
      emoji: item.emoji,
    });
  }
  return {
    children,
    members: data.members,
    tags: data.tags,
    pages: [...pages.values()],
    comments,
    reactions: [...reactions.values()],
  };
}
import type { DataStore } from './DataStore';
import type { Child, Page, StoreSnapshot } from './types';
import { noteAuthor } from './migrate';

export type LegacyEntry = {
  id: string;
  childId: string;
  date: string;
  content: string;
  tagIds: string[];
  authorId: string;
  createdAt: string;
  updatedAt: string;
};
export function projectEntries(data: StoreSnapshot): LegacyEntry[] {
  return data.pages.map((page) => ({
    id: page.id,
    childId: page.childId,
    date: page.date,
    content: page.text,
    authorId:
      data.members.find((member) => member.color === page.authorId)?.id ??
      page.authorId,
    tagIds: page.tagIds,
    createdAt: page.createdAt,
    updatedAt: page.updatedAt,
  }));
}
/** Small compatibility bridge until the UI phases are replaced. */
export abstract class LegacyAdapter {
  abstract getSnapshot(): StoreSnapshot;
  abstract savePage(page: Page): void;
  abstract deletePage(id: string): void;
  abstract updateChild(child: Child): void;
  abstract uploadPhoto(blob: Blob): Promise<{ src: string }>;
  protected async removePhotoAsset(_src: string): Promise<void> {}
  async loadPage(id: string): Promise<Page> {
    const page = this.getSnapshot().pages.find((item) => item.id === id);
    if (!page) throw new Error('페이지를 찾을 수 없어요.');
    return page;
  }
  async loadAllPages(): Promise<void> {}
  async setChildPhoto(childId: string, blob: Blob): Promise<void> {
    const uploaded = await this.uploadPhoto(blob);
    const child = this.getSnapshot().children.find(
      (item) => item.id === childId,
    );
    if (!child) throw new Error('아이를 찾을 수 없어요.');
    this.updateChild({
      ...child,
      photo: {
        id: crypto.randomUUID(),
        src: uploaded.src,
        createdAt: new Date().toISOString(),
      },
      photoHistory: [
        ...(child.photoHistory ?? []),
        ...(child.photo ? [child.photo] : []),
      ],
    });
  }
  useHistoryPhoto(childId: string, photoId: string): void {
    const child = this.getSnapshot().children.find(
      (item) => item.id === childId,
    );
    const photo = child?.photoHistory.find((item) => item.id === photoId);
    if (!child || !photo) return;
    this.updateChild({
      ...child,
      photo,
      photoHistory: [
        ...child.photoHistory.filter((item) => item.id !== photoId),
        ...(child.photo ? [child.photo] : []),
      ],
    });
  }
  async deleteHistoryPhoto(childId: string, photoId: string): Promise<void> {
    const child = this.getSnapshot().children.find(
      (item) => item.id === childId,
    );
    const photo = child?.photoHistory.find((item) => item.id === photoId);
    if (!child || !photo) return;
    this.updateChild({
      ...child,
      photoHistory: child.photoHistory.filter((item) => item.id !== photoId),
    });
    const referenced =
      this.getSnapshot().children.some(
        (item) =>
          item.photo?.src === photo.src ||
          item.photoHistory.some((p) => p.src === photo.src),
      ) ||
      this.getSnapshot().pages.some((page) =>
        page.photos.some((item) => item.src === photo.src),
      );
    if (!referenced) await this.removePhotoAsset(photo.src);
  }
  listEntries(startDate?: string, endDate?: string): LegacyEntry[] {
    return projectEntries(this.getSnapshot()).filter(
      (item) =>
        (!startDate || item.date >= startDate) &&
        (!endDate || item.date <= endDate),
    );
  }
  protected pageId(id: string): string {
    return id;
  }
  createEntry(entry: LegacyEntry): void {
    this.updateEntry(entry);
  }
  updateEntry(entry: LegacyEntry): void {
    const data = this.getSnapshot();
    const authorId = noteAuthor(entry.authorId, data.members);
    const id = entry.date + '__' + entry.childId + '__' + authorId;
    const page = data.pages.find((item) => item.id === id);
    this.savePage({
      ...page,
      id,
      date: entry.date,
      childId: entry.childId,
      authorId,
      text: entry.content,
      drawing: page?.drawing ?? [],
      photos: page?.photos ?? [],
      tagIds: entry.tagIds,
      createdAt: page?.createdAt ?? entry.createdAt,
      updatedAt: entry.updatedAt,
    });
  }
  deleteEntry(id: string): void {
    this.deletePage(id);
  }
}
export type LegacyStore = DataStore & LegacyAdapter;
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { DataStore } from '../../data/DataStore';
import type {
  Child,
  Comment,
  Page,
  Reaction,
  StoreSnapshot,
} from '../../data/types';
import { Icon } from '../../components/Icon';
import { ColorPicker } from '../../components/ColorPicker';
import { addDays, dayCounter, fromKey } from '../../lib/date';
import { usePageColorStyle } from '../../lib/usePageColorStyle';
import { noteAuthor } from '../../data/migrate';
import { preparePage } from '../../lib/stroke';
import { BadgeSheet } from './BadgeSheet';
import { CommentsSheet } from './CommentsSheet';
import { DiarySheet } from './DiarySheet';
import { ParentFace } from './ParentFace';
import { DrawingArea } from './DrawingArea';
import { writeNote } from './notes';
import { WritingArea } from './WritingArea';
import '../../styles/page.css';
export type PageOrigin = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export function PageScreen({
  store,
  snapshot,
  child,
  date,
  authorId,
  onAuthor,
  startEditing,
  origin,
  onBack,
  onDate,
  onSaved,
}: {
  store: DataStore;
  snapshot: StoreSnapshot;
  child: Child;
  date: string;
  authorId?: 'dad' | 'mom';
  onAuthor: (authorId: 'dad' | 'mom') => void;
  startEditing: boolean;
  origin?: PageOrigin;
  onBack: () => void;
  onDate: (date: string) => void;
  onSaved: (pageId: string) => void;
}) {
  const [initial] = useState(() => {
    const saved = store.getPage(date, child.id, authorId);
    const now = new Date().toISOString();
    const blank: Page = {
      id: `${date}__${child.id}__${authorId ?? noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members)}`,
      childId: child.id,
      date,
      authorId:
        authorId ??
        noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members),
      drawing: [],
      photos: [],
      text: '',
      tagIds: [],
      createdAt: now,
      updatedAt: now,
    };
    return {
      saved: !!saved || snapshot.pages.some((page) => page.id === blank.id),
      page: structuredClone(saved ?? blank),
    };
  });
  const [page, setPage] = useState(initial.page);
  const baseline = useRef(initial.page);
  const [loading, setLoading] = useState(
    !store.getPage(date, child.id, authorId) &&
      snapshot.pages.some((page) => page.id === initial.page.id),
  );
  useEffect(() => {
    if (!loading) return;
    let active = true;
    void store
      .loadPage(initial.page.id)
      .then((page) => {
        if (active) {
          baseline.current = page;
          setPage(page);
          setLoading(false);
        }
      })
      .catch((reason) => {
        if (active)
          setError(
            reason instanceof Error ? reason.message : '불러오지 못했어요.',
          );
      });
    return () => {
      active = false;
    };
  }, [store, initial.page.id, loading]);
  const [editing, setEditing] = useState(
    !store.readOnly && (startEditing || !initial.saved),
  );
  const writer = store.readOnly
    ? undefined
    : noteAuthor(store.getCurrentMemberId(), snapshot.members);
  const ownPage = page.authorId === writer;
  const [drawing, setDrawing] = useState(false);
  const [sheet, setSheet] = useState<'badges' | 'palette' | 'comments'>();
  const [pending, setPending] = useState<() => void>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [localReactions, setLocalReactions] = useState<Reaction[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number }>();
  const dirty =
    JSON.stringify(page) !== JSON.stringify(baseline.current) ||
    !!localComments.length ||
    !!localReactions.length;
  const comments = initial.saved
    ? snapshot.comments.filter((item) => item.pageId === page.id)
    : localComments;
  const reactions = initial.saved
    ? snapshot.reactions.filter((item) => item.pageId === page.id)
    : localReactions;
  const memberId = store.getCurrentMemberId();
  const hasContent =
    page.text.trim() ||
    page.drawing.some((stroke) => stroke.color !== 'erase') ||
    !!page.photos.length;
  const canSave = ownPage && hasContent && !busy && !leaving && !loading;
  const transform = origin
    ? `translate(${origin.x}px, ${origin.y}px) scale(${origin.width / window.innerWidth}, ${origin.height / window.innerHeight})`
    : 'translate(12vw, 20vh) scale(.76)';
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    ref.current?.animate(
      [
        { transform, borderRadius: '25px', opacity: 0.6 },
        { transform: 'none', borderRadius: '0', opacity: 1 },
      ],
      { duration: 340, easing: 'cubic-bezier(.2,.8,.2,1)' },
    );
  }, [transform]);
  useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, [dirty]);
  const exit = (action: () => void) => {
    if (leaving) return;
    setLeaving(true);
    if (
      matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !ref.current
    ) {
      action();
      return;
    }
    let ran = false;
    const run = () => {
      if (ran) return;
      ran = true;
      action();
    };
    const animation = ref.current.animate(
      [
        { transform: 'none', opacity: 1 },
        { transform, borderRadius: '25px', opacity: 0 },
      ],
      { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' },
    );
    void animation.finished.then(run, run);
    window.setTimeout(run, 400);
  };
  const navigate = (action: () => void) => {
    if (busy) {
      setError('사진을 붙이고 있어요. 잠시 기다려 주세요.');
      return;
    }
    if (dirty) setPending(() => action);
    else action();
  };
  const save = () => {
    if (!canSave) return;
    try {
      const saved = preparePage({
        ...page,
        updatedAt: new Date().toISOString(),
      });
      store.savePage(saved);
      localComments.forEach((comment) => store.createComment(comment));
      localReactions.forEach((reaction) =>
        store.toggleReaction(saved.id, reaction.memberId),
      );
      exit(() => onSaved(saved.id));
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : '저장하지 못했어요. 다시 시도해 주세요.',
      );
    }
  };
  const weekday = '일월화수목금토'[fromKey(date).getDay()];
  return (
    <div
      ref={ref}
      className={`diary page-color${drawing ? ' is-drawing' : ''}`}
      style={usePageColorStyle(page.color ?? child.pageColor)}
    >
      <div
        className="diary-content"
        aria-busy={busy}
        onTouchStart={(event) => {
          if (
            drawing ||
            (event.target as HTMLElement).closest(
              'textarea, button, input, .polaroid',
            )
          )
            return;
          const touch = event.touches[0];
          swipe.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(event) => {
          const start = swipe.current;
          swipe.current = undefined;
          if (!start || drawing) return;
          const touch = event.changedTouches[0];
          const dx = touch.clientX - start.x;
          if (
            Math.abs(dx) < 70 ||
            Math.abs(dx) < Math.abs(touch.clientY - start.y) * 1.5
          )
            return;
          const author = dx < 0 ? 'dad' : 'mom';
          if (author !== page.authorId) navigate(() => onAuthor(author));
        }}
      >
        <header className="diary-head">
          <button
            aria-label="홈으로 돌아가기"
            onClick={() => navigate(() => exit(onBack))}
          >
            ←
          </button>
          <div className="diary-date">
            <button
              aria-label="이전 날"
              onClick={() => navigate(() => onDate(addDays(date, -1)))}
            >
              ‹
            </button>
            <span>
              {Number(date.slice(5, 7))}.{Number(date.slice(8))} {weekday} · {dayCounter(child, date)}
            </span>
            <button
              aria-label="다음 날"
              onClick={() => navigate(() => onDate(addDays(date, 1)))}
            >
              ›
            </button>
          </div>
          <button
            className={`badge-button${page.tagIds.length ? ' chosen' : ''}`}
            aria-label={`배지 ${page.tagIds.length}개, 배지 고르기`}
            onClick={() => setSheet('badges')}
          >
            <Icon name="star" />
            {!!page.tagIds.length && (
              <span className="badge-count">{page.tagIds.length}</span>
            )}
          </button>
        </header>
        <div className="parent-pages" role="group" aria-label="부모별 페이지">
          {(['mom', 'dad'] as const).map((author) => (
            <button
              key={author}
              aria-label={author === 'mom' ? '엄마 페이지' : '아빠 페이지'}
              aria-pressed={page.authorId === author}
              onClick={() => navigate(() => onAuthor(author))}
            >
              <ParentFace author={author} />
            </button>
          ))}
        </div>
        <DrawingArea
          page={{ ...page, color: page.color ?? child.pageColor }}
          store={store}
          editing={editing && ownPage && !busy && !leaving && !loading}
          onChange={(next) => setPage({ ...next, color: page.color })}
          onError={setError}
          onBusy={setBusy}
          onDrawing={setDrawing}
        />
        {!ownPage && !hasContent && !loading && (
          <p className="diary-hint">
            {page.authorId === 'mom' ? '엄마' : '아빠'}가 아직 안 썼어요
          </p>
        )}
        <WritingArea
          name={child.name}
          notes={[
            {
              id: page.id,
              authorId: page.authorId,
              text: page.text,
              createdAt: page.createdAt,
              updatedAt: page.updatedAt,
            },
          ]}
          editing={editing && ownPage && !leaving && !loading}
          writer={writer}
          onText={(text) => {
            if (writer)
              setPage(writeNote(page, writer, text, new Date().toISOString()));
          }}
        />
        {editing && ownPage && (
          <p className="diary-hint" aria-live="polite">
            {!hasContent
              ? '글이나 그림, 사진을 남겨 주세요'
              : busy
                ? '사진을 붙이고 있어요…'
                : '\u00a0'}
          </p>
        )}
        {error && (
          <p className="diary-error" role="alert">
            {error}
            <button aria-label="안내 닫기" onClick={() => setError('')}>
              ×
            </button>
          </p>
        )}
        <footer className="diary-bottom">
          <button
            className="comment-button"
            aria-label={`댓글 ${comments.length}개`}
            onClick={() => setSheet('comments')}
          >
            <Icon name="speech" /> {comments.length}
          </button>
          <button
            className="oval"
            disabled={store.readOnly || !ownPage || (editing && !canSave)}
            onClick={editing ? save : () => setEditing(true)}
          >
            <span>{editing ? '저장' : '수정'}</span>
          </button>
          {editing && ownPage ? (
            <button className="page-palette" aria-label="페이지 색 고르기" onClick={() => setSheet('palette')}>
              <Icon name="palette" />
            </button>
          ) : <span className="page-palette" aria-hidden="true" />}
        </footer>
      </div>
      {sheet === 'badges' && (
        <BadgeSheet
          tags={snapshot.tags}
          selected={page.tagIds}
          readOnly={!editing || !ownPage || loading}
          onChange={(tagIds) => setPage({ ...page, tagIds })}
          onClose={() => setSheet(undefined)}
        />
      )}
      {sheet === 'palette' && (
        <DiarySheet title="페이지 색" onClose={() => setSheet(undefined)}>
          <ColorPicker
            viewerId={memberId}
            value={page.color ?? child.pageColor}
            onChange={(color) => setPage({ ...page, color })}
          />
        </DiarySheet>
      )}
      {sheet === 'comments' && (
        <CommentsSheet
          comments={comments}
          reactions={reactions}
          members={snapshot.members}
          memberId={memberId}
          pageId={page.id}
          readOnly={!!store.readOnly || (!initial.saved && !ownPage)}
          onClose={() => setSheet(undefined)}
          onComment={(comment, existing) => {
            if (initial.saved) {
              if (existing) store.updateComment(comment);
              else store.createComment(comment);
            } else
              setLocalComments((items) => [
                ...items.filter((item) => item.id !== comment.id),
                comment,
              ]);
          }}
          onDelete={(id) => {
            if (initial.saved) store.deleteComment(id);
            else
              setLocalComments((items) =>
                items.filter((item) => item.id !== id),
              );
          }}
          onReact={() => {
            if (initial.saved) store.toggleReaction(page.id, memberId);
            else
              setLocalReactions((items) =>
                items.length
                  ? []
                  : [{ pageId: page.id, memberId, emoji: '❤️' }],
              );
          }}
        />
      )}
      {pending && (
        <DiarySheet
          title="저장하지 않고 나갈까요?"
          onClose={() => setPending(undefined)}
        >
          <div className="leave-actions">
            <button
              onClick={() => {
                setPending(undefined);
                pending();
              }}
            >
              나가기
            </button>
            <button onClick={() => setPending(undefined)}>계속 쓰기</button>
          </div>
        </DiarySheet>
      )}
    </div>
  );
}
import type { Note } from '../../data/types';
import { callName, topic } from '../../lib/josa';

type Props = {
  name: string;
  notes: Note[];
  editing: boolean;
  writer?: Note['authorId'];
  onText: (text: string) => void;
};

export function WritingArea({ name, notes, editing, writer, onText }: Props) {
  const current = notes.find((note) => note.authorId === writer);

  return (
    <section className="writing" aria-label={`${name}의 일기`}>
      <div className="notes">
        {notes.filter((note) => !editing || note.id !== current?.id).map((note) => (
          <p key={note.id} className={`note ${note.authorId}-writing`}>
            {note.text}
            <span className="initial">{note.authorId === 'dad' ? '아' : '엄'}</span>
          </p>
        ))}
        {editing && writer && (
          <div className="editable-note">
            <span className="initial">{writer === 'dad' ? '아' : '엄'}</span>
            <textarea
              key={writer}
              className={`note-editor ${writer}-writing`}
              aria-label={`${writer === 'dad' ? '아빠' : '엄마'}의 일기`}
              placeholder={`오늘 ${topic(callName(name))}…`}
              value={current?.text ?? ''}
              onChange={(event) => onText(event.target.value)}
            />
          </div>
        )}
      </div>
    </section>
  );
}
import { useEffect, useRef, useState } from 'react';
import type { DataStore } from './data/DataStore';
import { useStore } from './data/DataStore';
import { todayKey } from './lib/date';
import { BottomNav, type Tab } from './components/BottomNav';
import { HomeScreen } from './features/home/HomeScreen';
import { PageScreen, type PageOrigin } from './features/page/PageScreen';
import { Toast } from './components/Toast';
import { ArchiveScreen } from './features/archive/ArchiveScreen';
import { CalendarScreen } from './features/calendar/CalendarScreen';
import { SettingsScreen } from './features/settings/SettingsScreen';
import { useMemberFonts } from './features/settings/useMemberFonts';
import { MemberPicker } from './features/auth/MemberPicker';
import { SyncBanner } from './components/SyncBanner';

type Screen =
  | { kind: 'shell'; tab: Tab }
  | { kind: 'archive' }
  | {
      kind: 'page';
      date: string;
      childId: string;
      authorId?: 'dad' | 'mom';
      editing: boolean;
      origin?: PageOrigin;
    };

export default function App({ store }: { store: DataStore }) {
  const snapshot = useStore(store);
  const [date, setDate] = useState(todayKey);
  const [screen, setScreen] = useState<Screen>({ kind: 'shell', tab: '홈' });
  const [savedToast, setSavedToast] = useState(false);
  const source = useRef<{ origin?: PageOrigin; editing: boolean }>({
    editing: false,
  });
  useMemberFonts(snapshot.members, store);
  useEffect(() => {
    if (!savedToast) return;
    const timer = window.setTimeout(() => setSavedToast(false), 2500);
    return () => window.clearTimeout(timer);
  }, [savedToast]);

  if (store.preparing)
    return (
      <>
        <SyncBanner store={store} />
        <div className="artifact-welcome">기록장을 준비하고 있어요…</div>
      </>
    );
  if (store.needsMember)
    return <MemberPicker store={store} members={snapshot.members} />;

  const openPage = (
    nextDate: string,
    childId: string,
    authorId?: 'dad' | 'mom',
  ) =>
    setScreen({
      kind: 'page',
      date: nextDate,
      childId,
      authorId,
      ...source.current,
    });
  const goHome = () => setScreen({ kind: 'shell', tab: '홈' });

  if (screen.kind === 'page') {
    const child = snapshot.children.find((item) => item.id === screen.childId);
    if (!child) return <button onClick={goHome}>홈으로 돌아가기</button>;
    return (
      <>
        <SyncBanner store={store} />
        <PageScreen
          key={`${screen.date}__${screen.childId}__${screen.authorId ?? store.getCurrentMemberId()}`}
          store={store}
          snapshot={snapshot}
          child={child}
          date={screen.date}
          authorId={screen.authorId}
          onAuthor={(authorId) => setScreen({ ...screen, authorId })}
          startEditing={screen.editing}
          origin={screen.origin}
          onBack={goHome}
          onDate={(nextDate) => setScreen({ ...screen, date: nextDate })}
          onSaved={() => {
            setDate(screen.date);
            setSavedToast(true);
            goHome();
          }}
        />
      </>
    );
  }

  const tab = screen.kind === 'archive' ? '홈' : screen.tab;
  return (
    <div
      className={`app-shell${screen.kind === 'shell' && screen.tab === '홈' ? ' home-shell' : ''}`}
      onClickCapture={(event) => {
        const card = (event.target as HTMLElement).closest(
          '.kid-card, .page-card, .home-face',
        );
        if (!card) return;
        const rect = card.getBoundingClientRect();
        source.current = {
          editing:
            card.classList.contains('kid-card') ||
            card.classList.contains('home-face'),
          origin: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          },
        };
      }}
    >
      <SyncBanner store={store} />
      {screen.kind === 'archive' ? (
        <ArchiveScreen
          store={store}
          snapshot={snapshot}
          openPage={openPage}
          onBack={goHome}
        />
      ) : (
        <>
          {tab === '홈' && (
            <HomeScreen
              store={store}
              snapshot={snapshot}
              openPage={openPage}
              onCalendar={() => setScreen({ kind: 'shell', tab: '달력' })}
              onSettings={() => setScreen({ kind: 'shell', tab: '설정' })}
              onAll={() => setScreen({ kind: 'archive' })}
            />
          )}
          {tab === '달력' && (
            <CalendarScreen
              store={store}
              snapshot={snapshot}
              openPage={openPage}
              date={date}
              setDate={setDate}
            />
          )}
          {tab === '설정' && (
            <SettingsScreen store={store} snapshot={snapshot} />
          )}
        </>
      )}
      {!(screen.kind === 'shell' && tab === '홈') && (
        <BottomNav
          tab={tab}
          onChange={(nextTab) => setScreen({ kind: 'shell', tab: nextTab })}
        />
      )}
      <Toast message="저장했어요" visible={savedToast} />
    </div>
  );
}

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Encoding UTF8 src/lib/exportFormat.ts,src/lib/datedArchive.mjs,src/features/settings/bookLayout.ts,src/features/settings/bookExport.ts,src/data/importPhotos.ts; Get-ChildItem src,scripts/backup -Recurse -File | Select-String -Pattern 'getPage\\(|__.*author|author.*__|openPage|\\.notes\\b|\\.note\\b|className=\"notes\"|className=.*note ' | Select-Object Path,LineNumber,Line" in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
 succeeded in 415ms:
import { migrateSnapshot, type LegacySnapshot } from '../data/migrate';
import type { StoreSnapshot } from '../data/types';

export type BackupJson = StoreSnapshot & { version: 3; exportedAt: string };

export function toBackupJson(all: StoreSnapshot): BackupJson {
  return {
    ...structuredClone(all),
    version: 3,
    exportedAt: new Date().toISOString(),
  };
}

export function fromBackupJson(value: unknown): StoreSnapshot {
  const invalid = () => new Error('백업 형식이 올바르지 않습니다.');
  if (!value || typeof value !== 'object') throw invalid();
  const data = value as Record<string, unknown>;
  if (![1, 2, 3].includes(Number(data.version))) throw invalid();
  const collection = data.version === 1 ? 'entries' : 'pages';
  for (const key of ['children', 'members', 'tags', collection]) {
    if (
      !Array.isArray(data[key]) ||
      data[key].some(
        (item: unknown) =>
          !item ||
          typeof item !== 'object' ||
          typeof (item as { id?: unknown }).id !== 'string',
      )
    )
      throw invalid();
  }
  const normalized = {
    ...data,
    comments: data.comments ?? [],
    reactions: data.reactions ?? [],
  };
  if (
    !Array.isArray(normalized.comments) ||
    !Array.isArray(normalized.reactions)
  )
    throw invalid();
  if (data.version === 1) {
    const legacy = normalized as unknown as LegacySnapshot;
    if (
      legacy.entries.some(
        (entry) =>
          typeof entry.date !== 'string' ||
          typeof entry.childId !== 'string' ||
          typeof entry.authorId !== 'string' ||
          typeof entry.content !== 'string' ||
          !Array.isArray(entry.tagIds) ||
          typeof entry.createdAt !== 'string' ||
          typeof entry.updatedAt !== 'string',
      )
    )
      throw invalid();
    return migrateSnapshot(legacy);
  }
  const snapshot = normalized as unknown as StoreSnapshot;
  if (
    snapshot.pages.some(
      (page) =>
        !/^\d{4}-\d{2}-\d{2}$/.test(page.date) ||
        !Array.isArray(page.drawing) ||
        !Array.isArray(page.photos) ||
        !Array.isArray(page.tagIds),
    )
  )
    throw invalid();
  if (
    data.version === 3 &&
    snapshot.pages.some(
      (page) =>
        !['dad', 'mom'].includes(page.authorId) ||
        page.id !== page.date + '__' + page.childId + '__' + page.authorId ||
        typeof page.text !== 'string',
    )
  )
    throw invalid();
  if (data.version === 2) {
    const old =
      snapshot.pages as unknown as import('../data/migrate').OldPage[];
    if (
      old.some(
        (page) =>
          page.id !== page.date + '__' + page.childId ||
          !Array.isArray(page.notes) ||
          page.notes.some(
            (note) =>
              !['dad', 'mom'].includes(note.authorId) ||
              typeof note.text !== 'string',
          ),
      )
    )
      throw invalid();
  }
  return migrateSnapshot(snapshot);
}

export { toMarkdown, toDatedArchive } from './datedArchive.mjs';
export type { ArchiveFile } from './datedArchive.mjs';
export function toMarkdown(all, month) {
  const pages = all.pages
    .filter((page) => !month || page.date.startsWith(month))
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.childId.localeCompare(b.childId),
    );
  const children = new Map(all.children.map((child) => [child.id, child.name]));
  const members = new Map(
    all.members.map((member) => [member.id, member.displayName]),
  );
  all.members.forEach((member) =>
    members.set(member.color, member.displayName),
  );
  const tags = new Map(
    all.tags.map((tag) => [tag.id, `${tag.emoji}${tag.label}`]),
  );
  const lines = [];
  let currentMonth = '';
  for (const page of pages) {
    const pageMonth = page.date.slice(0, 7);
    if (currentMonth !== pageMonth) {
      lines.push(
        `# ${pageMonth.slice(0, 4)}년 ${Number(pageMonth.slice(5))}월`,
        '',
      );
      currentMonth = pageMonth;
    }
    const [, m, d] = page.date.split('-');
    const weekday = new Intl.DateTimeFormat('ko-KR', {
      weekday: 'short',
      timeZone: 'Asia/Seoul',
    }).format(new Date(`${page.date}T00:00:00+09:00`));
    lines.push(
      `## ${Number(m)}월 ${Number(d)}일 (${weekday}) · ${children.get(page.childId) ?? page.childId}`,
      '',
    );
    lines.push(
      `- ${page.text.replace(/\n/g, '\n  ')} — ${members.get(page.authorId) ?? page.authorId}`,
    );
    const badges = page.tagIds
      .map((id) => tags.get(id))
      .filter(Boolean)
      .join(' · ');
    if (badges) lines.push(`배지: ${badges}`);
    if (page.drawing.length || page.photos.length)
      lines.push(
        `(${[page.drawing.length ? '그림 있음' : '', page.photos.length ? `사진 ${page.photos.length}장` : ''].filter(Boolean).join(', ')})`,
      );
    for (const comment of all.comments.filter(
      (item) => item.pageId === page.id,
    ))
      lines.push(
        `  - 💬 ${comment.content} — ${members.get(comment.authorId) ?? comment.authorId}`,
      );
    for (const reaction of all.reactions.filter(
      (item) => item.pageId === page.id,
    ))
      lines.push(
        `  - ${reaction.emoji} ${members.get(reaction.memberId) ?? reaction.memberId}`,
      );
    lines.push('');
  }
  return lines.join('\n').trimEnd() + (lines.length ? '\n' : '');
}

export function toDatedArchive(snapshot) {
  const files = [];
  const dates = [...new Set(snapshot.pages.map((page) => page.date))].sort();
  for (const date of dates) {
    const directory = 'diary/' + date.split('-').join('/');
    const pages = snapshot.pages
      .filter((page) => page.date === date)
      .sort((a, b) => a.id.localeCompare(b.id));
    for (const page of pages)
      files.push({
        path:
          directory +
          '/' +
          encodeURIComponent(page.childId) +
          '-' +
          page.authorId +
          '.json',
        content: JSON.stringify(page, null, 2),
      });
    files.push({
      path: directory + '.md',
      content: toMarkdown({ ...snapshot, pages }),
    });
  }
  return files;
}
export const mmToPx = (mm: number, dpi = 300) => Math.round((mm / 25.4) * dpi);
export const BOOK = { width: mmToPx(148), height: mmToPx(210) };

export function bookFilename(
  date: string,
  child: string,
  author: string,
): string {
  const safe = (value: string) =>
    value.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '') ||
    '이름없음';
  return `${date}_${safe(child)}_${safe(author)}.png`;
}

export function wrapText(
  context: Pick<CanvasRenderingContext2D, 'measureText'>,
  text: string,
  width: number,
): string[] {
  return text.split('\n').flatMap((paragraph) => {
    const lines: string[] = [];
    let line = '';
    for (const char of paragraph) {
      if (line && context.measureText(line + char).width > width) {
        lines.push(line);
        line = '';
      }
      line += char;
    }
    lines.push(line);
    return lines;
  });
}

export function fitTextPages(
  lines: string[],
  baseSize: number,
  maxHeight: number,
): { size: number; pages: string[][] } {
  let size = baseSize;
  while (size > baseSize * 0.8 && lines.length * size * 1.35 > maxHeight) {
    size -= 1;
  }
  const linesPerPage = Math.max(1, Math.floor(maxHeight / (size * 1.35)));
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }
  return { size, pages: pages.length ? pages : [[]] };
}
import type { DataStore } from '../../data/DataStore';
import type { Page, StoreSnapshot } from '../../data/types';
import { inkFor } from '../../lib/pageColors';
import { downloadFile } from '../../lib/download';
import { paintStroke } from '../page/strokes';
import { BOOK, bookFilename, fitTextPages, wrapText } from './bookLayout';
import { loadPdf, loadZip } from '../../lib/loadExportLibs';

export type BookOptions = {
  start: string;
  end: string;
  childId: string;
  authorId: string;
  format: 'pdf' | 'zip';
};

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason);
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort();
    promise.then(
      (value) => {
        signal.removeEventListener('abort', abort);
        resolve(value);
      },
      (reason) => {
        signal.removeEventListener('abort', abort);
        reject(reason);
      },
    );
  });
}

function canvasPage(color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = BOOK.width;
  canvas.height = BOOK.height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('책 페이지를 만들지 못했어요.');
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = inkFor(color);
  return { canvas, context };
}

async function renderPage(
  page: Page,
  all: StoreSnapshot,
  store: DataStore,
  signal: AbortSignal,
) {
  const child = all.children.find((item) => item.id === page.childId);
  const member = all.members.find(
    (item) => item.id === page.authorId || item.color === page.authorId,
  );
  const color = page.color ?? child?.pageColor ?? '#F4EBDD';
  const { canvas, context } = canvasPage(color);
  const artHeight = (BOOK.width * 4) / 5;
  // Draw on a transparent layer so erasing never cuts through the page background.
  const layer = document.createElement('canvas');
  layer.width = BOOK.width;
  layer.height = Math.round(artHeight);
  const drawing = layer.getContext('2d')!;
  page.drawing.forEach((stroke) =>
    paintStroke(
      drawing,
      stroke,
      BOOK.width,
      artHeight,
      inkFor(color),
      BOOK.width / 300,
    ),
  );
  context.drawImage(layer, 0, 0);
  layer.width = layer.height = 0;
  for (const photo of page.photos) {
    signal.throwIfAborted();
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = await abortable(
      store.resolvePhotoSrc?.(photo.src) ?? Promise.resolve(photo.src),
      signal,
    );
    try {
      await abortable(image.decode(), signal);
    } catch {
      signal.throwIfAborted();
      throw new Error(
        `${page.date}의 사진을 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.`,
      );
    }
    signal.throwIfAborted();
    const width = photo.w * BOOK.width;
    const height = (width * image.naturalHeight) / image.naturalWidth;
    context.save();
    context.beginPath();
    context.rect(0, 0, BOOK.width, artHeight);
    context.clip();
    context.translate(
      photo.x * BOOK.width + width / 2,
      photo.y * artHeight + height / 2,
    );
    context.rotate((photo.rotation * Math.PI) / 180);
    context.drawImage(image, -width / 2, -height / 2, width, height);
    context.restore();
  }
  const margin = 110;
  const badges = page.tagIds
    .map((id) => all.tags.find((tag) => tag.id === id))
    .filter(Boolean)
    .map((tag) => `${tag!.emoji} ${tag!.label}`)
    .join(' · ');
  const family = member?.fontAssetId ? `${member.id}Book` : 'Gaegu';
  const textWidth = BOOK.width - margin * 2;
  context.font = '32px Gaegu';
  const badgeLines = badges ? wrapText(context, badges, textWidth) : [];
  const badgeTop = BOOK.height - 95 - badgeLines.length * 40;
  const textTop = artHeight + 35;
  const textHeight = badgeTop - textTop - 25;
  context.font = `68px "${family}"`;
  const layout = fitTextPages(wrapText(context, page.text, textWidth), 68, textHeight);
  const size = layout.size;
  const lines = layout.pages[0];
  context.textBaseline = 'top';
  lines.forEach((line, index) =>
    context.fillText(line, margin, textTop + index * size * 1.35),
  );
  context.font = '32px Gaegu';
  badgeLines.forEach((line, index) =>
    context.fillText(line, margin, badgeTop + index * 40),
  );
  context.fillText(
    `${page.date} · ${child?.name ?? page.childId} · ${page.authorId === 'mom' ? '엄마' : '아빠'}`,
    margin,
    BOOK.height - 55,
  );
  const canvases = [canvas];
  for (const continuation of layout.pages.slice(1)) {
    const extra = canvasPage(color);
    extra.context.font = `${size}px "${family}"`;
    extra.context.textBaseline = 'top';
    extra.context.fillText('(이어서)', margin, artHeight + 35);
    continuation.forEach((line, index) =>
      extra.context.fillText(line, margin, artHeight + 90 + index * size * 1.35),
    );
    canvases.push(extra.canvas);
  }
  return canvases;
}

export async function exportBook(
  store: DataStore,
  options: BookOptions,
  signal: AbortSignal,
  progress: (done: number, total: number) => void,
  toolLoading: () => void = () => undefined,
) {
  await abortable(store.loadAllPages(), signal);
  signal.throwIfAborted();
  const all = store.exportAll();
  const pages = all.pages
    .filter(
      (page) =>
        page.date >= options.start &&
        page.date <= options.end &&
        (!options.childId || page.childId === options.childId) &&
        (!options.authorId || page.authorId === options.authorId),
    )
    .sort((a, b) => a.id.localeCompare(b.id));
  if (!pages.length) throw new Error('선택한 기간에 기록이 없어요.');
  progress(0, pages.length);
  const fonts: FontFace[] = [];
  try {
    for (const member of all.members) {
      if (
        !member.fontAssetId ||
        !pages.some((page) => page.authorId === member.color)
      )
        continue;
      const font = new FontFace(
        `${member.id}Book`,
        `url(${JSON.stringify(await (store.resolvePhotoSrc?.(member.fontAssetId) ?? Promise.resolve(member.fontAssetId)))})`,
      );
      await abortable(font.load(), signal);
      document.fonts.add(font);
      fonts.push(font);
    }
    const gaegu = await abortable(
      document.fonts.load('68px Gaegu', '우리 아이의 일기'),
      signal,
    );
    await abortable(document.fonts.ready, signal);
    if (!gaegu.length)
      throw new Error(
        '글씨체를 불러오지 못했어요. 연결을 확인하고 다시 시도해 주세요.',
      );
    signal.throwIfAborted();
    const pdf =
      options.format === 'pdf'
        ? new (await loadPdf(toolLoading))({
            unit: 'mm',
            format: [148, 210],
            compress: true,
          })
        : undefined;
    const zip =
      options.format === 'zip'
        ? new (await loadZip(toolLoading))()
        : undefined;
    if (pdf) {
      const { canvas, context } = canvasPage('#F4EBDD');
      context.textAlign = 'center';
      context.font = '90px Gaegu';
      const names = all.children
        .filter((child) => !options.childId || child.id === options.childId)
        .map((child) => child.name)
        .join(' · ');
      wrapText(context, `${names}의 일기`, BOOK.width - 200).forEach(
        (line, i) => context.fillText(line, BOOK.width / 2, 1050 + i * 110),
      );
      context.font = '60px Gaegu';
      context.fillText(
        `${options.start.slice(0, 7).replace('-', '.')} – ${options.end.slice(0, 7).replace('-', '.')}`,
        BOOK.width / 2,
        1450,
      );
      pdf.addImage(canvas, 'PNG', 0, 0, 148, 210);
      canvas.width = canvas.height = 0;
    }
    for (const [index, page] of pages.entries()) {
      signal.throwIfAborted();
      const canvases = await renderPage(page, all, store, signal);
      if (pdf) {
        for (const [pageIndex, rendered] of canvases.entries()) {
          if (index > 0 || pageIndex > 0) pdf.addPage([148, 210]);
          pdf.addImage(rendered, 'PNG', 0, 0, 148, 210);
        }
      }
      if (zip) {
        for (const [pageIndex, rendered] of canvases.entries()) {
          const blob = await new Promise<Blob>((resolve, reject) =>
            rendered.toBlob(
              (value) =>
                value
                  ? resolve(value)
                  : reject(new Error('이미지를 만들지 못했어요.')),
              'image/png',
            ),
          );
          const name = bookFilename(
            page.date,
            all.children.find((child) => child.id === page.childId)?.name ??
              page.childId,
            page.authorId === 'mom' ? '엄마' : '아빠',
          );
          zip.file(
            pageIndex ? name.replace(/\.png$/, `_${pageIndex + 1}.png`) : name,
            await blob.arrayBuffer(),
          );
        }
      }
      canvases.forEach((rendered) => {
        rendered.width = rendered.height = 0;
      });
      progress(index + 1, pages.length);
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    }
    signal.throwIfAborted();
    const blob = pdf
      ? pdf.output('blob')
      : await zip!.generateAsync({ type: 'blob' }, () =>
          signal.throwIfAborted(),
        );
    signal.throwIfAborted();
    await downloadFile(
      `육아일기-${options.start}-${options.end}.${options.format}`,
      blob,
      options.format === 'pdf' ? 'application/pdf' : 'application/zip',
    );
  } finally {
    fonts.forEach((font) => document.fonts.delete(font));
  }
}
import type { StoreSnapshot } from './types';

export function hasInlinePhotos(data: StoreSnapshot): boolean {
  return (
    data.pages.some((page) =>
      page.photos.some((photo) => photo.src.startsWith('data:')),
    ) ||
    data.children.some(
      (child) =>
        child.photo?.src.startsWith('data:') ||
        child.photoHistory?.some((photo) => photo.src.startsWith('data:')),
    )
  );
}

/** Finish asset writes before persisting any page/config pointers. Source is untouched. */
export async function externalizeSnapshot(
  data: StoreSnapshot,
  upload: (blob: Blob) => Promise<{ src: string }>,
): Promise<StoreSnapshot> {
  const result = structuredClone(data);
  const converted = new Map<string, string>();
  const convert = async (src: string) => {
    if (!src.startsWith('data:')) return src;
    const cached = converted.get(src);
    if (cached) return cached;
    const value = (await upload(await (await fetch(src)).blob())).src;
    converted.set(src, value);
    return value;
  };
  for (const page of result.pages) {
    for (const photo of page.photos) photo.src = await convert(photo.src);
  }
  for (const child of result.children) {
    if (child.photo) child.photo.src = await convert(child.photo.src);
    for (const photo of child.photoHistory ?? [])
      photo.src = await convert(photo.src);
  }
  return result;
}

Path                                                                                   LineNumber Line                 
----                                                                                   ---------- ----                 
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\App.tsx                                      53   const openPage = ( 
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\App.tsx                                      74           key={`${...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\App.tsx                                     123           openPage...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\App.tsx                                     132               open...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\App.tsx                                     142               open...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\artifactStore.test.ts                   51   expect(store.get...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\artifactStore.ts                       534   getPage(           
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\artifactStore.ts                       539     const id = dat...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\artifactStore.ts                       759         (page) => ...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\DataStore.ts                            29   getPage(           
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\legacyAdapter.ts                       114     const id = ent...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\localStore.test.ts                      74     expect(store.g...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\localStore.test.ts                     148     expect(store.g...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\localStore.test.ts                     149     expect(store.g...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\localStore.test.ts                     170     expect(store.g...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\localStore.ts                          162   getPage(           
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\localStore.ts                          168       (page) => pa...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\migrate.ts                              62     if (!page.note...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\migrate.ts                              63       page.notes.p...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\migrate.ts                              76         ? page.not...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\migrate.ts                             136       page.notes.p...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\migrate.ts                             162     const notes = ...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\migrate.ts                             169       ...new Set([...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\migrate.ts                             171       const id = s...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\phase13.test.ts                         36   const saved = st...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\phase13.test.ts                        106   const { authorId...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\phase13.test.ts                        219   expect(store.get...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\supabaseStore.ts                       593   getPage(           
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\supabaseStore.ts                       599       (page) => pa...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\archive\ArchiveScreen.tsx           12   openPage,          
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\archive\ArchiveScreen.tsx           17   openPage: (date:...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\archive\ArchiveScreen.tsx           89                   ...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\archive\ArchiveScreen.tsx           98                   ...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\calendar\CalendarScreen.tsx         14   openPage: (date:...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\calendar\CalendarScreen.tsx         22   openPage,          
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\calendar\CalendarScreen.tsx         73         openPage={...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\calendar\DayPreview.tsx             12   openPage: (date:...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\calendar\DayPreview.tsx             15 export function Da...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\calendar\DayPreview.tsx             42                   ...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\calendar\DayPreview.tsx             52                 on...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\calendar\DayPreview.tsx             59                 on...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\history.test.ts                10   id: `${date}__${...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\HomeScreen.tsx                 23   openPage,          
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\HomeScreen.tsx                 30   openPage: (date:...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\home\HomeScreen.tsx                101                   ...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\PageScreen.tsx                 56     const saved = ...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\PageScreen.tsx                 59       id: `${date}...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\PageScreen.tsx                 80     !store.getPage...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\WritingArea.tsx                17       <div classNa...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\WritingArea.tsx                19           <p key={...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\exportFormat.ts                          75         page.id !=...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\exportFormat.ts                          87           !Array.i...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\exportFormat.ts                          88           page.not...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\stroke.ts                                32   const id = page....
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\styles\app.css                              190 .notes { max-width...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\styles\app.css                              191 .note { background...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\styles\app.css                              192 .note h4 { font-si...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\styles\app.css                              193 .note ul { padding...
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\styles\page.css                             230 .notes {             
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\styles\page.css                             234 .note {              
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\styles\page.css                             247 .diary .note-editor {



exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Encoding UTF8 src/lib/stroke.ts,src/styles/tokens.css,src/styles/page.css,src/styles/app.css,src/features/calendar/DayPreview.tsx,src/features/archive/archiveView.tsx,src/data/types.ts; Get-Content -Encoding UTF8 supabase/migrations/20261027000000_family.sql | Select-String -Pattern 'CREATE TABLE.*pages|CHECK|id =|id=' -Context 3,7" in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
 succeeded in 428ms:
import type { Page, Stroke } from '../data/types';

export function isStrokeWidth(width: unknown): width is Stroke['width'] {
  return [2, 5, 8, 14, 28].includes(width as number);
}

/** Only discard near-duplicate samples in logical (CSS, not device) pixels. */
export function simplifyStroke(
  stroke: Stroke,
  width = 300,
  height = 400,
): Stroke {
  const points: number[] = [];
  let lastX = 0;
  let lastY = 0;
  for (let index = 0; index + 1 < stroke.points.length; index += 2) {
    const x = Math.max(0, Math.min(1, stroke.points[index]));
    const y = Math.max(0, Math.min(1, stroke.points[index + 1]));
    if (
      points.length &&
      Math.hypot((x - lastX) * width, (y - lastY) * height) < 0.5
    )
      continue;
    points.push(Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000);
    lastX = x;
    lastY = y;
  }
  return { ...stroke, points };
}

export function preparePage(page: Page): Page {
  const id = page.date + '__' + page.childId + '__' + page.authorId;
  if (!['dad', 'mom'].includes(page.authorId) || page.id !== id) {
    throw new Error('페이지의 날짜, 아이와 작성자는 바꿀 수 없어요.');
  }
  const result = {
    ...page,
    id,
    drawing: page.drawing.map((stroke) => {
      if (!isStrokeWidth(stroke.width)) {
        throw new Error('그림 도구의 굵기를 확인해 주세요.');
      }
      // Keep detail captured at up to 4× zoom, including across repeated saves.
      return simplifyStroke(stroke, 4096, 3276.8);
    }),
  };
  if (new Blob([JSON.stringify(result)]).size > 200 * 1024) {
    throw new Error('그림이 너무 커서 저장할 수 없어요. 일부를 지워 주세요');
  }
  return structuredClone(result);
}

/* ===== Design tokens ===== */
:root {
  --bg: #F6F5F2;
  --card: #FFFFFF;
  --surface: #FFFFFF;
  --field: #F4F1EC;
  --text: #1E1F24;
  --sub: #74757C;
  --line: #E6E4DF;
  --kid1: #F28B6E;
  --kid1-soft: #FDEDE7;
  --kid2: #5BB8A6;
  --kid2-soft: #E4F4F0;
  --dad: #6E8FD6;
  --mom: #D9849F;
  --primary: #1E1F24;
  --on-primary: #FFFFFF;
  --shadow: 0 1px 2px rgba(30,31,36,.04), 0 8px 24px rgba(30,31,36,.06);
  --scrim: rgba(43,41,37,.28);
  --page: #EFEBE5;

  --t-vax-bg: #E6EEFA; --t-vax: #3D5C8C;
  --t-fever-bg: #FBE6E4; --t-fever: #9A3E36;
  --t-hosp-bg: #E5F2F3; --t-hosp: #2F6C70;
  --t-first-bg: #FBF1D9; --t-first: #8A6416;
  --t-growth-bg: #EAF3E2; --t-growth: #4C6E2E;
  --t-food-bg: #F6ECE2; --t-food: #85593A;
  --t-sleep-bg: #ECE8F6; --t-sleep: #5A4C8A;
  --t-med-bg: #F3E8F1; --t-med: #7E4373;
  --t-prenatal-bg: #FCEBDD; --t-prenatal: #8C5527;

  --r-card: 16px;
  --ease: cubic-bezier(.2,.8,.2,1);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
    --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
    --dad: #8AA6E3; --mom: #E39BB3;
    --shadow: 0 1px 2px rgba(0,0,0,.3); --scrim: rgba(0,0,0,.5); --page: #0F0E0D;
    --t-vax-bg: #22304A; --t-vax: #AFC6EE; --t-fever-bg: #3E2422; --t-fever: #F0B3AC;
    --t-hosp-bg: #1D3536; --t-hosp: #A3D6D8; --t-first-bg: #3A3020; --t-first: #EBCB86;
    --t-growth-bg: #26331D; --t-growth: #B8D99A; --t-food-bg: #36291F; --t-food: #E2BC9D;
    --t-sleep-bg: #2A2640; --t-sleep: #C4B8EC; --t-med-bg: #372434; --t-med: #E2B0D8;
    --t-prenatal-bg: #3A2A1E; --t-prenatal: #EDC3A0;
  }
}
:root[data-theme="dark"] {
  --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
  --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
  --dad: #8AA6E3; --mom: #E39BB3;
  --shadow: 0 1px 2px rgba(0,0,0,.3); --scrim: rgba(0,0,0,.5); --page: #0F0E0D;
  --t-vax-bg: #22304A; --t-vax: #AFC6EE; --t-fever-bg: #3E2422; --t-fever: #F0B3AC;
  --t-hosp-bg: #1D3536; --t-hosp: #A3D6D8; --t-first-bg: #3A3020; --t-first: #EBCB86;
  --t-growth-bg: #26331D; --t-growth: #B8D99A; --t-food-bg: #36291F; --t-food: #E2BC9D;
  --t-sleep-bg: #2A2640; --t-sleep: #C4B8EC; --t-med-bg: #372434; --t-med: #E2B0D8;
  --t-prenatal-bg: #3A2A1E; --t-prenatal: #EDC3A0;
}
.diary {
  position: relative;
  z-index: 11;
  min-height: 100dvh;
  font:
    20px/1.5 Gaegu,
    cursive;
  transform-origin: top left;
  word-break: keep-all;
}

.diary-content {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  margin: auto;
  padding-top: env(safe-area-inset-top, 0px);
  width: 100%;
}

.diary button {
  min-width: 44px;
  min-height: 44px;
  padding: 8px;
  font: inherit;
}

.diary button:disabled {
  cursor: default;
}

.diary button:focus-visible,
.diary input:focus-visible,
.diary textarea:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}

.diary-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 53px;
  padding: 0 max(14px, env(safe-area-inset-right)) 0
    max(14px, env(safe-area-inset-left));
  flex: none;
}

.diary-date {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
  justify-content: center;
}

.diary-date span {
  white-space: nowrap;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.diary-date button {
  padding: 0;
  font-size: 28px;
}

.badge-button {
  position: relative;
}

.badge-button .icon {
  width: 29px;
  height: 29px;
}

.badge-button.chosen svg {
  fill: currentColor;
  fill-opacity: 0.23;
}

.badge-count {
  position: absolute;
  right: 0;
  top: 0;
  font-size: 13px;
}

.art {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: none;
  width: 100%;
  height: auto;
  isolation: isolate;
}

.art canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  touch-action: none;
}

.art .live-stroke {
  cursor: pointer;
}

.art.drawing .live-stroke {
  cursor: crosshair;
}

.art:not(.drawing) canvas {
  touch-action: pan-y;
}


.tray {
  position: relative;
  z-index: 3;
  flex: none;
  margin: 4px max(6px, env(safe-area-inset-right)) 4px max(6px, env(safe-area-inset-left));
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 58px;
  padding: 3px;
  border: 1px solid color-mix(in srgb, currentColor 30%, transparent);
  border-radius: 17px;
  background: color-mix(in srgb, var(--page-color) 88%, #f5f0e1);
  overflow: visible;
}

.tray-tools,
.pen-colors {
  display: flex;
  flex: 0 0 auto;
  min-width: 0;
  overflow-x: auto;
}

.pen-colors {
  border-top: 1px solid color-mix(in srgb, currentColor 15%, transparent);
}
.pen-colors button {
  min-width: 44px;
  min-height: 44px;
}
.pen-color-dot {
  width: 22px;
  height: 22px;
  border-radius: 45% 55% 48% 52%;
}

.tray button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  flex: 1 0 44px;
  padding: 3px 2px;
  font-size: 13px;
  white-space: nowrap;
}

.tray button > span {
  font-size: 22px;
  line-height: 23px;
}

.tray [aria-pressed='true'] {
  border-radius: 12px;
  background: color-mix(in srgb, currentColor 12%, transparent);
}

.tray button:disabled,
.diary .oval:disabled {
  opacity: 0.38;
}

.polaroid {
  position: absolute;
  padding: 8px 8px 23px;
  background: #fffaf0;
  box-shadow: 1px 3px 6px #0002;
  touch-action: none;
  user-select: none;
}

.polaroid::before {
  content: '';
  position: absolute;
  top: -10px;
  left: 32%;
  width: 36%;
  height: 23px;
  background: #f8e4b5b3;
  transform: rotate(5deg);
}

.polaroid img {
  display: block;
  width: 100%;
  max-height: 240px;
  object-fit: contain;
  pointer-events: none;
}

.photo-resize {
  position: absolute;
  right: -12px;
  bottom: -12px;
  border-radius: 50%;
  background: #fffaf0;
  color: #1e2326;
  touch-action: none;
}

.writing {
  flex: 1;
  margin: 9px 29px 0;
  min-height: 176px;
}

.notes {
  min-height: 140px;
}

.note {
  margin-bottom: 14px;
  line-height: 35px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.initial {
  margin-left: 7px;
  opacity: 0.5;
  font-size: 13px;
}

.diary .note-editor {
  display: block;
  width: 100%;
  min-height: 140px;
  resize: vertical;
  border: 0;
  border-radius: 0;
  padding: 0;
  background: none;
  color: inherit;
  font-size: 20px;
  line-height: 35px;
}

.diary textarea::placeholder,
.diary input::placeholder {
  color: inherit;
  opacity: 0.6;
}

.diary-hint {
  min-height: 24px;
  margin: 5px 20px 0;
  text-align: center;
  font-size: 16px;
  opacity: 0.7;
}

.diary-error {
  padding: 5px 22px;
  text-align: center;
  font-size: 17px;
}

.diary-bottom {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: center;
  flex: none;
  min-height: 101px;
  padding: 10px 24px calc(20px + env(safe-area-inset-bottom, 0px));
}

.comment-button {
  justify-self: start;
  padding-left: 0;
}

.diary .oval {
  justify-self: center;
  width: 88px;
  height: 65px;
  border: 1.5px solid currentColor;
  border-radius: 47% 53% 48% 49% / 48% 44% 56% 52%;
  transform: rotate(-5deg);
}

.oval span {
  display: block;
  transform: rotate(5deg);
}

.diary-sheet-layer {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: flex-end;
  background: #1e1f2438;
}

.diary .sheet {
  position: relative;
  inset: auto;
  width: 100%;
  max-width: 600px;
  max-height: 80dvh;
  margin: 0 auto;
  overflow: auto;
  padding: 10px 22px calc(24px + env(safe-area-inset-bottom, 0px));
  border-radius: 29px 29px 0 0;
  background: var(--page-color);
  color: var(--page-ink);
  transform: none;
  animation: diary-sheet-in 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.diary .sheet-head h3 {
  font-size: 20px;
  font-weight: 400;
}

.diary .sheet-head {
  margin-bottom: 8px;
}

.handle {
  width: 33px;
  height: 3px;
  margin: 0 auto 12px;
  border-radius: 3px;
  background: currentColor;
  opacity: 0.25;
}

.badge-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px 6px;
  padding: 8px 0 14px;
}

.diary .sticker {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-height: 89px;
  padding: 6px 0;
  font-size: 17px;
}

.sticker-art {
  display: grid;
  place-items: center;
  width: 49px;
  height: 46px;
  border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
  border-radius: 48% 52% 46% 54%;
  transform: rotate(-5deg);
}

.sticker:nth-child(even) .sticker-art {
  transform: rotate(6deg);
}

.sticker-art .icon {
  width: 29px;
  height: 29px;
}

.sticker[aria-pressed='true'] .sticker-art {
  background: var(--page-ink);
  color: var(--page-color);
}

.sticker[aria-pressed='true']::after {
  content: '✓';
  position: absolute;
  top: 1px;
  right: 12px;
  font-size: 15px;
}

.sheet-done {
  width: 100%;
  margin-top: 8px;
  border: 1px solid currentColor;
  border-radius: 48% 51% 47% 52% / 14% 18% 19% 17%;
}

.diary .color-swatch {
  padding: 4px;
}
.diary .color-swatch[aria-pressed='true'] .color-swatch-dot {
  outline-color: var(--page-ink);
}

.diary-comment {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 13px 0 !important;
  border-bottom: 1px solid color-mix(in srgb, currentColor 13%, transparent);
  text-align: left;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.comment-author {
  opacity: 0.65;
  font-size: 15px;
}

.heart-toggle {
  display: block;
  margin: 6px 0;
}

.diary .comment-form {
  display: flex;
  gap: 7px;
  padding: 0 3px 0 15px;
  border: 1px solid color-mix(in srgb, currentColor 30%, transparent);
  border-radius: 24px;
}

.comment-form input {
  min-width: 0;
  width: 100%;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
}

.comment-form button {
  flex: none;
}

.comment-actions,
.leave-actions {
  display: flex;
  justify-content: space-around;
  gap: 12px;
}

.leave-actions button {
  flex: 1;
  border: 1px solid currentColor;
  border-radius: 45%;
}

.app-shell > .toast {
  position: fixed;
  z-index: 12;
  bottom: calc(100px + env(safe-area-inset-bottom));
}

@keyframes diary-sheet-in {
  from {
    transform: translateY(100%);
  }
  to {
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .diary *,
  .diary {
    animation: none !important;
    transition: none !important;
  }
}

.art-box {
  position: relative;
  flex: none;
  width: min(100%, 75svh);
  aspect-ratio: 5 / 4;
  margin-inline: auto;
  overflow: hidden;
}

@media (min-width: 768px) {
  .diary { min-height: 100dvh; background: var(--page-color); }
  .diary-content { max-width: 640px; }
  .diary-head { padding-inline: 14px; }
  .art-box { width: 100%; }
  .tray { margin-inline: 0; }
  .writing { margin-inline: 29px; }
  .diary-bottom { padding-inline: 24px; }
  .diary-sheet-layer { align-items: center; justify-content: center; }
  .diary .sheet { width: min(480px, calc(100% - 32px)); border-radius: 24px; padding-bottom: 24px; }
  .diary .handle { display: none; }
}

.is-drawing .writing,
.is-drawing .diary-content > .diary-hint {
  display: none;
}
.editable-note {
  display: flex;
  align-items: start;
  gap: 7px;
}
.editable-note .initial {
  margin: 8px 0 0;
}
.comment-button,
.heart-toggle {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.diary .icon {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.parent-pages {
  display: flex;
  justify-content: center;
  gap: 8px;
  word-break: keep-all;
}
.parent-pages button {
  min-height: 44px;
  padding: 2px 5px;
  background: transparent;
  color: inherit;
  opacity: 0.45;
}
.parent-pages button[aria-pressed='true'] {
  opacity: 1;
}

.art-surface {
  position: absolute;
  inset: 0;
  transform-origin: 0 0;
}
.art.drawing .art-box { touch-action: none; }
.art.empty .art-box::after {
  content: '여기에 그려요';
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  opacity: .3;
  font-size: 17px;
}
.parent-face { display: block; width: 27px; height: 30px; }
.parent-underline { visibility: hidden; }
[aria-pressed='true'] .parent-underline { visibility: visible; }
.page-palette { justify-self: end; width: 44px; height: 44px; }
.page-palette .icon { width: 23px; height: 23px; opacity: .7; }
.tool-popover {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 0;
  right: 0;
  padding: 8px;
  border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
  border-radius: 17px;
  background: var(--page-color);
  box-shadow: 0 4px 16px #0002;
}
.thickness-options { display: flex; }
.tool-popover .pen-colors { flex-wrap: wrap; overflow: visible; }
.tool-popover .pen-colors button { flex: 0 0 44px; }
.pen-glyph { position: relative; }
.pen-glyph i {
  position: absolute;
  width: 9px;
  height: 9px;
  bottom: 0;
  right: -6px;
  border-radius: 50%;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { min-height: 100%; background: var(--bg); }
body {
  font-family: "Pretendard", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  color: var(--text); font-size: 16px; line-height: 1.5;
  -webkit-font-smoothing: antialiased; letter-spacing: -0.01em;
  padding: 0;
}
body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg); }
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
.artifact-welcome { min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; padding: calc(24px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-inset-bottom)); background: var(--bg); }
.artifact-welcome h2 { font-size: 22px; }
.artifact-picker { display: flex; gap: 16px; width: 100%; max-width: 320px; }
.artifact-picker button { flex: 1; min-height: 64px; }
.artifact-note { text-align: center; color: var(--sub); font-size: 13px; padding: 8px 16px; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }

/* ===== Phone ===== */

.status { height: 44px; flex: none; display: flex; align-items: center; justify-content: space-between; padding: 0 28px; font-size: 14px; font-weight: 600; }
.status .notch { width: 110px; height: 30px; background: #1d1c1a; border-radius: 20px; }
.scroll { flex: 1; overflow-y: auto; scrollbar-width: none; padding-bottom: 24px; }
.scroll::-webkit-scrollbar { display: none; }

.tabbar { flex: none; height: 82px; padding: 8px 24px 26px; display: flex; justify-content: space-around; background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: blur(12px); border-top: 1px solid var(--line); }
.tabbar { position: fixed; z-index: 4; left: 0; right: 0; bottom: 0; padding-bottom: calc(8px + env(safe-area-inset-bottom)); }
.is-artifact .app-shell { padding-top: 0; }
.app-shell { min-height: 100dvh; padding-top: env(safe-area-inset-top); padding-bottom: calc(82px + env(safe-area-inset-bottom)); background: var(--bg); }
.app-content { width: 100%; max-width: 520px; margin: 0 auto; }
.tab { display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 11px; color: var(--sub); min-width: 64px; min-height: 44px; justify-content: center; }
.tab svg { width: 24px; height: 24px; }
.tab.on { color: var(--text); font-weight: 600; }

/* ===== Today ===== */
.date-head { position: sticky; top: env(safe-area-inset-top, 0px); z-index: 2; padding: 8px 12px 14px; background: color-mix(in srgb, var(--bg) 90%, transparent); backdrop-filter: blur(12px); display: flex; align-items: center; justify-content: space-between; }
.icon-btn { width: 44px; height: 44px; border-radius: 999px; display: grid; place-items: center; color: var(--sub); transition: background .15s; }
.icon-btn:active { background: var(--field); }
.icon-btn svg { width: 22px; height: 22px; }
.date-center { text-align: center; }
.date-center .eyebrow { font-size: 13px; color: var(--sub); height: 20px; display: flex; align-items: center; justify-content: center; gap: 6px; }
.date-center h2 { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
.date-title-button { min-height: 30px; }
.date-input { position: fixed; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
.to-today { font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 999px; background: var(--text); color: var(--bg); }

.cards { padding: 0 16px; display: flex; flex-direction: column; gap: 14px; }
.card { background: var(--card); border-radius: var(--r-card); box-shadow: var(--shadow); padding: 18px 16px 14px; }
.card-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 10px; }
.kid-dot { width: 10px; height: 10px; border-radius: 99px; align-self: center; flex: none; }
.kid-name { font-size: 17px; font-weight: 700; }
.kid-age { font-size: 13px; color: var(--sub); }
.kid-count { margin-left: auto; font-size: 13px; color: var(--sub); }

.entries { list-style: none; display: flex; flex-direction: column; }
.entry { padding: 10px 0; border-bottom: 1px solid var(--line); display: flex; flex-direction: column; gap: 6px; animation: rise .25s var(--ease); }
.entry:first-child { padding-top: 2px; }
.entry-text { font-size: 16px; word-break: keep-all; overflow-wrap: anywhere; }
.entry-button { display: flex; flex-direction: column; gap: 6px; text-align: left; }
.entry-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 13px; color: var(--sub); }
.author { display: inline-flex; align-items: center; gap: 4px; }
.author i { width: 6px; height: 6px; border-radius: 9px; display: inline-block; }
.meta-sep { opacity: .5; }
.reaction-meta, .comment-count { color: var(--sub); }
.comment { display: flex; flex-direction: column; gap: 3px; margin: 2px 0 2px 12px; padding: 7px 0 7px 10px; border-left: 2px solid var(--mom); text-align: left; width: calc(100% - 12px); }
.comment-meta { display: flex; align-items: center; gap: 5px; color: var(--sub); font-size: 13px; }
.comment-meta i { width: 6px; height: 6px; border-radius: 9px; }
.comment-body { font-size: 16px; white-space: pre-wrap; overflow-wrap: anywhere; }
.comments-more { margin: 2px 0 4px 12px; min-height: 36px; color: var(--sub); font-size: 13px; }
.comment-composer { margin: 4px 0 4px 12px; }
.feed-comment { width: auto; }
.comment-edit-layer { position: fixed; left: 16px; right: 16px; bottom: calc(82px + env(safe-area-inset-bottom)); z-index: 7; background: var(--card); border-radius: var(--r-card); padding: 12px; box-shadow: var(--shadow); }
.new-activity, .activity-dot { width: 7px; height: 7px; border-radius: 9px; background: var(--mom); display: inline-block; flex: none; }
@keyframes reaction-pop { 50% { transform: scale(1.02); } }
.reaction-pop { animation: reaction-pop .35s var(--ease); }
@media (prefers-reduced-motion: reduce) { .reaction-pop { animation: none; } }
@keyframes rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }

.badge { display: inline-flex; align-items: center; gap: 3px; font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 999px; line-height: 18px; }

.composer { margin-top: 12px; }
.field { display: flex; align-items: flex-end; gap: 8px; background: var(--field); border-radius: 14px; padding: 4px 4px 4px 14px; transition: box-shadow .15s; }
.card.active .field { box-shadow: 0 0 0 1.5px var(--accent) inset; }
.field textarea { flex: 1; resize: none; border: 0; outline: 0; background: transparent; font: inherit; color: var(--text); padding: 9px 0; min-height: 40px; max-height: 120px; line-height: 22px; }
.field textarea::placeholder { color: var(--sub); }
.send { width: 40px; height: 40px; border-radius: 11px; display: grid; place-items: center; background: var(--accent); color: #fff; opacity: 0; transform: scale(.85); transition: opacity .15s, transform .2s var(--ease); pointer-events: none; }
.send.ready { opacity: 1; transform: none; pointer-events: auto; }
.send svg { width: 20px; height: 20px; }
.chips { display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none; max-height: 0; opacity: 0; transition: max-height .25s var(--ease), opacity .2s, margin .2s; margin-top: 0; }
.chips::-webkit-scrollbar { display: none; }
.card.active .chips { max-height: 52px; opacity: 1; margin-top: 10px; }
.chip { flex: none; display: inline-flex; align-items: center; gap: 4px; height: 36px; padding: 0 12px; border-radius: 999px; font-size: 13px; background: var(--card); border: 1px solid var(--line); color: var(--sub); transition: all .15s; }
.chip.on { border-color: transparent; font-weight: 600; }
.edit-actions { display: flex; justify-content: flex-end; gap: 4px; }
.edit-actions button { min-height: 44px; padding: 0 10px; color: var(--sub); font-size: 14px; font-weight: 600; }

.hint { text-align: center; font-size: 13px; color: var(--sub); padding: 18px 0 4px; }

/* ===== Calendar ===== */
.cal-head { display: flex; align-items: center; justify-content: space-between; padding: 6px 12px 4px; }
.cal-head h2 { font-size: 22px; font-weight: 700; padding-left: 8px; }
.cal-head .nav { display: flex; }
.cal { padding: 0 12px; }
.wk, .grid { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; }
.wk span { font-size: 12px; color: var(--sub); padding: 6px 0; }
.wk span:first-child { color: var(--kid1); }
.day { height: 48px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding-top: 4px; gap: 3px; border-radius: 12px; position: relative; }
.day .n { width: 28px; height: 28px; border-radius: 99px; display: grid; place-items: center; font-size: 14px; font-variant-numeric: tabular-nums; }
.day.muted .n { color: var(--sub); opacity: .4; }
.day.today .n { background: var(--text); color: var(--bg); font-weight: 700; }
.day.sel { background: var(--field); }
.dots { display: flex; gap: 3px; height: 6px; }
.dots i { width: 5px; height: 5px; border-radius: 9px; }
.day .mark { position: absolute; top: 1px; right: 3px; font-size: 10px; line-height: 1; }

.filters { position: sticky; top: 0; z-index: 2; background: color-mix(in srgb, var(--bg) 92%, transparent); backdrop-filter: blur(12px); padding: 12px 16px 10px; margin-top: 10px; border-top: 1px solid var(--line); display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none; }
.filters::-webkit-scrollbar { display: none; }
.kid-seg { display: inline-flex; background: var(--field); border-radius: 999px; padding: 3px; flex: none; }
.kid-seg button { height: 32px; padding: 0 12px; border-radius: 999px; font-size: 13px; color: var(--sub); }
.kid-seg button.on { background: var(--card); color: var(--text); font-weight: 600; box-shadow: var(--shadow); }
.fchip { flex: none; height: 38px; padding: 0 12px; border-radius: 999px; border: 1px solid var(--line); font-size: 13px; color: var(--sub); display: inline-flex; align-items: center; gap: 4px; }
.fchip.on { background: var(--t-vax-bg); color: var(--t-vax); border-color: transparent; font-weight: 600; }
.fchip svg { width: 16px; height: 16px; }

.feed { padding: 4px 16px 0; }
.feed-day { margin-top: 14px; }
.feed-date { font-size: 13px; color: var(--sub); font-weight: 600; padding: 0 4px 6px; display: flex; gap: 6px; }
.feed-card { background: var(--card); border-radius: var(--r-card); box-shadow: var(--shadow); padding: 4px 14px; }
.feed-card .entry { animation: none; }
.feed-card .entry:last-child { border-bottom: 0; }
.feed-card .entry:first-child { padding-top: 10px; }
.kid-tag { font-size: 12px; font-weight: 700; }

/* Bottom sheet */
.scrim { position: absolute; inset: 0; background: var(--scrim); opacity: 0; pointer-events: none; transition: opacity .2s; z-index: 5; }
.sheet { position: absolute; left: 0; right: 0; bottom: 0; z-index: 6; background: var(--bg); border-radius: 24px 24px 0 0; padding: 8px 16px 34px; transform: translateY(105%); transition: transform .35s cubic-bezier(.32,1.25,.5,1); max-height: 78%; overflow-y: auto; }
.phone.sheet-open .scrim { opacity: 1; pointer-events: auto; }
.phone.sheet-open .sheet { transform: none; }
.grab { width: 36px; height: 5px; border-radius: 9px; background: var(--line); margin: 0 auto 12px; }
.sheet-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.sheet-head h3 { font-size: 20px; font-weight: 700; }
.text-btn { font-size: 14px; font-weight: 600; color: var(--sub); min-height: 44px; padding: 0 6px; }
.sheet .card { margin-bottom: 12px; }

/* ===== Settings ===== */
.set-title { font-size: 22px; font-weight: 700; padding: 10px 24px 8px; }
.group { margin: 14px 16px 0; }
.group-label { font-size: 13px; color: var(--sub); font-weight: 600; padding: 0 8px 6px; }
.list { background: var(--card); border-radius: var(--r-card); box-shadow: var(--shadow); overflow: hidden; }
.row { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 0 16px; border-bottom: 1px solid var(--line); }
.row:last-child { border-bottom: 0; }
.row .main { flex: 1; min-width: 0; }
.row .main small { display: block; font-size: 13px; color: var(--sub); }
.row .val { font-size: 14px; color: var(--sub); }
.row-button { width: 100%; text-align: left; }
.row-button strong { font-weight: 600; }
.seg { display: inline-flex; background: var(--field); border-radius: 999px; padding: 3px; }
.seg button { min-height: 36px; padding: 0 12px; border-radius: 999px; font-size: 13px; color: var(--sub); }
.seg button[aria-pressed="true"] { background: var(--text); color: var(--bg); }
.sheet-form, .tag-editor, .backup-actions { display: flex; flex-direction: column; gap: 14px; }
.sheet-form label, .form-label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: var(--sub); font-weight: 600; }
.sheet-form input, .tag-add input, .tag-add select { min-height: 44px; border: 1px solid var(--line); border-radius: 12px; padding: 0 12px; background: var(--field); color: var(--text); font: inherit; }
.primary-btn, .secondary-btn { min-height: 48px; border-radius: 14px; padding: 0 16px; font-weight: 700; }
.primary-btn { background: var(--text); color: var(--bg); }
.secondary-btn { background: var(--field); }
.tag-edit-row { display: flex; align-items: center; gap: 4px; min-height: 44px; }
.tag-edit-row .badge { margin-right: auto; }
.tag-label-input { min-width: 0; flex: 1; min-height: 40px; border: 1px solid var(--line); border-radius: 10px; padding: 0 8px; background: var(--field); color: var(--text); font: inherit; }
.tag-edit-row button { min-height: 44px; padding: 0 8px; color: var(--sub); font-size: 13px; }
.tag-add { display: grid; grid-template-columns: 48px 1fr; gap: 6px; padding-top: 8px; border-top: 1px solid var(--line); }
.tag-add select { grid-column: 1 / -1; }
.tag-add .primary-btn { grid-column: 1 / -1; }
.backup-actions p { color: var(--sub); font-size: 13px; }
.chev { width: 16px; height: 16px; color: var(--sub); opacity: .6; }
.avatar { width: 32px; height: 32px; border-radius: 99px; display: grid; place-items: center; font-size: 14px; font-weight: 700; color: #fff; flex: none; }
.ok { width: 8px; height: 8px; border-radius: 9px; background: var(--kid2); }
.tag-wrap { display: flex; flex-wrap: wrap; gap: 6px; padding: 14px 16px; }

/* Toast */
.toast { position: absolute; left: 16px; right: 16px; bottom: 96px; z-index: 4; background: var(--text); color: var(--bg); border-radius: 14px; padding: 0 8px 0 16px; height: 52px; display: flex; align-items: center; justify-content: space-between; font-size: 14px; transform: translateY(20px); opacity: 0; pointer-events: none; transition: all .25s var(--ease); }
.toast.show { transform: none; opacity: 1; pointer-events: auto; }
.toast button { font-weight: 700; color: var(--bg); padding: 0 12px; min-height: 44px; }

/* Entry actions */
.action-scrim { position: fixed; inset: 0; z-index: 5; background: var(--scrim); }
.action-sheet { position: fixed; left: 16px; right: 16px; bottom: calc(82px + env(safe-area-inset-bottom)); z-index: 6; display: flex; flex-direction: column; overflow: hidden; background: var(--card); border-radius: var(--r-card); box-shadow: var(--shadow); animation: rise .2s var(--ease); }
.action-sheet button { min-height: 52px; border-bottom: 1px solid var(--line); font-size: 16px; }
.action-sheet button:last-child { border-bottom: 0; color: var(--sub); }
.action-sheet .danger { color: var(--kid1); }

.notes { max-width: 1240px; margin: 40px auto 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
.note { background: var(--card); border-radius: var(--r-card); padding: 18px; box-shadow: var(--shadow); font-size: 14px; }
.note h4 { font-size: 15px; margin-bottom: 6px; }
.note ul { padding-left: 18px; color: var(--sub); }
.swatches { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.sw { width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--line); }

/* Calendar interactions reuse the mockup's component styles above. */
.calendar-top {
  position: sticky;
  top: env(safe-area-inset-top);
  z-index: 2;
  background: var(--bg);
}
.grid-window { overflow: hidden; transition: height .35s var(--ease); }
.grid { transition: transform .35s var(--ease); touch-action: pan-y; }
.day .n { font-size: 13px; }
.day .mark { font-size: 12px; }
.filter-bar {
  position: sticky;
  top: calc(env(safe-area-inset-top) + 132px);
  z-index: 3;
  background: var(--bg);
}
.filter-bar .filters { position: static; margin-top: 0; }
.kid-seg button, .fchip, .chip { min-height: 44px; }
.filter-popover {
  position: absolute;
  top: 100%;
  left: 16px;
  right: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 14px;
  border-radius: var(--r-card);
  background: var(--card);
  box-shadow: var(--shadow);
  border: 1px solid var(--line);
}
.filter-search { padding: 0 16px 10px; }
.filter-search input {
  width: 100%;
  min-height: 44px;
  padding: 8px 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  color: var(--text);
  background: var(--field);
  font: inherit;
}
.filter-reset { display: block; margin-left: auto; margin-right: 16px; }
.filter-bar .text-btn, .sheet .text-btn { font-size: 13px; }
.feed-card { list-style: none; }
.feed .entry-button { width: 100%; min-height: 44px; }
.entry-text { white-space: pre-wrap; }
.feed-sentinel { height: 44px; }
.bottom-sheet-layer { position: fixed; inset: 0; z-index: 6; pointer-events: none; }
.bottom-sheet-layer .scrim { position: fixed; }
.bottom-sheet-layer.sheet-open .scrim { opacity: 1; pointer-events: auto; }
.bottom-sheet-layer .sheet {
  position: absolute;
  max-height: 78dvh;
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  padding-bottom: calc(34px + env(safe-area-inset-bottom));
  overscroll-behavior-y: contain;
  pointer-events: auto;
}
.bottom-sheet-layer.sheet-open .sheet { transform: none; }
.sheet-handle { padding: 0 0 8px; touch-action: none; }
.sheet-handle .grab { margin-bottom: 0; }
.sheet-head h3 { font-size: 17px; }
.sheet .cards { padding: 0; gap: 0; }
.sheet .today-page { min-width: 0; }
.sheet .toast { position: fixed; z-index: 10; bottom: calc(16px + env(safe-area-inset-bottom)); font-size: 13px; }
.sheet .action-scrim { z-index: 8; }
.sheet .action-sheet { z-index: 9; }
.go-to-day { display: block; margin: 0 auto; }
.send { width: 44px; height: 44px; }

.backup-dot { width: 8px; height: 8px; border-radius: 9px; background: var(--line); flex: none; }
.backup-dot.ok { background: var(--kid2); }
.sign-in-page {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: calc(24px + env(safe-area-inset-top)) 16px calc(24px + env(safe-area-inset-bottom));
}
.sign-in-card { width: 100%; max-width: 400px; padding: 24px; }
.sign-in-card h1 { font-size: 22px; margin-bottom: 24px; }
.sign-in-card p { font-size: 13px; color: var(--sub); }
.sign-in-card button { min-height: 44px; }
.sync-status {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: calc(8px + env(safe-area-inset-top)) 16px 8px;
  background: var(--field);
  color: var(--sub);
  font-size: 13px;
}
.sync-status button { min-height: 44px; flex: none; }

/* Phase 10 shell, based on mockup-v3. */
* { word-break: keep-all; }
.app-shell { min-height: 100dvh; max-width: 520px; margin: 0 auto; padding: calc(20px + env(safe-area-inset-top)) 0 calc(88px + env(safe-area-inset-bottom)); background: var(--bg); }
.screen-scroll { padding: 18px 22px; min-height: calc(100dvh - 88px); overflow: auto; }
.icon { width: 22px; height: 22px; display: inline-block; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; vertical-align: middle; }
.meta { color: var(--sub); font-size: 13px; }
.home-head { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
.home-head h1 { font-size: 28px; letter-spacing: -.06em; line-height: 1.3; }
.writer-chip { display: inline-block; margin-top: 7px; padding: 5px 11px; border-radius: 20px; background: var(--field); color: var(--sub); font-size: 12px; }
.avatar { display: grid; place-items: center; width: 46px; height: 46px; flex: none; border-radius: 50%; background: var(--surface); border: 1px solid var(--line); font-size: 14px; }
.date-switch { display: flex; align-items: center; width: fit-content; margin: 11px 0 8px -9px; color: var(--sub); font-size: 13px; }
.date-switch button, .month-nav button, .back-title button { min-width: 44px; min-height: 44px; }
.date-switch span { min-width: 70px; text-align: center; }
.page-color { background: var(--page-color); color: var(--page-ink, #1E2326); }
.search { display: flex; align-items: center; gap: 9px; min-height: 48px; margin: 16px 0; padding: 0 16px; border: 1px solid var(--line); border-radius: 30px; background: var(--surface); color: var(--sub); }
.search input { width: 100%; height: 46px; border: 0; outline: 0; background: none; color: var(--text); }
.section-head { display: flex; align-items: center; justify-content: space-between; }
.section-head h2 { font-size: 17px; }
.section-head button { display: inline-flex; align-items: center; gap: 2px; color: var(--sub); font-size: 13px; }
.section-head button .icon { width: 15px; height: 15px; }
.segments { display: flex; gap: 5px; margin: 6px 0 9px; }
.segments button { min-height: 40px; padding: 6px 15px; border-radius: 24px; color: var(--sub); }
.segments button[aria-pressed="true"], .setting-theme button[aria-pressed="true"] { background: var(--primary); color: var(--on-primary); }
.recent-row { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 5px; scrollbar-width: none; }
.page-card { position: relative; display: flex; flex: 0 0 157px; flex-direction: column; width: 157px; height: 181px; padding: 11px 13px; border-radius: 21px; overflow: hidden; text-align: left; }
.drawing-preview { width: 100%; height: auto; aspect-ratio: 5 / 4; margin: 2px auto; flex: none; }
.card-label { display: block; width: calc(100% + 26px); margin: auto -13px -11px; padding: 8px 13px 10px; background: color-mix(in srgb, var(--page-color) 78%, var(--page-ink) 8%); }
.card-label small, .card-label span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.card-label small { font-size: 11px; opacity: .7; }
.card-label span { margin-top: 3px; font-size: 12px; }
.mini-badge { position: absolute; top: 9px; right: 10px; }
.empty-results { padding: 20px 0; color: var(--sub); font-size: 13px; }
.tabbar { position: fixed; z-index: 4; right: 0; bottom: 0; left: 0; display: flex; justify-content: space-around; min-height: 78px; padding: 8px 26px calc(14px + env(safe-area-inset-bottom)); background: color-mix(in srgb, var(--surface) 92%, transparent); border-top: 1px solid var(--line); backdrop-filter: blur(12px); }
.tab { position: relative; display: flex; width: 66px; min-height: 44px; flex-direction: column; align-items: center; gap: 2px; color: var(--sub); font-size: 11px; }
.tab.on { color: var(--text); }
.tab.on::after { position: absolute; bottom: 0; width: 4px; height: 4px; border-radius: 50%; background: currentColor; content: ''; }
.screen-title { margin: 2px 0 27px; font-size: 28px; letter-spacing: -.05em; }
.month-nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.month-nav h2 { font-size: 20px; }
.weekdays, .month-grid { display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; }
.weekdays { margin-bottom: 7px; color: var(--sub); font-size: 12px; }
.day { display: flex; min-width: 0; height: 53px; flex-direction: column; align-items: center; justify-content: center; gap: 3px; }
.day-num { display: grid; width: 32px; height: 32px; place-items: center; border-radius: 50%; }
.day.today .day-num { background: var(--primary); color: var(--on-primary); }
.day.selected:not(.today) .day-num { outline: 1px solid var(--sub); }
.dots { display: flex; gap: 3px; height: 4px; }
.dots i, .dot { display: block; width: 5px; height: 5px; border-radius: 50%; }
.legend { display: flex; gap: 16px; margin: 17px 0 25px; color: var(--sub); font-size: 12px; }
.legend span { display: flex; align-items: center; gap: 5px; }
.day-preview { padding: 17px; border: 1px solid var(--line); border-radius: 25px; background: var(--surface); }
.day-preview h2 { margin-bottom: 13px; font-size: 17px; }
.preview-kids { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.preview-kids .page-card { width: 100%; min-width: 0; height: 167px; }
.settings-group { margin-bottom: 24px; }
.settings-group h2 { margin: 0 0 8px 4px; color: var(--sub); font-size: 13px; font-weight: 500; }
.settings-list { overflow: hidden; border: 1px solid var(--line); border-radius: 20px; background: var(--surface); }
.setting { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 59px; gap: 12px; padding: 11px 16px; border-bottom: 1px solid var(--line); text-align: left; }
.setting:last-child { border-bottom: 0; }
.setting > span:nth-child(2) { flex: 1; }
.setting small { display: block; margin-top: 2px; color: var(--sub); font-size: 12px; }
.setting input[type="file"] { max-width: 120px; font-size: 11px; }
.colors { display: flex; gap: 5px; }
.colors i { width: 18px; height: 18px; border-radius: 50%; }
.tag-wrap { display: flex; flex-wrap: wrap; gap: 6px; padding: 14px 16px; }
.badge { display: inline-flex; padding: 4px 9px; border-radius: 20px; background: var(--field); font-size: 12px; }
.setting-theme { display: flex; gap: 5px; padding: 5px; }
.setting-theme button { flex: 1; min-height: 40px; border-radius: 18px; font-size: 13px; }
.sheet-layer { position: fixed; z-index: 10; inset: 0; display: flex; align-items: flex-end; background: rgba(30,31,36,.35); }
.sheet { width: 100%; max-width: 520px; margin: 0 auto; padding: 18px 22px calc(24px + env(safe-area-inset-bottom)); border-radius: 29px 29px 0 0; background: var(--surface); }
.sheet-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.color-picker-label { margin: 0 0 6px; font-size: 14px; word-break: keep-all; }
.color-recommendations { display: flex; gap: 4px; overflow-x: auto; padding: 3px; margin-bottom: 12px; }
.pastel-grid { display: grid; grid-template-columns: repeat(5, minmax(44px, 1fr)); gap: 4px; }
.color-swatch { display: grid; place-items: center; min-width: 44px; min-height: 44px; padding: 4px; }
.color-recommendations .color-swatch { flex: 0 0 44px; }
.color-swatch-dot { display: grid; place-items: center; width: 34px; height: 34px; background: var(--page-color); color: var(--page-ink); border: 1px solid color-mix(in srgb, currentColor 20%, transparent); border-radius: 47% 53% 45% 55%; }
.color-swatch[aria-pressed="true"] .color-swatch-dot { outline: 2px solid var(--text); outline-offset: 3px; border-radius: 43% 57% 49% 51% / 54% 44% 56% 46%; transform: rotate(-6deg); }
.sheet-confirm { margin: 16px 0 10px; color: var(--sub); font-size: 13px; }
.primary-btn, .secondary-btn { min-height: 48px; padding: 0 16px; border-radius: 14px; font-weight: 700; }
.primary-btn { background: var(--primary); color: var(--on-primary); }
.secondary-btn { background: var(--field); }
.sheet .primary-btn { width: 100%; }
.back-button { display: inline-flex; align-items: center; gap: 5px; min-height: 44px; color: var(--sub); }
.back-title { display: flex; align-items: center; gap: 7px; margin: -7px 0 17px -10px; }
.back-title h1 { font-size: 28px; }
.archive-month { margin: 20px 0 25px; }
.archive-month h2 { margin: 0 0 9px 4px; color: var(--sub); font-size: 13px; }
.archive-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; }
.archive-grid .page-card { width: 100%; min-width: 0; }
.load-more { display: block; width: 100%; margin: 20px 0; }
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }


/* Shared settings sheets and controls. */
.bottom-sheet-layer .sheet { max-height: 88dvh; }
.tag-label-input, .setting-theme button, .segments button { min-height: 44px; }
.tag-edit-row button { min-width: 44px; }
.font-upload { border-bottom: 1px solid var(--line); }
.font-upload:last-child { border-bottom: 0; }
.font-upload .setting { border-bottom: 0; }
.font-upload > .text-btn { margin: 0 16px 8px; }
.settings-screen > .toast { position: fixed; z-index: 12; bottom: calc(96px + env(safe-area-inset-bottom)); max-width: 488px; margin: 0 auto; }
.mini-badge .icon { width: 19px; height: 19px; }
.dad-writing { font-family: var(--dad-font, Gaegu), cursive; }
.mom-writing { font-family: var(--mom-font, Gaegu), cursive; }

.sync-banner {
  position: fixed;
  z-index: 1000;
  top: env(safe-area-inset-top, 0px);
  left: 0;
  right: 0;
  padding: 12px 16px;
  background: #fff4b8;
  color: #1e2326;
  display: flex;
  align-items: center;
  gap: 12px;
  word-break: keep-all;
}
.sync-banner button {
  flex-shrink: 0;
  min-height: 44px;
  padding: 8px 12px;
}

.family-settings {
  padding: 16px;
  display: grid;
  gap: 16px;
}
.family-settings > div {
  display: grid;
  gap: 8px;
}
.family-settings p {
  word-break: keep-all;
}
.family-link {
  display: block;
  width: 100%;
  min-height: 44px;
  padding: 8px;
  color: var(--text);
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 8px;
}

.archive-screen .segments { align-items: center; }
.archive-screen .segments button { min-height: 44px; padding-inline: 12px; white-space: nowrap; }
.archive-screen .archive-view-toggle { margin-left: auto; min-width: 44px; padding: 8px; flex: none; }
.archive-list { border: 1px solid var(--line); border-radius: 18px; overflow: hidden; background: var(--surface); }
.archive-list-row { display: block; width: 100%; min-height: 44px; padding: 14px; text-align: left; border-bottom: 1px solid var(--line); }
.archive-list-row:last-child { border-bottom: 0; }
.archive-list-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--sub); }
.archive-list-meta strong { color: var(--text); }
.list-badge { margin-left: auto; }
.list-badge .icon { width: 15px; height: 15px; }
.archive-list-text { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; margin-top: 6px; font-size: 14px; line-height: 1.6; word-break: keep-all; overflow-wrap: anywhere; white-space: pre-wrap; }

html, body, #root { max-width: 100%; overflow-x: hidden; }
button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }

@media (min-width: 768px) {
  .app-shell:not(.home-shell) { max-width: none; padding-bottom: 96px; }
  .screen-scroll { width: 100%; max-width: 1040px; margin-inline: auto; padding-inline: 32px; }
  .archive-screen .archive-list { max-width: 720px; margin-inline: auto; }
  .archive-screen .archive-month { margin-inline: 0; }
  .archive-grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
  .archive-screen:has(.archive-list) { max-width: 784px; }
  .calendar-screen { max-width: 784px; }
  .settings-screen { max-width: 704px; }
  .settings-screen .settings-group { margin-bottom: 28px; }
  .settings-screen > .toast { left: 50%; right: auto; width: min(488px, calc(100% - 32px)); transform: translate(-50%, 20px); }
  .settings-screen > .toast.show { transform: translate(-50%, 0); }
  .bottom-sheet-layer { align-items: center; justify-content: center; }
  .bottom-sheet-layer .sheet { position: relative; width: min(480px, calc(100% - 32px)); max-height: min(88dvh, 760px); border-radius: 24px; padding-bottom: 24px; transform: translateY(16px) scale(.98); transition: transform .2s var(--ease); }
  .bottom-sheet-layer.sheet-open .sheet { transform: none; }
  .bottom-sheet-layer .sheet-handle { display: none; }
  .bottom-sheet-layer .scrim { position: fixed; }
  .bottom-sheet-layer .sheet-head { padding-top: 2px; }
  .tabbar { left: 50%; right: auto; width: min(520px, 100%); transform: translateX(-50%); border-inline: 1px solid var(--line); border-radius: 18px 18px 0 0; }
}

@media (min-width: 1100px) {
  .archive-screen:not(:has(.archive-list)) { max-width: 1104px; }
  .archive-screen:has(.archive-list) { max-width: 784px; }
}
/* Calendar: recorded colors remain visible through today/selection rings. */
.calendar-screen .month-grid,
.calendar-screen .weekdays {
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 4px;
}
.calendar-screen .day {
  height: 48px;
  min-height: 44px;
  padding: 3px;
  border-radius: 12px;
}
.calendar-screen .day-tile {
  position: relative;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border-radius: 9px;
  overflow: hidden;
  font-variant-numeric: tabular-nums;
}
.calendar-screen .day-fill-segment {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
}
.calendar-screen .day.outside .day-tile { opacity: 0.45; }
.calendar-screen .day.today { box-shadow: inset 0 0 0 1px var(--sub); }
.calendar-screen .day.selected { box-shadow: inset 0 0 0 3px var(--text); }
.calendar-screen .day.today.selected { outline: 1px dashed var(--sub); outline-offset: 1px; }
.calendar-screen .day:focus-visible { outline: 2px solid var(--text); outline-offset: 2px; }
.calendar-screen .legend { margin: 12px 0 20px; flex-wrap: nowrap; }
.calendar-screen .legend span { white-space: nowrap; }
.calendar-screen .legend .dot { width: 10px; height: 10px; border-radius: 3px; }
.calendar-screen .day-preview { padding: 0; border: 0; background: transparent; }
.calendar-screen .day-preview-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.calendar-screen .day-preview-heading h2 { margin: 0; word-break: keep-all; }
.archive-view-toggle { min-width: 44px; min-height: 44px; padding: 8px; border-radius: 24px; color: var(--sub); }
.archive-view-toggle[aria-pressed='true'] { background: var(--primary); color: var(--on-primary); }
.calendar-screen .calendar-empty-row { color: var(--sub); word-break: keep-all; }
.archive-list-meta { word-break: keep-all; }
@media (min-width: 768px) {
  .calendar-screen { max-width: 784px; }
}
import type { DataStore } from '../../data/DataStore';
import type { StoreSnapshot } from '../../data/types';
import { PageCard } from '../archive/PageCard';
import { ArchiveListRow } from '../archive/ArchiveListRow';
import { ArchiveViewToggle, useArchiveView } from '../archive/archiveView';
import { fromKey } from '../../lib/date';

type Props = {
  store: DataStore;
  snapshot: StoreSnapshot;
  date: string;
  openPage: (date: string, childId: string, authorId?: 'dad' | 'mom') => void;
};

export function DayPreview({ store, snapshot, date, openPage }: Props) {
  const [list, toggleView] = useArchiveView(store.getCurrentMemberId());
  const selected = fromKey(date);
  return (
    <div className="day-preview">
      <div className="day-preview-heading">
        <h2>
          <time dateTime={date}>
            {selected.getMonth() + 1}월 {selected.getDate()}일{' '}
            {'일월화수목금토'[selected.getDay()]}
          </time>
        </h2>
        <ArchiveViewToggle list={list} onToggle={toggleView} />
      </div>
      <div className={list ? 'archive-list' : 'preview-kids'}>
        {snapshot.children.flatMap((child) => {
          const pages = snapshot.pages.filter(
            (page) => page.date === date && page.childId === child.id,
          );
          return (pages.length ? pages : [undefined]).map((page) => {
            if (!list) {
              return (
                <PageCard
                  store={store}
                  key={page?.id ?? child.id}
                  child={child}
                  page={page}
                  onClick={() => openPage(date, child.id, page?.authorId)}
                />
              );
            }
            return page ? (
              <ArchiveListRow
                key={page.id}
                page={page}
                child={child}
                showDate={false}
                onClick={() => openPage(date, child.id, page.authorId)}
              />
            ) : (
              <button
                type="button"
                key={child.id}
                className="archive-list-row calendar-empty-row"
                onClick={() => openPage(date, child.id)}
              >
                ＋ {child.name} 기록하기
              </button>
            );
          });
        })}
      </div>
      {!snapshot.pages.some((page) => page.date === date) && (
        <p className="empty-results">이 날의 기록을 남겨보세요.</p>
      )}
    </div>
  );
}
import { useSyncExternalStore } from 'react';
import { Icon } from '../../components/Icon';

const listeners = new Set<() => void>();
const fallback = new Map<string, boolean>();

export function readArchiveList(memberId: string): boolean {
  if (fallback.has(memberId)) return fallback.get(memberId)!;
  try {
    return localStorage.getItem(`archive-view:${memberId}`) !== 'cards';
  } catch {
    return fallback.get(memberId) ?? true;
  }
}

export function writeArchiveList(memberId: string, list: boolean) {
  try {
    localStorage.setItem(`archive-view:${memberId}`, list ? 'list' : 'cards');
    fallback.delete(memberId);
  } catch {
    // Keep switching available when browser storage is blocked.
    fallback.set(memberId, list);
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
}

export function useArchiveView(memberId: string) {
  const list = useSyncExternalStore(
    subscribe,
    () => readArchiveList(memberId),
    () => true,
  );
  return [list, () => writeArchiveList(memberId, !list)] as const;
}

export function ArchiveViewToggle({
  list,
  onToggle,
}: {
  list: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="archive-view-toggle"
      aria-label={list ? '카드로 보기' : '목록으로 보기'}
      aria-pressed={list}
      onClick={onToggle}
    >
      <Icon name={list ? 'cards' : 'list'} />
    </button>
  );
}
export type ProfilePhoto = { id: string; src: string; createdAt: string };
export type SyncState = 'ok' | 'saving' | 'retrying' | 'error';
export type Child = {
  id: string;
  name: string;
  nickname?: string;
  birthDate?: string;
  dueDate?: string;
  status?: 'born' | 'expecting';
  color: 'kid1' | 'kid2';
  pageColor: string;
  sortOrder: number;
  photo?: ProfilePhoto;
  photoHistory: ProfilePhoto[];
};

export type Member = {
  // Writer identity is dad/mom in every backend; Auth device IDs stay separate.
  id: string;
  displayName: string;
  color: 'dad' | 'mom';
  fontAssetId?: string;
  role?: 'writer' | 'reader';
};

export type TagTone =
  | 'vax'
  | 'fever'
  | 'hosp'
  | 'first'
  | 'growth'
  | 'food'
  | 'sleep'
  | 'med'
  | 'prenatal';
export type Tag = {
  id: string;
  label: string;
  emoji: string;
  tone: TagTone;
  sortOrder: number;
  preset: boolean;
  hidden?: boolean;
};

export type Stroke = {
  color: string;
  width: 2 | 5 | 8 | 14 | 28;
  /** Normalized x/y pairs, rounded to three decimals. */
  points: number[];
};

export type Photo = {
  id: string;
  src: string;
  x: number;
  y: number;
  w: number;
  rotation: number;
};

export type Note = {
  id: string;
  authorId: 'dad' | 'mom';
  text: string;
  createdAt: string;
  updatedAt: string;
};

export type Page = {
  id: string;
  childId: string;
  date: string;
  authorId: 'dad' | 'mom';
  color?: string;
  drawing: Stroke[];
  photos: Photo[];
  text: string;
  tagIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type PageSummary = Pick<
  Page,
  'id' | 'date' | 'childId' | 'authorId' | 'color' | 'tagIds' | 'updatedAt'
> & {
  firstLine: string;
  hasDrawing: boolean;
  photoCount: number;
  deletedAt?: string | null;
};

export type PageRange = { startDate?: string; endDate?: string };
export type Comment = {
  id: string;
  pageId: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
};
export type Reaction = { pageId: string; memberId: string; emoji: '❤️' };
export type StoreSnapshot = {
  children: Child[];
  members: Member[];
  tags: Tag[];
  pages: Page[];
  comments: Comment[];
  reactions: Reaction[];
};

  create table public.family_members (
    user_id uuid primary key references auth.users on delete cascade,
    family_id uuid not null references public.families on delete cascade,
>   member_id text not null check (member_id in ('dad', 'mom', 'reader')),
>   role text not null check (role in ('owner', 'writer', 'reader')),
    joined_at timestamptz not null default now(),
>   check ((member_id = 'reader') = (role = 'reader'))
  );
  create index on public.family_members (family_id);
  create table public.invites (
    id uuid primary key default gen_random_uuid(),
    family_id uuid not null references public.families on delete cascade,
>   member_id text not null check (member_id in ('dad', 'mom', 'reader')),
>   role text not null check (role in ('owner', 'writer', 'reader')),
>   token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
    created_by uuid references auth.users on delete set null,
    created_at timestamptz not null default now(),
    revoked_at timestamptz,
>   check ((member_id = 'reader') = (role = 'reader'))
  );
  create index on public.invites (family_id, member_id);
  create table public.join_attempts (
    id bigint generated always as identity primary key,
    user_id uuid not null references auth.users on delete cascade,
    attempted_at timestamptz not null default now()
  );
  create function public.family_access(p_family_id uuid, p_write boolean default false)
  returns boolean language sql stable security definer set search_path = '' as $$
    select exists (select 1 from public.family_members
>     where user_id = auth.uid() and family_id = p_family_id
        and (not p_write or role in ('owner', 'writer')));
  $$;
  
  create table public.children (
    family_id uuid not null references public.families on delete cascade,
    id text not null,
    name text not null,
    nickname text,
    birth_date date,
    due_date date,
>   status text not null default 'expecting' check (status in ('born', 'expecting')),
>   color text not null check (color in ('kid1', 'kid2')),
    page_color text not null,
    sort_order integer not null default 0,
    photo jsonb,
    photo_history jsonb not null default '[]',
    primary key (family_id, id)
  );
  create table public.tags (
  );
  create table public.members (
    family_id uuid not null references public.families on delete cascade,
>   member_id text not null check (member_id in ('dad', 'mom')),
    display_name text not null,
>   color text not null check (color in ('dad', 'mom')),
    font_asset_path text,
    primary key (family_id, member_id)
  );
> create table public.pages (
    id text primary key,
    family_id uuid not null references public.families on delete cascade,
    child_id text not null,
    date date not null,
>   author_id text not null check (author_id in ('dad', 'mom')),
    color text,
>   drawing jsonb not null default '[]' check (pg_column_size(drawing) < 200000),
    photos jsonb not null default '[]',
    text text not null default '',
    tag_ids text[] not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
>   check (id = date::text || '__' || child_id || '__' || author_id),
    foreign key (family_id, child_id) references public.children (family_id, id),
    foreign key (family_id, author_id) references public.members (family_id, member_id),
    unique (family_id, id)
  );
  create index on public.pages (family_id, date);
  create table public.comments (
    family_id uuid not null references public.families on delete cascade,
    id text not null,
    page_id text not null,
    content text not null,
>   author_id text not null check (author_id in ('dad', 'mom')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    primary key (family_id, id),
    foreign key (family_id, page_id) references public.pages (family_id, id) on delete cascade,
    foreign key (family_id, author_id) references public.members (family_id, member_id)
  );
  create table public.reactions (
    family_id uuid not null references public.families on delete cascade,
    page_id text not null,
>   member_id text not null check (member_id in ('dad', 'mom')),
>   emoji text not null default '❤️' check (emoji = '❤️'),
    primary key (family_id, page_id, member_id),
    foreign key (family_id, page_id) references public.pages (family_id, id) on delete cascade,
    foreign key (family_id, member_id) references public.members (family_id, member_id)
  );
  
  alter table public.families enable row level security;
  alter table public.family_members enable row level security;
  create policy family_read on public.families for select to authenticated
    using (public.family_access(id));
  create policy membership_read on public.family_members for select to authenticated
>   using (user_id = auth.uid());
  -- No client may directly change enrollment, invites, attempts, or families.
  revoke all on public.families, public.family_members, public.invites, public.join_attempts from anon, authenticated;
  grant select on public.families, public.family_members to authenticated;
  do $$
  declare t text;
  begin
    foreach t in array array['children','tags','members','pages','comments','reactions'] loop
      execute format('revoke all on public.%I from anon, authenticated', t);
      execute format('grant select, insert, update, delete on public.%I to authenticated', t);
      execute format('create policy family_read on public.%I for select to authenticated using (public.family_access(fa
mily_id))', t);
>     execute format('create policy family_insert on public.%I for insert to authenticated with check (public.family_ac
cess(family_id, true))', t);
>     execute format('create policy family_update on public.%I for update to authenticated using (public.family_access(
family_id, true)) with check (public.family_access(family_id, true))', t);
      execute format('create policy family_delete on public.%I for delete to authenticated using (public.family_access(
family_id, true))', t);
      execute format('alter table public.%I replica identity full', t);
      execute format('alter publication supabase_realtime add table public.%I', t);
    end loop;
  end $$;
  
  -- NULL means invalid/rate-limited. Raising would roll back the failed-attempt log.
    if uid is null then raise exception 'not_granted'; end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text, 0));
    delete from public.join_attempts where attempted_at < now() - interval '1 hour';
>   if (select count(*) from public.join_attempts where user_id = uid) >= 20 then
      return null;
    end if;
    select * into invitation from public.invites
      where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
        and revoked_at is null for update;
    if invitation.id is null or p_token !~ '^[A-Za-z0-9_-]{43}$' then
      insert into public.join_attempts (user_id) values (uid);
      return null;
    end if;
    -- An enrolled device cannot use a weaker invite to overwrite its owner role.
>   if exists (select 1 from public.family_members where user_id = uid
>       and family_id = invitation.family_id and role = 'owner') then
      return invitation.family_id;
    end if;
    insert into public.family_members (user_id, family_id, member_id, role)
      values (uid, invitation.family_id, invitation.member_id, invitation.role)
>     on conflict (user_id) do update set family_id = excluded.family_id,
>       member_id = excluded.member_id, role = excluded.role, joined_at = now();
    return invitation.family_id;
  end $$;
  
  create function public.create_invite(p_member_id text, p_token_hash text) returns uuid
  language plpgsql security definer set search_path = '' as $$
  declare me public.family_members; result uuid;
  begin
>   select * into me from public.family_members where user_id = auth.uid();
    if me.role is distinct from 'owner' then raise exception 'not_granted'; end if;
    if p_member_id not in ('dad', 'mom', 'reader') then raise exception 'invalid member'; end if;
    insert into public.invites (family_id, member_id, role, token_hash, created_by)
      values (me.family_id, p_member_id,
>       case when p_member_id = 'reader' then 'reader' else 'writer' end,
        p_token_hash, auth.uid()) returning id into result;
    return result;
  end $$;
  
  create function public.revoke_invites(p_member_id text) returns void
  language plpgsql security definer set search_path = '' as $$
  declare me public.family_members;
  begin
>   select * into me from public.family_members where user_id = auth.uid();
    if me.role is distinct from 'owner' then raise exception 'not_granted'; end if;
    update public.invites set revoked_at = now()
>     where family_id = me.family_id and member_id = p_member_id and revoked_at is null;
>   delete from public.family_members where family_id = me.family_id
>     and member_id = p_member_id and user_id <> auth.uid();
  end $$;
  
  create function public.storage_usage() returns bigint
  language sql stable security definer set search_path = '' as $$
    select coalesce(sum((o.metadata->>'size')::bigint), 0)::bigint
    from storage.objects o join public.family_members m
>     on m.user_id = auth.uid() and split_part(o.name, '/', 1) = m.family_id::text
>   where o.bucket_id = 'photos';
  $$;
  
  -- Called by each backup. Remove old reader devices AND their anonymous Auth users.
  create function public.prune_reader_members() returns integer
  language plpgsql security definer set search_path = '' as $$
  declare fid uuid; removed integer;
  begin
>   select family_id into fid from public.family_members where user_id = auth.uid();
    if fid is null then raise exception 'not_granted'; end if;
    with old_readers as (
>     delete from public.family_members where family_id = fid and role = 'reader'
        and joined_at < now() - interval '2 days' and user_id <> auth.uid()
      returning user_id
    ) delete from auth.users where id in (select user_id from old_readers) and is_anonymous;
    get diagnostics removed = row_count;
    return removed;
  end $$;
  
  values ('photos', 'photos', false, 5242880,
    array['image/jpeg','image/png','image/webp','font/woff2','font/ttf']);
  create policy family_photo_read on storage.objects for select to authenticated
>   using (bucket_id = 'photos' and exists (select 1 from public.family_members
>     where user_id = auth.uid() and family_id::text = split_part(name, '/', 1)));
  create policy family_photo_insert on storage.objects for insert to authenticated
>   with check (bucket_id = 'photos' and exists (select 1 from public.family_members
>     where user_id = auth.uid() and role in ('owner','writer')
        and family_id::text = split_part(name, '/', 1)));
  create policy family_photo_delete on storage.objects for delete to authenticated
>   using (bucket_id = 'photos' and exists (select 1 from public.family_members
>     where user_id = auth.uid() and role in ('owner','writer')
        and family_id::text = split_part(name, '/', 1)));



codex
저장 직전 ID 검사와 날짜별 백업 파일명에도 한 장만 가정한 부분이 있었습니다. 추가 장이 거부되거나 덮어써지지 않도록 함께 수정하겠습니다. ArtifactStore는 본문을 늦게 불러오므로, 요약에도 생성 시각을 보관해 장 순서를 유지하겠습니다.

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Encoding UTF8 src/data/artifactStore.ts | Select-Object -First 170; Get-Content -Encoding UTF8 src/data/artifactStore.ts | Select-Object -Skip 470 -First 160; Get-Content -Encoding UTF8 src/data/localStore.ts | Select-Object -Skip 125 -First 110; Get-Content -Encoding UTF8 src/data/supabaseStore.ts | Select-Object -Skip 560 -First 100; Get-ChildItem src/styles -File | Select-String -Pattern 'input|textarea|select'; Get-Content -Encoding UTF8 src/data/artifactStore.test.ts,src/data/supabaseStore.test.ts,src/data/localStore.test.ts | Select-Object -First 230" in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
 succeeded in 568ms:
import { normalizePageColor } from '../lib/pageColors';
import { todayKey } from '../lib/date';
import { LegacyAdapter } from './legacyAdapter';
import { migrateMonthSnapshot, defaultChildStatus, defaultPageColor } from './migrate';
import { preparePage } from '../lib/stroke';
import { downscalePhoto, blobToDataUrl } from '../lib/image';
import type { DataStore } from './DataStore';
import { LocalStore } from './localStore';
import { externalizeSnapshot, hasInlinePhotos } from './importPhotos';
import type {
  Child,
  Comment,
  Page,
  PageRange,
  PageSummary,
  Member,
  Reaction,
  StoreSnapshot,
  SyncState,
  Tag,
} from './types';
export type ArtifactConfig = {
  children: Record<string, Child>;
  tags: Record<string, Tag>;
  members: { dad: Member; mom: Member };
  memberByUser: Record<string, 'dad' | 'mom'>;
};
type Body = Record<string, unknown>;
type Write = { path: string; patch: Body };
export type MonthDoc = {
  authorPagesV3?: boolean;
  pages: Record<string, PageSummary>;
  comments: Record<string, Comment & { deletedAt?: string | null }>;
  reactions: Record<string, Reaction & { on: boolean }>;
};
const emptyMonth = (): MonthDoc => ({ pages: {}, comments: {}, reactions: {} });
export function mergeDoc(base: Body, patch: Body): Body {
  const next = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    next[key] =
      value && typeof value === 'object' && !Array.isArray(value)
        ? mergeDoc((base[key] as Body) ?? {}, value as Body)
        : value;
  }
  return next;
}
function summarize(page: Page): PageSummary {
  return {
    id: page.id,
    date: page.date,
    childId: page.childId,
    authorId: page.authorId,
    color: page.color,
    firstLine: page.text.split('\n')[0].slice(0, 120),
    tagIds: page.tagIds,
    hasDrawing: page.drawing.length > 0,
    photoCount: page.photos.length,
    updatedAt: page.updatedAt,
    deletedAt: null,
  };
}
/** Summary projections serve old list screens. Editors and exports always load full pages. */
export function buildArtifactSnapshot(
  config: ArtifactConfig | null,
  months: Record<string, MonthDoc>,
  cache = new Map<string, Page>(),
): StoreSnapshot {
  const summaries = Object.values(months)
    .flatMap((doc) => Object.values(doc.pages ?? {}))
    .filter((page) => !page.deletedAt);
  const ids = new Set(summaries.map((page) => page.id));
  return {
    children: Object.values(config?.children ?? {})
      .map((child) => ({
        ...child,
        status: child.status ?? defaultChildStatus(child),
        photoHistory: child.photoHistory ?? [],
        pageColor: normalizePageColor(
          child.pageColor ?? defaultPageColor(child),
        ),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
    members: Object.values(config?.members ?? {}),
    tags: Object.values(config?.tags ?? {})
      .filter(Boolean)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    pages: summaries.map((summary) =>
      cache.has(summary.id)
        ? {
            ...cache.get(summary.id)!,
            color: cache.get(summary.id)!.color || undefined,
          }
        : {
            id: summary.id,
            date: summary.date,
            childId: summary.childId,
            authorId: summary.authorId,
            color: summary.color || undefined,
            text: summary.firstLine,
            tagIds: summary.tagIds,
            drawing: [],
            photos: [],
            createdAt: summary.updatedAt,
            updatedAt: summary.updatedAt,
          },
    ),
    comments: Object.values(months)
      .flatMap((doc) => Object.values(doc.comments ?? {}))
      .filter((item) => !item.deletedAt && ids.has(item.pageId))
      .map(({ deletedAt: _, ...comment }) => comment),
    reactions: Object.values(months)
      .flatMap((doc) => Object.values(doc.reactions ?? {}))
      .filter((item) => item.on && ids.has(item.pageId))
      .map(({ pageId, memberId, emoji }) => ({ pageId, memberId, emoji })),
  };
}
export class ArtifactStore extends LegacyAdapter implements DataStore {
  readonly viewerMapping = true;
  private config: ArtifactConfig | null = null;
  private viewConfig: ArtifactConfig | null = null;
  private months: Record<string, MonthDoc> = {};
  private cache = new Map<string, Page>();
  private loading = new Map<string, Promise<Page>>();
  private pending: Write[] = [];
  private listeners = new Set<() => void>();
  private stops: Unsubscribe[] = [];
  private snapshot = buildArtifactSnapshot(null, {});
  private canWrite: boolean;
  private flushing = false;
  private disposed = false;
  private indexLoaded = false;
  private timer?: ReturnType<typeof setTimeout>;
  private attempts = 0;
  syncState: SyncState = 'ok';
  errorMessage = '';
  static async create(
    claude: Claude | undefined = window.claude,
  ): Promise<DataStore> {
    if (!claude) return new LocalStore();
    const [db, user, assets] = await Promise.all([
      claude.use('db'),
      claude.use('user'),
      claude.use('assets'),
    ]);
    if (!db || !user) return new LocalStore();
    const [uid, allowed] = await Promise.all([
      user.id(),
      user.can('data.write'),
    ]);
    return new ArtifactStore(db, uid, allowed !== false, assets);
  }
  constructor(
    private db: DB,
    private uid: string | null,
    allowed = true,
    private assets: Claude.Assets | null = null,
  ) {
    super();
    this.canWrite = allowed && Boolean(uid);
    const error = (error: DbError) => this.fail(error);
    this.stops.push(
      db.doc('meta/config').onSnapshot((snap) => {
        if (snap.metadata.hasPendingWrites) return;
        this.config = snap.exists ? (snap.data() as ArtifactConfig) : null;
        this.emit();
        this.migrateMonths();
      }, error),
    );
    this.stops.push(
      db.collection('index').onSnapshot((snap) => {
    const optimistic = this.pending
      .filter((write) => write.path === 'pages/' + id)
      .slice(-1)[0];
    if (optimistic) return optimistic.patch as unknown as Page;
    const cached = this.cache.get(id);
    if (cached) return cached;
    if (!this.months[id.slice(0, 7)]?.pages[id]) {
      const legacy = this.snapshot.pages.find((page) => page.id === id);
      if (legacy) return legacy;
    }
    const existing = this.loading.get(id);
    if (existing) return existing;
    const request = this.db
      .doc('pages/' + id)
      .get()
      .then((snap) => {
        if (!snap.exists) throw new Error('페이지를 찾을 수 없어요.');
        const page = snap.data() as Page;
        this.cache.set(id, { ...page, color: page.color || undefined });
        this.emit();
        return this.cache.get(id)!;
      })
      .finally(() => this.loading.delete(id));
    this.loading.set(id, request);
    return request;
  }
  async loadAllPages(): Promise<void> {
    await Promise.all(
      this.snapshot.pages.map((page) => this.loadPage(page.id)),
    );
  }
  private monthWrite(
    month: string,
    field: keyof MonthDoc,
    id: string,
    value: object,
  ): Write {
    return { path: `index/${month}`, patch: { [field]: { [id]: value } } };
  }
  private pageMonth(pageId: string): string | undefined {
    return this.snapshot.pages
      .find((entry) => entry.id === pageId)
      ?.date.slice(0, 7);
  }
  private meta(field: string, id: string, value: unknown): void {
    this.write([{ path: 'meta/config', patch: { [field]: { [id]: value } } }]);
  }
  listChildren(): Child[] {
    return this.snapshot.children;
  }
  listMembers(): Member[] {
    return this.snapshot.members;
  }
  listTags(): Tag[] {
    return this.snapshot.tags;
  }
  listPages(range: PageRange = {}): Page[] {
    return this.snapshot.pages.filter(
      (page) =>
        (!range.startDate || page.date >= range.startDate) &&
        (!range.endDate || page.date <= range.endDate),
    );
  }
  getPage(
    date: string,
    childId: string,
    authorId = this.getCurrentMemberId() || 'dad',
  ): Page | undefined {
    const id = date + '__' + childId + '__' + authorId;
    if (
      this.cache.has(id) ||
      this.pending.some((write) => write.path === 'pages/' + id)
    ) {
      return this.snapshot.pages.find((page) => page.id === id);
    }
    if (!this.months[date.slice(0, 7)]?.pages[id])
      return this.snapshot.pages.find((page) => page.id === id);
    return undefined;
  }
  listComments(pageId?: string): Comment[] {
    if (pageId) pageId = this.pageId(pageId);
    return this.snapshot.comments.filter(
      (comment) => !pageId || comment.pageId === pageId,
    );
  }
  listReactions(pageId?: string): Reaction[] {
    if (pageId) pageId = this.pageId(pageId);
    return this.snapshot.reactions.filter(
      (reaction) => !pageId || reaction.pageId === pageId,
    );
  }
  savePage(page: Page): void {
    const value = preparePage(page);
    const existing = this.cache.get(value.id);
    if (existing && existing.authorId !== value.authorId)
      throw new Error('작성자는 바꿀 수 없어요.');
    if (value.photos.some((photo) => photo.src.startsWith('data:'))) {
      throw new Error('사진을 먼저 업로드한 뒤 저장해 주세요.');
    }
    this.queuePage(value);
  }
  private queuePage(value: Page): void {
    this.write(this.pageWrites(value));
  }
  private pageWrites(value: Page): Write[] {
    return [
      { path: 'pages/' + value.id, patch: value as unknown as Body },
      this.monthWrite(
        value.date.slice(0, 7),
        'pages',
        value.id,
        summarize(value),
      ),
    ];
  }
  private async externalize(page: Page): Promise<Page> {
    const photos = [];
    for (const photo of page.photos) {
      if (!photo.src.startsWith('data:')) {
        photos.push(photo);
        continue;
      }
      const blob = await (await fetch(photo.src)).blob();
      photos.push({ ...photo, src: (await this.uploadPhoto(blob)).src });
    }
    return preparePage({ ...page, photos });
  }
  deletePage(id: string): void {
    const entry = this.snapshot.pages.find((item) => item.id === id);
    if (!entry) return;
    const month = entry.date.slice(0, 7);
    const deletedAt = new Date().toISOString();
    this.write([
      this.monthWrite(month, 'pages', id, { ...summarize(entry), deletedAt }),
      ...this.listComments(id).map((comment) =>
        this.monthWrite(month, 'comments', comment.id, {
          ...comment,
          deletedAt,
        }),
      ),
      ...this.listReactions(id).map((reaction) =>
        this.monthWrite(month, 'reactions', `${id}__${reaction.memberId}`, {
          ...reaction,
          on: false,
        }),
      ),
    ]);
  }
  createComment(comment: Comment): void {
    comment = { ...comment, pageId: this.pageId(comment.pageId) };
    this.updateComment(comment);
  }
  updateComment(comment: Comment): void {
    const month = this.pageMonth(comment.pageId);
    if (month)
      this.write([
        this.monthWrite(month, 'comments', comment.id, {
          ...comment,
          deletedAt: null,
        }),
      this.syncState = 'retrying';
      this.errorMessage =
        '기기에 저장하지 못했어요. 변경 내용은 유지하고 다시 시도해요. ' +
        (error instanceof Error ? error.message : '저장 공간을 확인해 주세요.');
      if (!this.timer)
        this.timer = setTimeout(
          this.retry,
          Math.min(1000 * 2 ** this.attempts++, 30000),
        );
    }
  }

  private commit(next: StoreSnapshot): void {
    this.snapshot = next;
    this.persist();
    this.listeners.forEach((listener) => listener());
  }

  listChildren(): Child[] {
    return this.snapshot.children;
  }
  listMembers() {
    return this.snapshot.members;
  }
  listTags(): Tag[] {
    return this.snapshot.tags;
  }

  listPages(range: PageRange = {}): Page[] {
    return this.snapshot.pages.filter(
      (page) =>
        (!range.startDate || page.date >= range.startDate) &&
        (!range.endDate || page.date <= range.endDate),
    );
  }

  getPage(
    date: string,
    childId: string,
    authorId = this.getCurrentMemberId() || 'dad',
  ): Page | undefined {
    return this.snapshot.pages.find(
      (page) => page.id === date + '__' + childId + '__' + authorId,
    );
  }

  savePage(page: Page): void {
    if (page.photos.some((photo) => photo.src.startsWith('data:'))) {
      throw new Error('사진을 먼저 업로드한 뒤 저장해 주세요.');
    }
    this.commit({
      ...this.snapshot,
      pages: upsert(this.snapshot.pages, preparePage(page)),
    });
  }

  deletePage(id: string): void {
    this.commit({
      ...this.snapshot,
      pages: this.snapshot.pages.filter((item) => item.id !== id),
      comments: this.snapshot.comments.filter((item) => item.pageId !== id),
      reactions: this.snapshot.reactions.filter((item) => item.pageId !== id),
    });
  }

  setAllPageColors(color: string, childId?: string): void {
    const updatedAt = new Date().toISOString();
    this.commit({
      ...this.snapshot,
      pages: this.snapshot.pages.map((page) =>
        !childId || page.childId === childId
          ? { ...page, color, updatedAt }
          : page,
      ),
      children: this.snapshot.children.map((child) =>
        !childId || child.id === childId
          ? { ...child, pageColor: color }
          : child,
      ),
    });
  }

  async uploadPhoto(blob: Blob): Promise<{ src: string }> {
    return { src: await putPhoto(await downscalePhoto(blob)) };
  }

  async resolvePhotoSrc(src: string): Promise<string> {
    return src.startsWith('idb-photo:')
      ? blobToDataUrl(await readPhoto(src))
      : src;
  }
  protected async removePhotoAsset(src: string): Promise<void> {
    if (this.syncState !== 'ok')
      throw new Error('사진 목록을 저장한 뒤 삭제를 다시 시도해 주세요.');
    await removePhoto(src);
  }
  private async migratePhotos(): Promise<void> {
    const convert = async (src: string) =>
      src.startsWith('data:') ? putPhoto(await (await fetch(src)).blob()) : src;
    for (const page of this.snapshot.pages) {
      if (!page.photos.some((photo) => photo.src.startsWith('data:'))) continue;
      const photos = await Promise.all(
        page.photos.map(async (photo) => ({
          ...photo,
          src: await convert(photo.src),
        })),
      );
      this.snapshot = {
        ...this.snapshot,
        pages: this.snapshot.pages.map((item) =>
      if (generation === this.generation) {
        this.setStatus({
          message:
            '저장 대기 중이에요. ' + this.reason(error),
        });
      }
    } finally {
      this.flushing = false;
      if (generation !== this.generation || (!failed && this.outbox.length > 0))
        void this.flush();
    }
  }

  listChildren(): Child[] {
    return this.snapshot.children;
  }

  listMembers(): Member[] {
    return this.snapshot.members;
  }

  listTags(): Tag[] {
    return this.snapshot.tags;
  }

  listPages(range: PageRange = {}): Page[] {
    return this.snapshot.pages.filter(
      (page) =>
        (!range.startDate || page.date >= range.startDate) &&
        (!range.endDate || page.date <= range.endDate),
    );
  }
  getPage(
    date: string,
    childId: string,
    authorId = this.membership?.member_id === 'mom' ? 'mom' : 'dad',
  ): Page | undefined {
    return this.snapshot.pages.find(
      (page) => page.id === date + '__' + childId + '__' + authorId,
    );
  }
  savePage(page: Page): void {
    if (page.photos.some((photo) => photo.src.startsWith('data:')))
      throw new Error('사진을 먼저 업로드한 뒤 저장해 주세요.');
    this.enqueue([{ kind: 'entry', entry: preparePage(page) }]);
  }
  deletePage(id: string): void {
    this.enqueue([{ kind: 'delete', table: 'pages', key: { id } }]);
  }
  setAllPageColors(color: string, childId?: string): void {
    const updatedAt = new Date().toISOString();
    this.enqueue([
      ...this.snapshot.pages
        .filter((page) => !childId || page.childId === childId)
        .map((page) => ({
          kind: 'entry' as const,
          entry: { ...page, color, updatedAt },
        })),
      ...this.snapshot.children
        .filter((child) => !childId || child.id === childId)
        .map((child) => ({
          kind: 'upsert' as const,
          table: 'children' as const,
          row: toRow({ ...child, pageColor: color }),
        })),
    ]);
  }
  deleteTag(id: string): void {
    this.enqueue([
      ...this.snapshot.pages
        .filter((page) => page.tagIds.includes(id))
        .map((page) => ({
          kind: 'entry' as const,
          entry: {
            ...page,
            tagIds: page.tagIds.filter((tagId) => tagId !== id),
          },
        })),
      { kind: 'delete', table: 'tags', key: { id } },
    ]);
  }
  async uploadPhoto(blob: Blob): Promise<{ src: string }> {
    if (!this.status.canWrite) throw new Error('작성자 권한이 필요해요.');
    const path = this.membership!.family_id + '/' + crypto.randomUUID() + '.jpg';
    const { error } = await this.client.storage
      .from('photos')
      .upload(path, await downscalePhoto(blob), { contentType: 'image/jpeg' });
    if (error) throw error;
    // Signed URLs remain private. resolvePhotoSrc renews them per view.
    return { src: 'supabase-photo:' + path };
  }
  async resolvePhotoSrc(src: string): Promise<string> {
    const marker = '/storage/v1/object/sign/photos/';
    const index = src.indexOf(marker);
    if (index < 0 && !src.startsWith('supabase-photo:')) return src;
    const path = src.startsWith('supabase-photo:')
      ? src.slice(15)
      : decodeURIComponent(src.slice(index + marker.length).split('?')[0]);
    const cached = this.assetUrls.get(path);
    if (cached && cached.expires > Date.now()) return cached.url;

src\styles\app.css:43:.date-input { position: fixed; width: 1px; height: 1px; opacity: 0; pointer-events: none; }
src\styles\app.css:83:.field textarea { flex: 1; resize: none; border: 0; outline: 0; background: transparent; font: in
herit; color: var(--text); padding: 9px 0; min-height: 40px; max-height: 120px; line-height: 22px; }
src\styles\app.css:84:.field textarea::placeholder { color: var(--sub); }
src\styles\app.css:161:.sheet-form input, .tag-add input, .tag-add select { min-height: 44px; border: 1px solid var(--l
ine); border-radius: 12px; padding: 0 12px; background: var(--field); color: var(--text); font: inherit; }
src\styles\app.css:167:.tag-label-input { min-width: 0; flex: 1; min-height: 40px; border: 1px solid var(--line); borde
r-radius: 10px; padding: 0 8px; background: var(--field); color: var(--text); font: inherit; }
src\styles\app.css:170:.tag-add select { grid-column: 1 / -1; }
src\styles\app.css:231:.filter-search input {
src\styles\app.css:311:.search input { width: 100%; height: 46px; border: 0; outline: 0; background: none; color: var(-
-text); }
src\styles\app.css:340:.day.selected:not(.today) .day-num { outline: 1px solid var(--sub); }
src\styles\app.css:356:.setting input[type="file"] { max-width: 120px; font-size: 11px; }
src\styles\app.css:391:.tag-label-input, .setting-theme button, .segments button { min-height: 44px; }
src\styles\app.css:458:button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outlin
e: 2px solid currentColor; outline-offset: 3px; }
src\styles\app.css:485:/* Calendar: recorded colors remain visible through today/selection rings. */
src\styles\app.css:515:.calendar-screen .day.selected { box-shadow: inset 0 0 0 3px var(--text); }
src\styles\app.css:516:.calendar-screen .day.today.selected { outline: 1px dashed var(--sub); outline-offset: 1px; }
src\styles\book.css:12:.book-form input,
src\styles\book.css:13:.book-form select {
src\styles\home.css:401:.crop-zoom input {
src\styles\home.css:625:  user-select: none;
src\styles\page.css:33:.diary input:focus-visible,
src\styles\page.css:34:.diary textarea:focus-visible {
src\styles\page.css:192:  user-select: none;
src\styles\page.css:261:.diary textarea::placeholder,
src\styles\page.css:262:.diary input::placeholder {
src\styles\page.css:445:.comment-form input {
import { afterEach, expect, it, vi } from 'vitest';
import { ArtifactStore } from './artifactStore';
import { FakeDb, config, page, settle } from './testDb';
import * as images from '../lib/image';

afterEach(() => vi.restoreAllMocks());
it('writes one full body per page and small index summaries with no media bytes', async () => {
  const db = new FakeDb();
  const store = new ArtifactStore(db, 'viewer');
  store.savePage({
    ...page(),
    drawing: [{ color: 'ink', width: 2, points: [0, 0, 1, 1] }],
  });
  store.savePage(page('2026-10-27'));
  await settle();
  expect(db.bodies.get('pages/' + page().id)).toHaveProperty('drawing');
  expect(db.bodies.get('index/2026-10')).toMatchObject({
    pages: { [page().id]: { hasDrawing: true, firstLine: '오늘 기록' } },
  });
  expect(JSON.stringify(db.bodies.get('index/2026-10'))).not.toContain(
    'points',
  );
  expect(db.writes.some((write) => write.path.startsWith('months/'))).toBe(
    false,
  );
  store.dispose();
});
it('loads a full old-month body on demand and exports only after all pages load', async () => {
  const db = new FakeDb();
  const value = page('2020-01-01');
  db.bodies.set(
    'pages/' + value.id,
    value as unknown as Record<string, unknown>,
  );
  db.bodies.set('index/2020-01', {
    pages: {
      [value.id]: {
        ...value,
        text: undefined,
        drawing: undefined,
        photos: undefined,
        firstLine: '요약',
        hasDrawing: false,
        photoCount: 0,
      },
    },
    comments: {},
    reactions: {},
  });
  const store = new ArtifactStore(db, 'viewer');
  expect(store.getPage(value.date, value.childId)).toBeUndefined();
  expect(() => store.exportAll()).toThrow();
  expect(await store.loadPage(value.id)).toMatchObject({ text: value.text });
  await store.loadAllPages();
  expect(store.exportAll().pages[0].text).toBe(value.text);
  store.dispose();
});
it('persists independent child settings even while one page keeps failing', async () => {
  vi.useFakeTimers();
  const db = new FakeDb();
  db.failPaths.set('pages/' + page().id, 'invalid_argument');
  const store = new ArtifactStore(db, 'viewer');
  store.savePage(page());
  await settle();
  store.updateChild({ ...store.listChildren()[0], pageColor: '#F9F0C8' });
  await vi.advanceTimersByTimeAsync(1000);
  await settle();
  expect(db.bodies.get('meta/config')).toMatchObject({
    children: { kid1: { pageColor: '#F9F0C8' } },
  });
  expect(store.listPages()[0].text).toBe('오늘 기록');
  expect(store.syncState).toBe('retrying');
  expect(store.readOnly).toBe(false);
  db.failPaths.clear();
  store.retry();
  await settle();
  expect(store.syncState).toBe('ok');
  store.dispose();
  vi.useRealTimers();
});
it('migrates sources only once and marks complete after destination writes', async () => {
  const db = new FakeDb();
  const old = {
    ...page(),
    id: '2026-10-26__kid1',
    authorId: undefined,
    text: undefined,
    notes: [
      {
        id: 'a',
        authorId: 'mom',
        text: '엄마 기록',
        createdAt: '1',
        updatedAt: '1',
      },
      {
        id: 'b',
        authorId: 'dad',
        text: '아빠 기록',
        createdAt: '2',
        updatedAt: '2',
      },
    ],
  };
  db.bodies.set('months/2026-10', {
    pages: { [old.id]: old },
    comments: {},
    reactions: {},
  });
  const store = new ArtifactStore(db, 'viewer');
  await settle();
  expect(db.bodies.get('months/2026-10')).toMatchObject({
    pages: { [old.id]: old },
  });
  expect(db.bodies.get('index/2026-10')).toHaveProperty('authorPagesV3', true);
  expect(db.writes.at(-1)?.patch).toEqual({ authorPagesV3: true });
  expect(store.listPages()).toHaveLength(2);
  store.dispose();
  db.writes = [];
  const next = new ArtifactStore(db, 'viewer');
  await settle();
  expect(db.writes).toEqual([]);
  next.dispose();
});
it('keeps source and omits completion marker when a destination write fails', async () => {
  vi.useFakeTimers();
  const db = new FakeDb();
  db.bodies.set('months/2026-10', {
    entries: {
      old: {
        id: 'old',
        date: page().date,
        childId: 'kid1',
        authorId: 'dad',
        content: '기록',
        tagIds: [],
        createdAt: '1',
        updatedAt: '1',
      },
    },
  });
  db.failNext = true;
  const store = new ArtifactStore(db, 'viewer');
  await settle();
  expect(db.bodies.get('index/2026-10') ?? {}).not.toHaveProperty(
    'authorPagesV3',
  );
  expect(db.bodies.get('months/2026-10')).toHaveProperty('entries');
  store.retry();
  await settle();
  expect(db.bodies.get('index/2026-10')).toHaveProperty('authorPagesV3', true);
  store.dispose();
  vi.useRealTimers();
});
it.each([
  'revoked',
  'not_granted',
  'invalid_argument',
  'quota_exceeded',
  'capability_disabled',
])('disables writing only for permission revocation: %s', async (code) => {
  vi.useFakeTimers();
  const db = new FakeDb();
  db.failNext = true;
  db.failureCode = code;
  const store = new ArtifactStore(db, 'viewer');
  store.savePage(page());
  await settle();
  expect(store.readOnly).toBe(['revoked', 'not_granted'].includes(code));
  expect(store.listPages()).toHaveLength(1);
  store.dispose();
  vi.useRealTimers();
});
it('uploads through assets, retains unlimited history, swaps history and deletes only the selected unused asset', async () => {
  const db = new FakeDb();
  let index = 0;
  const upload = vi.fn(async () => ({ id: 'asset' + ++index, url: '/photo' }));
  const remove = vi.fn(async () => ({ deleted: true }));
  vi.spyOn(images, 'downscalePhoto').mockImplementation(async (blob) => blob);
  const store = new ArtifactStore(db, 'viewer', true, {
    upload,
    delete: remove,
  } as unknown as Claude.Assets);
  for (let i = 0; i < 8; i++)
    await store.setChildPhoto('kid1', new Blob(['photo']));
  await settle();
  expect(store.listChildren()[0].photoHistory).toHaveLength(7);
  const child = store.listChildren()[0];
  const previous = child.photoHistory[0];
  store.useHistoryPhoto(child.id, previous.id);
  expect(store.listChildren()[0].photo?.id).toBe(previous.id);
  expect(store.listChildren()[0].photoHistory).toHaveLength(7);
  const removed = store.listChildren()[0].photoHistory[0];
  await store.deleteHistoryPhoto(child.id, removed.id);
  expect(remove).toHaveBeenCalledWith(removed.src);
  expect(store.listChildren()[0].photoHistory).toHaveLength(6);
  expect(store.listChildren()[1]).toEqual({
    ...config().children.kid2,
    status: 'expecting',
  });
  store.dispose();
});
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseStore } from './supabaseStore';
import type { Page } from './types';
type Row = Record<string, unknown>;
const user1 = 'device-dad';
const user2 = 'device-mom';
const familyId = 'family-one';
const page: Page = {
  id: '2026-10-26__kid1__dad', childId: 'kid1', date: '2026-10-26',
  text: '첫 걸음', tagIds: ['first'], authorId: 'dad', drawing: [], photos: [],
  createdAt: '2026-10-26T00:00:00Z', updatedAt: '2026-10-26T00:00:00Z',
};
function fakeServer(role = 'writer') {
  let userId = user1;
  const rows: Record<string, Row[]> = {
    family_members: [{ user_id: user1, family_id: familyId, member_id: role === 'reader' ? 'reader' : 'dad', role }],
    children: [], tags: [], pages: [], comments: [], reactions: [],
    members: [{ family_id: familyId, member_id: 'dad', display_name: '아빠', color: 'dad' },
      { family_id: familyId, member_id: 'mom', display_name: '엄마', color: 'mom' }],
  };
  let authChanged: (event: string, session: unknown) => void = () => { };
  const callbacks = new Map<string, (payload: unknown) => void>();
  const channel = {
    on: vi.fn((_event, filter, callback) => { callbacks.set(filter.table, callback); return channel; }),
    subscribe: vi.fn(() => channel),
  };
  const upsert = vi.fn(async (table: string, row: Row) => {



apply patch
patch: completed
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\DataStore.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\legacyAdapter.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\types.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\exportFormat.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\pageId.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\stroke.ts
diff --git a/src/data/DataStore.ts b/src/data/DataStore.ts
index f971f02a5dfebfb3d80078f7b9969496a9c389f5..7a060f742f390c8bc42505056d4e66e94fd40b12
--- a/src/data/DataStore.ts
+++ b/src/data/DataStore.ts
@@ -26,6 +26,7 @@
   listMembers(): Member[];
   listTags(): Tag[];
   listPages(range?: PageRange): Page[];
+  getPageById(id: string): Page | undefined;
   getPage(
     date: string,
     childId: string,
diff --git a/src/data/legacyAdapter.ts b/src/data/legacyAdapter.ts
index 4d7ce7f39a0ad9354ba0eeffdc3ef38daa6b4fb9..2709be0fd351ca154fa2f3dee184eeaac556332b
--- a/src/data/legacyAdapter.ts
+++ b/src/data/legacyAdapter.ts
@@ -1,6 +1,7 @@
 import type { DataStore } from './DataStore';
 import type { Child, Page, StoreSnapshot } from './types';
 import { noteAuthor } from './migrate';
+import { basePageId, isValidPageId } from '../lib/pageId';
 
 export type LegacyEntry = {
   id: string;
@@ -34,6 +35,9 @@
   abstract updateChild(child: Child): void;
   abstract uploadPhoto(blob: Blob): Promise<{ src: string }>;
   protected async removePhotoAsset(_src: string): Promise<void> {}
+  getPageById(id: string): Page | undefined {
+    return this.getSnapshot().pages.find((page) => page.id === id);
+  }
   async loadPage(id: string): Promise<Page> {
     const page = this.getSnapshot().pages.find((item) => item.id === id);
     if (!page) throw new Error('페이지를 찾을 수 없어요.');
@@ -111,7 +115,9 @@
   updateEntry(entry: LegacyEntry): void {
     const data = this.getSnapshot();
     const authorId = noteAuthor(entry.authorId, data.members);
-    const id = entry.date + '__' + entry.childId + '__' + authorId;
+    const id = isValidPageId({ ...entry, authorId })
+      ? entry.id
+      : basePageId(entry.date, entry.childId, authorId);
     const page = data.pages.find((item) => item.id === id);
     this.savePage({
       ...page,
diff --git a/src/data/types.ts b/src/data/types.ts
index a565623240c4c75b5494dac7f23863356708bebe..896b815d2be90a47dea69f388e141a7902d88765
--- a/src/data/types.ts
+++ b/src/data/types.ts
@@ -85,6 +85,7 @@
   Page,
   'id' | 'date' | 'childId' | 'authorId' | 'color' | 'tagIds' | 'updatedAt'
 > & {
+  createdAt?: string;
   firstLine: string;
   hasDrawing: boolean;
   photoCount: number;
diff --git a/src/lib/exportFormat.ts b/src/lib/exportFormat.ts
index 580b521cd97b9d598c2ba3343e908b435c7d6d18..310d396f34f82a3714de28d1724f30f26f633646
--- a/src/lib/exportFormat.ts
+++ b/src/lib/exportFormat.ts
@@ -1,5 +1,6 @@
 import { migrateSnapshot, type LegacySnapshot } from '../data/migrate';
 import type { StoreSnapshot } from '../data/types';
+import { isValidPageId } from './pageId';
 
 export type BackupJson = StoreSnapshot & { version: 3; exportedAt: string };
 
@@ -71,8 +72,7 @@
     data.version === 3 &&
     snapshot.pages.some(
       (page) =>
-        !['dad', 'mom'].includes(page.authorId) ||
-        page.id !== page.date + '__' + page.childId + '__' + page.authorId ||
+        !isValidPageId(page) ||
         typeof page.text !== 'string',
     )
   )
diff --git a/src/lib/pageId.ts b/src/lib/pageId.ts
new file mode 100644
index 0000000000000000000000000000000000000000..96522fdd7bfe8b4306dc4b51be31b25d671fba54
--- /dev/null
+++ b/src/lib/pageId.ts
@@ -0,0 +1,63 @@
+import type { Page } from '../data/types';
+
+export function basePageId(
+  date: string,
+  childId: string,
+  authorId: Page['authorId'],
+): string {
+  return `${date}__${childId}__${authorId}`;
+}
+
+export function newSheetId(
+  date: string,
+  childId: string,
+  authorId: Page['authorId'],
+): string {
+  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
+  let suffix = '';
+  // Rejection sampling keeps all 36 characters equally likely.
+  while (suffix.length < 8) {
+    for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
+      if (byte < 252 && suffix.length < 8) suffix += alphabet[byte % 36];
+    }
+  }
+  return `${basePageId(date, childId, authorId)}__${suffix}`;
+}
+
+export function isValidPageId(
+  page: Pick<Page, 'id' | 'date' | 'childId' | 'authorId'>,
+): boolean {
+  if (
+    typeof page.id !== 'string' ||
+    !/^\d{4}-\d{2}-\d{2}$/.test(page.date) ||
+    typeof page.childId !== 'string' ||
+    !page.childId ||
+    !['dad', 'mom'].includes(page.authorId)
+  )
+    return false;
+  const base = basePageId(page.date, page.childId, page.authorId);
+  return (
+    page.id === base ||
+    (page.id.startsWith(base + '__') &&
+      /^[a-z0-9]{8}$/.test(page.id.slice(base.length + 2)))
+  );
+}
+
+export function sheetsFor(
+  pages: Page[],
+  date: string,
+  childId: string,
+  authorId: string,
+): Page[] {
+  return pages
+    .filter(
+      (page) =>
+        page.date === date &&
+        page.childId === childId &&
+        page.authorId === authorId,
+    )
+    .sort(
+      (a, b) =>
+        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
+    );
+}
diff --git a/src/lib/stroke.ts b/src/lib/stroke.ts
index eeb2602ccc92f797967bab59b66c64def8c1bafd..253c1de265e46f07018c76f5291876f44732f73c
--- a/src/lib/stroke.ts
+++ b/src/lib/stroke.ts
@@ -1,4 +1,5 @@
 import type { Page, Stroke } from '../data/types';
+import { isValidPageId } from './pageId';
 
 export function isStrokeWidth(width: unknown): width is Stroke['width'] {
   return [2, 5, 8, 14, 28].includes(width as number);
@@ -29,13 +30,11 @@
 }
 
 export function preparePage(page: Page): Page {
-  const id = page.date + '__' + page.childId + '__' + page.authorId;
-  if (!['dad', 'mom'].includes(page.authorId) || page.id !== id) {
+  if (!isValidPageId(page)) {
     throw new Error('페이지의 날짜, 아이와 작성자는 바꿀 수 없어요.');
   }
   const result = {
     ...page,
-    id,
     drawing: page.drawing.map((stroke) => {
       if (!isStrokeWidth(stroke.width)) {
         throw new Error('그림 도구의 굵기를 확인해 주세요.');

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Encoding UTF8 src/styles/book.css; Get-Content -Encoding UTF8 src/styles/app.css | Select-Object -Skip 225 -First 28; Get-Content -Encoding UTF8 src/styles/home.css | Select-Object -Skip 395 -First 20; Get-Content -Encoding UTF8 src/data/supabaseStore.test.ts | Select-Object -First 145; Get-Content -Encoding UTF8 src/data/localStore.test.ts | Select-Object -First 100; Get-Content -Encoding UTF8 src/lib/exportFormat.test.ts,src/features/settings/bookLayout.test.ts; Get-Content -Encoding UTF8 scripts/backup/backup.mjs | Select-String -Pattern 'page|Map|sort|id' -Context 1,1" in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
 succeeded in 322ms:
.book-form fieldset {
  border: 0;
  padding: 0;
  display: grid;
  gap: 14px;
}
.book-form label {
  display: grid;
  gap: 6px;
  word-break: keep-all;
}
.book-form input,
.book-form select {
  min-height: 44px;
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--surface);
  color: inherit;
  font: inherit;
}
.book-form > p {
  min-height: 24px;
  margin: 14px 0;
}
  background: var(--card);
  box-shadow: var(--shadow);
  border: 1px solid var(--line);
}
.filter-search { padding: 0 16px 10px; }
.filter-search input {
  width: 100%;
  min-height: 44px;
  padding: 8px 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  color: var(--text);
  background: var(--field);
  font: inherit;
}
.filter-reset { display: block; margin-left: auto; margin-right: 16px; }
.filter-bar .text-btn, .sheet .text-btn { font-size: 13px; }
.feed-card { list-style: none; }
.feed .entry-button { width: 100%; min-height: 44px; }
.entry-text { white-space: pre-wrap; }
.feed-sentinel { height: 44px; }
.bottom-sheet-layer { position: fixed; inset: 0; z-index: 6; pointer-events: none; }
.bottom-sheet-layer .scrim { position: fixed; }
.bottom-sheet-layer.sheet-open .scrim { opacity: 1; pointer-events: auto; }
.bottom-sheet-layer .sheet {
  position: absolute;
  max-height: 78dvh;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 44px;
}
.crop-zoom input {
  flex: 1;
  min-width: 0;
  min-height: 44px;
}
.profile-history {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-top: 16px;
}
.profile-past {
  position: relative;
  flex: 0 0 88px;
  text-align: center;
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseStore } from './supabaseStore';
import type { Page } from './types';
type Row = Record<string, unknown>;
const user1 = 'device-dad';
const user2 = 'device-mom';
const familyId = 'family-one';
const page: Page = {
  id: '2026-10-26__kid1__dad', childId: 'kid1', date: '2026-10-26',
  text: '첫 걸음', tagIds: ['first'], authorId: 'dad', drawing: [], photos: [],
  createdAt: '2026-10-26T00:00:00Z', updatedAt: '2026-10-26T00:00:00Z',
};
function fakeServer(role = 'writer') {
  let userId = user1;
  const rows: Record<string, Row[]> = {
    family_members: [{ user_id: user1, family_id: familyId, member_id: role === 'reader' ? 'reader' : 'dad', role }],
    children: [], tags: [], pages: [], comments: [], reactions: [],
    members: [{ family_id: familyId, member_id: 'dad', display_name: '아빠', color: 'dad' },
      { family_id: familyId, member_id: 'mom', display_name: '엄마', color: 'mom' }],
  };
  let authChanged: (event: string, session: unknown) => void = () => { };
  const callbacks = new Map<string, (payload: unknown) => void>();
  const channel = {
    on: vi.fn((_event, filter, callback) => { callbacks.set(filter.table, callback); return channel; }),
    subscribe: vi.fn(() => channel),
  };
  const upsert = vi.fn(async (table: string, row: Row) => {
    const same = (item: Row) => table === 'reactions'
      ? item.page_id === row.page_id && item.member_id === row.member_id : item.id === row.id;
    rows[table] = [...rows[table].filter((item) => !same(item)), row];
    return { error: null };
  });
  const membership = vi.fn(async () => ({ data: rows.family_members.find((row) => row.user_id === userId) ?? null, error: null }));
  const signed = vi.fn(async (path: string) => ({ data: { signedUrl: 'https://signed/' + path }, error: null }));
  const upload = vi.fn(async () => ({ error: null }));
  const client = {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: { user: { id: userId } } }, error: null })),
      signInAnonymously: vi.fn(),
      onAuthStateChange: vi.fn((callback) => { authChanged = callback; return { data: { subscription: { unsubscribe: vi.fn() } } }; }),
    },
    rpc: vi.fn(async () => ({ data: null, error: null })),
    channel: vi.fn(() => channel), removeChannel: vi.fn(),
    storage: { from: () => ({ createSignedUrl: signed, upload, remove: vi.fn(async () => ({ error: null })) }) },
    from: vi.fn((table: string) => {
      const filters: Row = {};
      let update: Row | undefined;
      let deleting = false;
      const matches = (row: Row) => Object.entries(filters).every(([key, value]) => row[key] === value);
      const query = {
        select: () => query, order: () => query,
        eq: (key: string, value: unknown) => { filters[key] = value; return query; },
        maybeSingle: membership,
        range: async () => ({ data: rows[table].filter(matches), error: null }),
        upsert: (row: Row) => upsert(table, row),
        update: (row: Row) => { update = row; return query; },
        delete: () => { deleting = true; return query; },
        then: (resolve: (value: unknown) => void) => {
          if (update)
            rows[table] = rows[table].map((row) => matches(row) ? { ...row, ...update } : row);
          if (deleting)
            rows[table] = rows[table].filter((row) => !matches(row));
          resolve({ error: null });
        },
      };
      return query;
    }),
  };
  return { rows, upsert, membership, signed, upload, client: client as unknown as SupabaseClient,
    login: (id: string) => { userId = id; authChanged('SIGNED_IN', { user: { id } }); },
    emit: (table: string, eventType: string, row: Row) => {
      row = { family_id: familyId, ...row };
      const key = table === 'reactions' ? 'page_id' : table === 'members' ? 'member_id' : 'id';
      rows[table] = rows[table].filter((item) => item[key] !== row[key]);
      if (eventType !== 'DELETE')
        rows[table].push(row);
      if (table === 'pages' && eventType === 'DELETE') {
        rows.comments = rows.comments.filter((item) => item.page_id !== row.id);
        rows.reactions = rows.reactions.filter((item) => item.page_id !== row.id);
      }
      callbacks.get(table)?.({ eventType, new: eventType === 'DELETE' ? {} : row, old: eventType === 'DELETE' ? row : {} });
    },
  };
}
let stores: SupabaseStore[] = [];
function create(server: ReturnType<typeof fakeServer>) {
  const store = new SupabaseStore(server.client, 'test-project');
  stores.push(store);
  return store;
}
async function ready(store: SupabaseStore) {
  await vi.waitFor(() => expect(store.getStatus().phase).toBe('ready'));
}
beforeEach(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) });
  const events = new EventTarget();
  vi.stubGlobal('window', { setTimeout, addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events), dispatchEvent: events.dispatchEvent.bind(events),
    history: { replaceState: vi.fn() }, location: { hash: '', pathname: '/baby-diary/', search: '' } });
  vi.stubGlobal('navigator', { onLine: false });
});
afterEach(() => { stores.forEach((store) => store.dispose()); stores = []; vi.unstubAllGlobals(); });
describe('family SupabaseStore', () => {
  it('queues only the current member font and sends its storage path, including reset', async () => {
    const server = fakeServer();
    const store = create(server);
    await ready(store);
    expect(store.getCurrentMemberId()).toBe('dad');
    store.updateMember({ ...store.listMembers()[1], fontAssetId: '/other' });
    expect(store.getStatus().pending).toBe(0);
    const member = store.listMembers()[0];
    store.updateMember({ ...member, fontAssetId: 'supabase-photo:family-one/font.woff2' });
    expect(store.listMembers()[0].fontAssetId).toBe('supabase-photo:family-one/font.woff2');
    vi.stubGlobal('navigator', { onLine: true });
    store.retry();
    await vi.waitFor(() => expect(store.getStatus().pending).toBe(0));
    expect(server.rows.members[0].font_asset_path).toBe('supabase-photo:family-one/font.woff2');
    store.updateMember({ ...member, fontAssetId: undefined });
    await vi.waitFor(() => expect(store.getStatus().pending).toBe(0));
    expect(server.rows.members[0].font_asset_path).toBeNull();
    expect(store.listMembers()[0].fontAssetId).toBeUndefined();
  });
  it('persists optimistic pages and flushes the same mutation after restart', async () => {
    const server = fakeServer();
    const first = create(server);
    await ready(first);
    first.savePage(page);
    expect(first.listPages()).toEqual([page]);
    expect(server.upsert).not.toHaveBeenCalled();
    first.dispose();
    const restarted = create(server);
    await ready(restarted);
    expect(restarted.listPages()).toEqual([page]);
    vi.stubGlobal('navigator', { onLine: true });
    window.dispatchEvent(new Event('online'));
    await vi.waitFor(() => expect(restarted.getStatus().pending).toBe(0));
    expect(server.upsert).toHaveBeenCalledWith('pages', expect.objectContaining({ id: page.id, family_id: familyId, author_id: 'dad', text: page.text }));
  });
  it('keeps failures and newer edits queued, with the reason, and retries in order', async () => {
    const server = fakeServer();
    const store = create(server);
    await ready(store);
    server.upsert.mockRejectedValueOnce(new Error('offline'));
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalStore } from './localStore';
import { migrateSnapshot, type LegacySnapshot } from './migrate';
import { seedChildren, seedMembers, seedTags } from './seed';
import { normalizePageColor } from '../lib/pageColors';

const legacy = (): LegacySnapshot => ({
  children: seedChildren.map(({ pageColor: _, ...child }) => child),
  members: seedMembers,
  tags: seedTags,
  entries: [
    {
      id: 'one',
      date: '2026-10-26',
      childId: 'kid1',
      content: '첫 기록',
      authorId: 'dad',
      tagIds: ['first'],
      createdAt: '2026-10-26T00:00:00Z',
      updatedAt: '2026-10-26T01:00:00Z',
    },
    {
      id: 'two',
      date: '2026-10-26',
      childId: 'kid1',
      content: '다음 기록',
      authorId: 'mom',
      tagIds: ['first', 'sleep'],
      createdAt: '2026-10-26T02:00:00Z',
      updatedAt: '2026-10-26T03:00:00Z',
    },
    {
      id: 'three',
      date: '2026-11-01',
      childId: 'kid2',
      content: '또이 기록',
      authorId: 'dad',
      tagIds: [],
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: '2026-11-01T00:00:00Z',
    },
  ],
  comments: [
    {
      id: 'comment',
      entryId: 'two',
      authorId: 'dad',
      content: '댓글',
      createdAt: '2026-10-26T04:00:00Z',
      updatedAt: '2026-10-26T04:00:00Z',
    },
  ],
  reactions: [
    { entryId: 'one', memberId: 'dad', emoji: '❤️' },
    { entryId: 'two', memberId: 'dad', emoji: '❤️' },
  ],
});

beforeEach(() => {
  const storage = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
});

describe('page migration and local persistence', () => {
  it('normalizes stored page and default child colors on load', () => {
    const data = migrateSnapshot(legacy());
    data.pages[0].color = '#0F4D3A';
    data.children[0].pageColor = '#B8A4F2';
    localStorage.setItem('yuga-record-data', JSON.stringify(data));
    const store = new LocalStore();
    expect(store.getPage('2026-10-26', 'kid1')?.color).toBe(
      normalizePageColor('#0F4D3A'),
    );
    expect(store.listChildren()[0].pageColor).toBe(
      normalizePageColor('#B8A4F2'),
    );
    expect(data.pages[0].color).toBe('#0F4D3A');
  });
  it('asks for a member once and remembers the selection on reload', () => {
    const store = new LocalStore();
    expect(store.needsMember).toBe(true);
    expect(store.getCurrentMemberId()).toBe('');
    const previous = store.getSnapshot();
    store.setCurrentMemberId('mom');
    expect(store.getSnapshot()).not.toBe(previous);
    expect(store.needsMember).toBe(false);
    expect(new LocalStore().getCurrentMemberId()).toBe('mom');
    expect(new LocalStore().needsMember).toBe(false);
  });
  it('persists a member font and its reset across reloads', () => {
    const store = new LocalStore();
    const dad = store.listMembers()[0];
    store.updateMember({
      ...dad,
      fontAssetId: 'data:font/woff2;base64,dGVzdA==',
    });
    expect(new LocalStore().listMembers()[0].fontAssetId).toBe(
import { describe, expect, it } from 'vitest';
import { fromBackupJson, toBackupJson, toMarkdown } from './exportFormat';
import { migrateSnapshot, type LegacySnapshot } from '../data/migrate';
import { seedChildren, seedMembers, seedTags } from '../data/seed';

const old: LegacySnapshot = {
  children: seedChildren,
  members: seedMembers,
  tags: seedTags,
  entries: [
    {
      id: 'entry1',
      childId: 'kid1',
      date: '2026-10-26',
      content: '첫 걸음',
      tagIds: ['first'],
      authorId: 'dad',
      createdAt: '2026-10-26T00:00:00Z',
      updatedAt: '2026-10-26T00:00:00Z',
    },
  ],
  comments: [
    {
      id: 'comment1',
      entryId: 'entry1',
      content: '멋지다',
      authorId: 'dad',
      createdAt: '2026-10-26T00:00:00Z',
      updatedAt: '2026-10-26T00:00:00Z',
    },
  ],
  reactions: [{ entryId: 'entry1', memberId: 'dad', emoji: '❤️' }],
};
const all = migrateSnapshot(old);
all.pages[0].drawing = [{ color: '#000', width: 2, points: [0, 0, 1, 1] }];
all.pages[0].photos = [
  { id: 'photo', src: '/photo.jpg', x: 0, y: 0, w: 1, rotation: 0 },
];

describe('page exports', () => {
  it('round-trips v3 including drawings, photos and activity', () => {
    const backup = toBackupJson(all);
    expect(backup.version).toBe(3);
    expect(backup).not.toHaveProperty('entries');
    expect(fromBackupJson(JSON.parse(JSON.stringify(backup)))).toEqual(all);
  });
  it('converts a v1 backup to pages and rekeys activity', () => {
    const imported = fromBackupJson({ ...old, version: 1 });
    expect(imported.pages[0]).toMatchObject({
      text: '첫 걸음',
      authorId: 'dad',
    });
    expect(imported.comments[0].pageId).toBe('2026-10-26__kid1__dad');
    expect(imported.reactions[0].pageId).toBe('2026-10-26__kid1__dad');
  });
  it('writes Korean page headings, notes, badges and media counts', () => {
    const markdown = toMarkdown(all, '2026-10');
    expect(markdown).toContain('## 10월 26일 (월) · 조비안');
    expect(markdown).toContain('- 첫 걸음 — 아빠');
    expect(markdown).toContain('배지: 🌟처음');
    expect(markdown).toContain('(그림 있음, 사진 1장)');
    expect(markdown).toContain('💬 멋지다 — 아빠');
    expect(markdown).toContain('❤️ 아빠');
    expect(toMarkdown(all, '2026-11')).toBe('');
  });
  it('rejects unsupported or malformed backups', () => {
    expect(() => fromBackupJson({ ...old, version: 7 })).toThrow();
    expect(() =>
      fromBackupJson({ ...toBackupJson(all), pages: [{}] }),
    ).toThrow();
  });
});
import { describe, expect, it } from 'vitest';
import { BOOK, bookFilename, fitTextPages, mmToPx, wrapText } from './bookLayout';

describe('book layout', () => {
  it('rounds A5 millimetres to 300 dpi pixels', () => {
    expect(BOOK).toEqual({ width: 1748, height: 2480 });
    expect(mmToPx(25.4)).toBe(300);
    expect(mmToPx(25.4, 150)).toBe(150);
  });
  it('keeps Korean names and separates both parents on the same date', () => {
    expect(bookFilename('2026-10-26', '조비안', '엄마')).toBe(
      '2026-10-26_조비안_엄마.png',
    );
    expect(bookFilename('2026-10-26', '조비안', '아빠')).toBe(
      '2026-10-26_조비안_아빠.png',
    );
    expect(bookFilename('2026-10-26', '../또이', '아빠')).toBe(
      '2026-10-26_..-또이_아빠.png',
    );
  });
  it('wraps long Korean words and preserves blank paragraphs', () => {
    const context = {
      measureText: (text: string) =>
        ({ width: [...text].length * 10 }) as TextMetrics,
    };
    expect(wrapText(context, '우리아이일기\n\n하루', 30)).toEqual([
      '우리아',
      '이일기',
      '',
      '하루',
    ]);
  });
  it('splits text that still overflows at 80% into continuation pages', () => {
    const result = fitTextPages(Array.from({ length: 20 }, (_, i) => `line ${i}`), 68, 500);
    expect(result.size).toBe(54);
    expect(result.pages.length).toBeGreaterThan(1);
    expect(result.pages.flat()).toHaveLength(20);
  });
});

    if (relative.startsWith('..') || path.isAbsolute(relative))
>     throw new Error('invalid archive path');
    try {
  
> async function readAll(client, table, familyId) {
    const rows = [];
    for (let start = 0; ; start += 500) {
>     let query = client.from(table).select('*').eq('family_id', familyId);
>     for (const key of table === 'reactions' ? ['page_id', 'member_id'] : table === 'members' ? ['member_id'] : ['id']
)
        query = query.order(key);
    Object.fromEntries(
>     Object.entries(row).filter(([key]) => key !== 'family_id').map(([key, value]) => [
        key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
      if (authError) throw authError;
>     const { data: familyId, error: joinError } = await client.rpc('join_family', {
        p_token: process.env.BACKUP_JOIN_TOKEN,
      if (joinError) throw new Error('backup invite join failed');
>     if (!familyId) throw new Error('backup invite is invalid or revoked');
      const { data: membership, error: memberError } = await client.from('family_members')
      if (pruneError) throw new Error('reader cleanup failed');
>     const [children, members, tags, pages, comments, reactions] =
        await Promise.all(
>         ['children', 'members', 'tags', 'pages', 'comments', 'reactions'].map(
>           (table) => readAll(client, table, familyId),
          ),
      snapshot = {
>       children: children.map(camel),
>       members: members.map((row) => ({ id: row.member_id, displayName: row.display_name, color: row.color, fontAssetI
d: row.font_asset_path ?? undefined })),
>       tags: tags.map(camel),
>       pages: pages.map(camel),
>       comments: comments.map(camel),
>       reactions: reactions.map(camel),
      };
    );
>   const months = new Set(snapshot.pages.map((page) => page.date.slice(0, 7)));
    for (const month of months) {
      JSON.stringify(
>       { lastBackupAt: backup.exportedAt, pages: snapshot.pages.length },
        null,
    log(
>     `backup: ${dryRun ? 'dry-run' : 'wrote'} ${snapshot.pages.length} page(s)`,
    );



2026-11-02T00:31:41.082915Z ERROR codex_core::tools::router: error=apply_patch verification failed: Failed to find expected lines in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\styles\app.css:
.notes { max-width: 700px; margin: 40px auto 0; display: grid; gap: 12px; }
.note { background: var(--card); border-radius: 16px; padding: 18px; box-shadow: var(--shadow); font-size: 14px; }
.note h4 { font-size: 15px; margin-bottom: 8px; }
.note ul { padding-left: 18px; color: var(--sub); }
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Encoding UTF8 src/styles/app.css | Select-Object -Skip 186 -First 10; Select-String -Path src/data/artifactStore.ts -Pattern sheetsFor; Get-Content tsconfig.app.json; python --version' in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
 exited 1 in 1569ms:
.action-sheet button:last-child { border-bottom: 0; color: var(--sub); }
.action-sheet .danger { color: var(--kid1); }

.notes { max-width: 1240px; margin: 40px auto 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
.note { background: var(--card); border-radius: var(--r-card); padding: 18px; box-shadow: var(--shadow); font-size: 14px; }
.note h4 { font-size: 15px; margin-bottom: 6px; }
.note ul { padding-left: 18px; color: var(--sub); }
.swatches { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
.sw { width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--line); }

{"compilerOptions":{"tsBuildInfoFile":"./node_modules/.tmp/tsconfig.app.tsbuildinfo","target":"ES2020","useDefineForClassFields":true,"lib":["ES2020","DOM","DOM.Iterable"],"module":"ESNext","skipLibCheck":true,"moduleResolution":"bundler","allowImportingTsExtensions":true,"resolveJsonModule":true,"isolatedModules":true,"noEmit":true,"jsx":"react-jsx","strict":true,"noUnusedLocals":true,"noUnusedParameters":true},"include":["src"]}
python : 'python' 용어가 cmdlet, 함수, 스크립트 파일 또는 실행할 수 있는 프로그램 이름으로 인식되지 않습니다. 이름이 정확한지 확인하고 경로가 포함된 경우 경로가 올바른지 검증한 다음 다시 
시도하십시오.
위치 줄:2 문자:181
+ ... .ts -Pattern sheetsFor; Get-Content tsconfig.app.json; python --versi ...
+                                                            ~~~~~~
    + CategoryInfo          : ObjectNotFound: (python:String) [], CommandNotFoundException
    + FullyQualifiedErrorId : CommandNotFoundException
 

apply patch
patch: completed
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\artifactStore.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\localStore.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\migrate.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\supabaseStore.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\WritingArea.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\styles\app.css
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\styles\page.css
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\styles\tokens.css
diff --git a/src/data/DataStore.ts b/src/data/DataStore.ts
index f971f02a5dfebfb3d80078f7b9969496a9c389f5..7a060f742f390c8bc42505056d4e66e94fd40b12
--- a/src/data/DataStore.ts
+++ b/src/data/DataStore.ts
@@ -26,6 +26,7 @@
   listMembers(): Member[];
   listTags(): Tag[];
   listPages(range?: PageRange): Page[];
+  getPageById(id: string): Page | undefined;
   getPage(
     date: string,
     childId: string,
diff --git a/src/data/artifactStore.ts b/src/data/artifactStore.ts
index 12bc4bc34c5b1a126e4edb9ed437b89b8e321250..cef23dd0e95e57aaf64f8ca15b024c648033f2c4
--- a/src/data/artifactStore.ts
+++ b/src/data/artifactStore.ts
@@ -1,5 +1,6 @@
 import { normalizePageColor } from '../lib/pageColors';
 import { todayKey } from '../lib/date';
+import { sheetsFor } from '../lib/pageId';
 import { LegacyAdapter } from './legacyAdapter';
 import { migrateMonthSnapshot, defaultChildStatus, defaultPageColor } from './migrate';
 import { preparePage } from '../lib/stroke';
@@ -55,6 +56,7 @@
     tagIds: page.tagIds,
     hasDrawing: page.drawing.length > 0,
     photoCount: page.photos.length,
+    createdAt: page.createdAt,
     updatedAt: page.updatedAt,
     deletedAt: null,
   };
@@ -100,7 +102,7 @@
             tagIds: summary.tagIds,
             drawing: [],
             photos: [],
-            createdAt: summary.updatedAt,
+            createdAt: summary.createdAt ?? summary.updatedAt,
             updatedAt: summary.updatedAt,
           },
     ),
@@ -536,14 +538,17 @@
     childId: string,
     authorId = this.getCurrentMemberId() || 'dad',
   ): Page | undefined {
-    const id = date + '__' + childId + '__' + authorId;
+    const page = sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
+    return page ? this.getPageById(page.id) : undefined;
+  }
+  getPageById(id: string): Page | undefined {
     if (
       this.cache.has(id) ||
       this.pending.some((write) => write.path === 'pages/' + id)
     ) {
       return this.snapshot.pages.find((page) => page.id === id);
     }
-    if (!this.months[date.slice(0, 7)]?.pages[id])
+    if (!this.months[id.slice(0, 7)]?.pages[id])
       return this.snapshot.pages.find((page) => page.id === id);
     return undefined;
   }
diff --git a/src/data/legacyAdapter.ts b/src/data/legacyAdapter.ts
index 4d7ce7f39a0ad9354ba0eeffdc3ef38daa6b4fb9..2709be0fd351ca154fa2f3dee184eeaac556332b
--- a/src/data/legacyAdapter.ts
+++ b/src/data/legacyAdapter.ts
@@ -1,6 +1,7 @@
 import type { DataStore } from './DataStore';
 import type { Child, Page, StoreSnapshot } from './types';
 import { noteAuthor } from './migrate';
+import { basePageId, isValidPageId } from '../lib/pageId';
 
 export type LegacyEntry = {
   id: string;
@@ -34,6 +35,9 @@
   abstract updateChild(child: Child): void;
   abstract uploadPhoto(blob: Blob): Promise<{ src: string }>;
   protected async removePhotoAsset(_src: string): Promise<void> {}
+  getPageById(id: string): Page | undefined {
+    return this.getSnapshot().pages.find((page) => page.id === id);
+  }
   async loadPage(id: string): Promise<Page> {
     const page = this.getSnapshot().pages.find((item) => item.id === id);
     if (!page) throw new Error('페이지를 찾을 수 없어요.');
@@ -111,7 +115,9 @@
   updateEntry(entry: LegacyEntry): void {
     const data = this.getSnapshot();
     const authorId = noteAuthor(entry.authorId, data.members);
-    const id = entry.date + '__' + entry.childId + '__' + authorId;
+    const id = isValidPageId({ ...entry, authorId })
+      ? entry.id
+      : basePageId(entry.date, entry.childId, authorId);
     const page = data.pages.find((item) => item.id === id);
     this.savePage({
       ...page,
diff --git a/src/data/localStore.ts b/src/data/localStore.ts
index 12680619118dcfaea6acc91957a09ed6514c27ba..184728d7283834c68d90dd6f7eb11fe1ef13d135
--- a/src/data/localStore.ts
+++ b/src/data/localStore.ts
@@ -164,9 +164,7 @@
     childId: string,
     authorId = this.getCurrentMemberId() || 'dad',
   ): Page | undefined {
-    return this.snapshot.pages.find(
-      (page) => page.id === date + '__' + childId + '__' + authorId,
-    );
+    return sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
   }
 
   savePage(page: Page): void {
diff --git a/src/data/migrate.ts b/src/data/migrate.ts
index 85c598394abec3735d904cf7234107ba2124cdd8..f9fcd44cb1693aac5585d753846bf5b007d7f001
--- a/src/data/migrate.ts
+++ b/src/data/migrate.ts
@@ -1,4 +1,5 @@
 import { normalizePageColor } from '../lib/pageColors';
+import { basePageId } from '../lib/pageId';
 import type { LegacyEntry } from './legacyAdapter';
 import type {
   Child,
@@ -164,11 +165,11 @@
         a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
     );
     const owner = notes[0]?.authorId ?? 'dad';
-    owners.set(source.id, source.date + '__' + source.childId + '__' + owner);
+    owners.set(source.id, basePageId(source.date, source.childId, owner));
     for (const authorId of [
       ...new Set([owner, ...notes.map((note) => note.authorId)]),
     ]) {
-      const id = source.date + '__' + source.childId + '__' + authorId;
+      const id = basePageId(source.date, source.childId, authorId);
       const { notes: _, ...rest } = source;
       const value: Page = {
         ...rest,
diff --git a/src/data/supabaseStore.ts b/src/data/supabaseStore.ts
index 8e7946188600aa4ea4e61091c345cefb1e259a94..13447c1cbac55d745a22926469a96a45c5e1bd5e
--- a/src/data/supabaseStore.ts
+++ b/src/data/supabaseStore.ts
@@ -595,9 +595,7 @@
     childId: string,
     authorId = this.membership?.member_id === 'mom' ? 'mom' : 'dad',
   ): Page | undefined {
-    return this.snapshot.pages.find(
-      (page) => page.id === date + '__' + childId + '__' + authorId,
-    );
+    return sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
   }
   savePage(page: Page): void {
     if (page.photos.some((photo) => photo.src.startsWith('data:')))
diff --git a/src/data/types.ts b/src/data/types.ts
index a565623240c4c75b5494dac7f23863356708bebe..896b815d2be90a47dea69f388e141a7902d88765
--- a/src/data/types.ts
+++ b/src/data/types.ts
@@ -85,6 +85,7 @@
   Page,
   'id' | 'date' | 'childId' | 'authorId' | 'color' | 'tagIds' | 'updatedAt'
 > & {
+  createdAt?: string;
   firstLine: string;
   hasDrawing: boolean;
   photoCount: number;
diff --git a/src/features/page/WritingArea.tsx b/src/features/page/WritingArea.tsx
index ef273ae1617da347d1bc699fdc7b2e5bb8501f58..5b03111c483c9f73c3ecd5a100b8228ef5d72582
--- a/src/features/page/WritingArea.tsx
+++ b/src/features/page/WritingArea.tsx
@@ -15,7 +15,7 @@
   return (
     <section className="writing" aria-label={`${name}의 일기`}>
       <div className="notes">
-        {notes.filter((note) => !editing || note.id !== current?.id).map((note) => (
+        {notes.filter((note) => note.text.trim() && (!editing || note.id !== current?.id)).map((note) => (
           <p key={note.id} className={`note ${note.authorId}-writing`}>
             {note.text}
             <span className="initial">{note.authorId === 'dad' ? '아' : '엄'}</span>
diff --git a/src/lib/exportFormat.ts b/src/lib/exportFormat.ts
index 580b521cd97b9d598c2ba3343e908b435c7d6d18..310d396f34f82a3714de28d1724f30f26f633646
--- a/src/lib/exportFormat.ts
+++ b/src/lib/exportFormat.ts
@@ -1,5 +1,6 @@
 import { migrateSnapshot, type LegacySnapshot } from '../data/migrate';
 import type { StoreSnapshot } from '../data/types';
+import { isValidPageId } from './pageId';
 
 export type BackupJson = StoreSnapshot & { version: 3; exportedAt: string };
 
@@ -71,8 +72,7 @@
     data.version === 3 &&
     snapshot.pages.some(
       (page) =>
-        !['dad', 'mom'].includes(page.authorId) ||
-        page.id !== page.date + '__' + page.childId + '__' + page.authorId ||
+        !isValidPageId(page) ||
         typeof page.text !== 'string',
     )
   )
diff --git a/src/lib/pageId.ts b/src/lib/pageId.ts
new file mode 100644
index 0000000000000000000000000000000000000000..96522fdd7bfe8b4306dc4b51be31b25d671fba54
--- /dev/null
+++ b/src/lib/pageId.ts
@@ -0,0 +1,63 @@
+import type { Page } from '../data/types';
+
+export function basePageId(
+  date: string,
+  childId: string,
+  authorId: Page['authorId'],
+): string {
+  return `${date}__${childId}__${authorId}`;
+}
+
+export function newSheetId(
+  date: string,
+  childId: string,
+  authorId: Page['authorId'],
+): string {
+  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
+  let suffix = '';
+  // Rejection sampling keeps all 36 characters equally likely.
+  while (suffix.length < 8) {
+    for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
+      if (byte < 252 && suffix.length < 8) suffix += alphabet[byte % 36];
+    }
+  }
+  return `${basePageId(date, childId, authorId)}__${suffix}`;
+}
+
+export function isValidPageId(
+  page: Pick<Page, 'id' | 'date' | 'childId' | 'authorId'>,
+): boolean {
+  if (
+    typeof page.id !== 'string' ||
+    !/^\d{4}-\d{2}-\d{2}$/.test(page.date) ||
+    typeof page.childId !== 'string' ||
+    !page.childId ||
+    !['dad', 'mom'].includes(page.authorId)
+  )
+    return false;
+  const base = basePageId(page.date, page.childId, page.authorId);
+  return (
+    page.id === base ||
+    (page.id.startsWith(base + '__') &&
+      /^[a-z0-9]{8}$/.test(page.id.slice(base.length + 2)))
+  );
+}
+
+export function sheetsFor(
+  pages: Page[],
+  date: string,
+  childId: string,
+  authorId: string,
+): Page[] {
+  return pages
+    .filter(
+      (page) =>
+        page.date === date &&
+        page.childId === childId &&
+        page.authorId === authorId,
+    )
+    .sort(
+      (a, b) =>
+        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
+    );
+}
diff --git a/src/lib/stroke.ts b/src/lib/stroke.ts
index eeb2602ccc92f797967bab59b66c64def8c1bafd..253c1de265e46f07018c76f5291876f44732f73c
--- a/src/lib/stroke.ts
+++ b/src/lib/stroke.ts
@@ -1,4 +1,5 @@
 import type { Page, Stroke } from '../data/types';
+import { isValidPageId } from './pageId';
 
 export function isStrokeWidth(width: unknown): width is Stroke['width'] {
   return [2, 5, 8, 14, 28].includes(width as number);
@@ -29,13 +30,11 @@
 }
 
 export function preparePage(page: Page): Page {
-  const id = page.date + '__' + page.childId + '__' + page.authorId;
-  if (!['dad', 'mom'].includes(page.authorId) || page.id !== id) {
+  if (!isValidPageId(page)) {
     throw new Error('페이지의 날짜, 아이와 작성자는 바꿀 수 없어요.');
   }
   const result = {
     ...page,
-    id,
     drawing: page.drawing.map((stroke) => {
       if (!isStrokeWidth(stroke.width)) {
         throw new Error('그림 도구의 굵기를 확인해 주세요.');
diff --git a/src/styles/app.css b/src/styles/app.css
index 04aa18bd154ce5eccb83359658fa4914663081a7..9654cc22dda57720d60b97215fc5893e5d6113cd
--- a/src/styles/app.css
+++ b/src/styles/app.css
@@ -8,6 +8,7 @@
 }
 body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg); }
 button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
+input, textarea, select { color: inherit; }
 .artifact-welcome { min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; padding: calc(24px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-inset-bottom)); background: var(--bg); }
 .artifact-welcome h2 { font-size: 22px; }
 .artifact-picker { display: flex; gap: 16px; width: 100%; max-width: 320px; }
@@ -187,10 +188,6 @@
 .action-sheet button:last-child { border-bottom: 0; color: var(--sub); }
 .action-sheet .danger { color: var(--kid1); }
 
-.notes { max-width: 1240px; margin: 40px auto 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
-.note { background: var(--card); border-radius: var(--r-card); padding: 18px; box-shadow: var(--shadow); font-size: 14px; }
-.note h4 { font-size: 15px; margin-bottom: 6px; }
-.note ul { padding-left: 18px; color: var(--sub); }
 .swatches { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
 .sw { width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--line); }
 
diff --git a/src/styles/page.css b/src/styles/page.css
index f30f5abb2d2e20133f2b3b3bf2a7d5b4d5f421a7..2ffdbe722bf73e4276370ba567b709820c2030ca
--- a/src/styles/page.css
+++ b/src/styles/page.css
@@ -227,11 +227,18 @@
   min-height: 176px;
 }
 
-.notes {
+.diary .notes {
+  display: block;
+  margin: 0;
   min-height: 140px;
 }
 
-.note {
+.diary .note {
+  background: none;
+  box-shadow: none;
+  border-radius: 0;
+  padding: 0;
+  font-size: 20px;
   margin-bottom: 14px;
   line-height: 35px;
   white-space: pre-wrap;
@@ -240,7 +247,7 @@
 
 .initial {
   margin-left: 7px;
-  opacity: 0.5;
+  opacity: 0.7;
   font-size: 13px;
 }
 
@@ -545,6 +552,23 @@
   gap: 8px;
   word-break: keep-all;
 }
+.diary .page-sheets {
+  display: flex;
+  justify-content: center;
+  flex: none;
+  height: 44px;
+  overflow-x: auto;
+  color: var(--page-ink);
+}
+.page-sheets button {
+  flex: 0 0 44px;
+  opacity: 0.7;
+}
+.page-sheets button[aria-pressed='true'] {
+  opacity: 1;
+  text-decoration: underline;
+  text-underline-offset: 4px;
+}
 .parent-pages button {
   min-height: 44px;
   padding: 2px 5px;
diff --git a/src/styles/tokens.css b/src/styles/tokens.css
index ef78879c69b0ec08ac3018f3aa658a2b2b9b7347..8524e9344622284da57edbccc696862aca9c36e8
--- a/src/styles/tokens.css
+++ b/src/styles/tokens.css
@@ -1,6 +1,7 @@
 
 /* ===== Design tokens ===== */
 :root {
+  color-scheme: light;
   --bg: #F6F5F2;
   --card: #FFFFFF;
   --surface: #FFFFFF;
@@ -35,6 +36,7 @@
 }
 @media (prefers-color-scheme: dark) {
   :root:not([data-theme="light"]) {
+    color-scheme: dark;
     --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
     --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
     --dad: #8AA6E3; --mom: #E39BB3;
@@ -47,6 +49,7 @@
   }
 }
 :root[data-theme="dark"] {
+  color-scheme: dark;
   --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
   --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
   --dad: #8AA6E3; --mom: #E39BB3;

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Encoding UTF8 src/data/localStore.ts,src/data/supabaseStore.ts | Select-String -Pattern '"'^import'"' ; Get-Content -Encoding UTF8 src/features/archive/ArchiveScreen.tsx; Get-Content -Encoding UTF8 src/features/calendar/CalendarScreen.tsx | Select-Object -First 22; Get-Content -Encoding UTF8 scripts/backup/backup.check.mjs | Select-Object -First 120; Get-Content -Encoding UTF8 src/data/testDb.ts | Select-Object -First 160" in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
 succeeded in 297ms:

import { putPhoto, readPhoto, removePhoto } from './photoAssets';
import { externalizeSnapshot, hasInlinePhotos } from './importPhotos';
import { LegacyAdapter } from './legacyAdapter';
import { defaultChildStatus, migrateSnapshot, type LegacySnapshot } from './migrate';
import { preparePage } from '../lib/stroke';
import { downscalePhoto, blobToDataUrl } from '../lib/image';
import type { DataStore } from './DataStore';
import { seedChildren, seedMembers, seedTags } from './seed';
import type {
import { normalizePageColor } from '../lib/pageColors';
import { migrateSnapshot } from './migrate';
import { externalizeSnapshot, hasInlinePhotos } from './importPhotos';
import { LegacyAdapter } from './legacyAdapter';
import { preparePage } from '../lib/stroke';
import { downscalePhoto } from '../lib/image';
import { enterFamily, loadMembership, makeInvite, inviteRequired, inviteFailure, type FamilyMembership } from './family
Access';
import {
import type { DataStore } from './DataStore';
import type {
import type { DataStore } from '../../data/DataStore';
import { useMemo, useState } from 'react';
import type { StoreSnapshot, Page } from '../../data/types';
import { PageCard } from './PageCard';
import { SearchPill } from './SearchPill';
import { ArchiveListRow } from './ArchiveListRow';
import { ArchiveViewToggle, useArchiveView } from './archiveView';
import { Icon } from '../../components/Icon';
export function ArchiveScreen({
  snapshot,
  store,
  openPage,
  onBack,
}: {
  store: DataStore;
  snapshot: StoreSnapshot;
  openPage: (date: string, childId: string, authorId?: 'dad' | 'mom') => void;
  onBack: () => void;
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [list, toggleView] = useArchiveView(store.getCurrentMemberId());
  const filtered = snapshot.pages.filter(
    (page) =>
      (!filter || page.childId === filter) &&
      (!query ||
        page.text.toLocaleLowerCase().includes(query.toLocaleLowerCase())),
  );
  const [limit, setLimit] = useState(60);
  const pages = [...filtered]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
  const groups = useMemo(
    () =>
      pages.reduce<Record<string, Page[]>>((result, page) => {
        const key = page.date.slice(0, 7);
        (result[key] ??= []).push(page);
        return result;
      }, {}),
    [pages],
  );
  return (
    <div className="screen-scroll archive-screen">
      <div className="back-title">
        <button type="button" onClick={onBack}>
          <Icon name="back" />
        </button>
        <h1>목록</h1>
      </div>
      <div className="segments" role="group" aria-label="아이별 기록 필터">
        <button
          aria-pressed={!filter}
          onClick={() => {
            setFilter('');
            setLimit(60);
          }}
        >
          전체
        </button>
        {snapshot.children.map((child) => (
          <button
            key={child.id}
            aria-pressed={filter === child.id}
            onClick={() => {
              setFilter(child.id);
              setLimit(60);
            }}
          >
            {child.name}
          </button>
        ))}
        <ArchiveViewToggle list={list} onToggle={toggleView} />
      </div>
      <SearchPill query={query} onChange={value => { setQuery(value); setLimit(60); }} />
      {!filtered.length && <p className="empty-results">아직 기록이 없어요.</p>}
      {Object.entries(groups).map(([month, monthPages]) => (
        <section className="archive-month" key={month}>
          <h2>{month.replace('-', '년 ')}월</h2>
          <div className={list ? "archive-list" : "archive-grid"}>
            {monthPages.map((page) => {
              const child = snapshot.children.find(
                (item) => item.id === page.childId,
              );
              return child ? list ? (
                <ArchiveListRow
                  key={page.id}
                  page={page}
                  child={child}
                  onClick={() => openPage(page.date, page.childId, page.authorId)}
                />
              ) : (
                <PageCard
                  store={store}
                  key={page.id}
                  page={page}
                  child={child}
                  onClick={() =>
                    openPage(page.date, page.childId, page.authorId)
                  }
                />
              ) : null;
            })}
          </div>
        </section>
      ))}
      <button
        className="secondary-btn load-more"
        type="button"
        disabled={pages.length >= filtered.length}
        onClick={() => setLimit((value) => value + 60)}
      >
        더 불러오기
      </button>
    </div>
  );
}
import type { DataStore } from '../../data/DataStore';
import { useState } from 'react';
import type { StoreSnapshot } from '../../data/types';
import { addDays, fromKey } from '../../lib/date';
import { Icon } from '../../components/Icon';
import { displayColor } from '../../lib/pageColors';
import { useDarkMode } from '../../lib/usePageColorStyle';
import { MonthGrid } from './MonthGrid';
import { DayPreview } from './DayPreview';

type Props = {
  store: DataStore;
  snapshot: StoreSnapshot;
  openPage: (date: string, childId: string, authorId?: 'dad' | 'mom') => void;
  date: string;
  setDate: (date: string) => void;
};

export function CalendarScreen({
  store,
  snapshot,
  openPage,
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdtemp,
  readFile,
  writeFile,
  stat,
  rm,
  mkdir,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toDatedArchive } from '../../src/lib/datedArchive.mjs';

const script = fileURLToPath(new URL('./backup.mjs', import.meta.url));
const fixture = fileURLToPath(
  new URL('./fixtures/two-parents.json', import.meta.url),
);

test('dated backup dry-run and incremental writes preserve old files and both parents', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'diary-backup-'));
  const run = (...args) =>
    execFileSync(process.execPath, [script, '--fixture', fixture, ...args], {
      env: { ...process.env, OUT_DIR: directory },
      encoding: 'utf8',
    });
  try {
    const snapshot = JSON.parse(await readFile(fixture, 'utf8'));
    const files = toDatedArchive(snapshot);
    assert.deepEqual(
      files.map((file) => file.path),
      [
        'diary/2026/10/26/kid1-dad.json',
        'diary/2026/10/26/kid1-mom.json',
        'diary/2026/10/26.md',
      ],
    );
    assert.match(files[2].content, /엄마 기록 — 엄마/);
    assert.match(files[2].content, /아빠 기록 — 아빠/);
    const output = run('--dry-run');
    for (const file of files) assert.ok(output.includes(file.path));
    await assert.rejects(readFile(path.join(directory, 'backup.json')), {
      code: 'ENOENT',
    });
    await mkdir(path.join(directory, 'diary/2020'), { recursive: true });
    const old = path.join(directory, 'diary/2020/old.json');
    await writeFile(old, 'keep');
    run();
    for (const file of files)
      assert.equal(
        await readFile(path.join(directory, file.path), 'utf8'),
        file.content,
      );
    const dated = path.join(directory, files[0].path);
    const before = (await stat(dated)).mtimeMs;
    run();
    assert.equal((await stat(dated)).mtimeMs, before);
    assert.equal(await readFile(old, 'utf8'), 'keep');
    assert.equal(
      JSON.parse(await readFile(path.join(directory, 'backup.json'), 'utf8'))
        .version,
      3,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});


test('public backup encryption roundtrips and rejects a wrong key or modified ciphertext', async () => {
  const { encrypt, decrypt } = await import('./encrypt.mjs');
  const token = 'a'.repeat(43);
  const plaintext = Buffer.from('가족의 비공개 기록');
  const encrypted = encrypt(plaintext, token);
  assert.deepEqual(decrypt(encrypted, token), plaintext);
  assert.equal(encrypted.includes(plaintext), false);
  assert.throws(() => decrypt(encrypted, 'wrong'));
  encrypted[encrypted.length - 1] ^= 1;
  assert.throws(() => decrypt(encrypted, token));
});
import { mergeDoc, type ArtifactConfig } from './artifactStore';
import { seedChildren, seedMembers, seedTags } from './seed';
import type { Page } from './types';
type Body = Record<string, unknown>;
export const config = (): ArtifactConfig => ({
  children: Object.fromEntries(seedChildren.map((child) => [child.id, child])),
  tags: Object.fromEntries(seedTags.map((tag) => [tag.id, tag])),
  members: { dad: seedMembers[0], mom: seedMembers[1] },
  memberByUser: { viewer: 'dad' },
});
export const page = (date = '2026-10-26', childId = 'kid1'): Page => ({
  id: date + '__' + childId + '__dad',
  date,
  childId,
  color: '#F4B9B8',
  drawing: [],
  photos: [],
  authorId: 'dad',
  text: '오늘 기록',
  tagIds: [],
  createdAt: '2026-10-26T03:00:00Z',
  updatedAt: '2026-10-26T03:00:00Z',
});
/** Just the contract surface the store uses; snapshots are copied, never mutable DB state. */
export class FakeDb {
  bodies = new Map<string, Body>();
  writes: { path: string; kind: string; patch: Body }[] = [];
  subscriptions = 0;
  failNext = false;
  failureCode = 'invalid_argument';
  failPaths = new Map<string, string>();
  private active = new Set<string>();
  private listeners = new Set<() => void>();

  constructor(seeded = true) {
    if (seeded) this.bodies.set('meta/config', config());
  }
  private snapshot(path: string): DocumentSnapshot {
    const body = this.bodies.get(path);
    return {
      id: path.split('/').at(-1)!,
      exists: Boolean(body),
      data: () => body && structuredClone(body),
      metadata: { fromCache: false, hasPendingWrites: false },
    };
  }
  private listen(callback: () => void): Unsubscribe {
    this.subscriptions++;
    this.listeners.add(callback);
    callback();
    return () => this.listeners.delete(callback);
  }
  publish(): void {
    this.listeners.forEach((listener) => listener());
  }
  doc(path: string): DocumentReference {
    const write = async (kind: 'set' | 'update', patch: Body) => {
      if (this.active.has(path)) throw new Error('Overlapping writes');
      this.active.add(path);
      try {
        await Promise.resolve();
        const code = this.failPaths.get(path);
        if (code) throw { code, message: 'rejected' };
        if (this.failNext) {
          this.failNext = false;
          throw { code: this.failureCode, message: 'offline' };
        }
        if (kind === 'update' && !this.bodies.has(path))
          throw new Error('Missing doc');
        this.writes.push({ path, kind, patch });
        this.bodies.set(
          path,
          kind === 'set'
            ? structuredClone(patch)
            : mergeDoc(this.bodies.get(path)!, patch),
        );
        this.publish();
      } finally {
        this.active.delete(path);
      }
    };
    return {
      id: path.split('/').at(-1)!,
      path,
      get: async () => this.snapshot(path),
      set: (patch) => write('set', patch),
      update: (patch) => write('update', patch),
      onSnapshot: (next) => this.listen(() => next(this.snapshot(path))),
    } as DocumentReference;
  }
  collection(path: string): CollectionReference {
    return {
      get: async () => {
        const docs = [...this.bodies.keys()]
          .filter((key) => key.startsWith(path + '/'))
          .map((key) => this.snapshot(key));
        return {
          docs,
          size: docs.length,
          empty: !docs.length,
          docChanges: () => [],
          metadata: { fromCache: false, hasPendingWrites: false },
        };
      },
      onSnapshot: (next: (snapshot: QuerySnapshot) => void) =>
        this.listen(() => {
          const docs = [...this.bodies.keys()]
            .filter((key) => key.startsWith(`${path}/`))
            .map((key) => this.snapshot(key));
          next({
            docs,
            size: docs.length,
            empty: !docs.length,
            docChanges: () => [],
            metadata: { fromCache: false, hasPendingWrites: false },
          });
        }),
    } as unknown as CollectionReference;
  }
}

// Drain the store's promise queues, without timers or platform dependencies.
export async function settle(): Promise<void> {
  for (let index = 0; index < 100; index++) await Promise.resolve();
}



apply patch
patch: completed
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\App.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\localStore.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\supabaseStore.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\PageScreen.tsx
diff --git a/src/App.tsx b/src/App.tsx
index 83254dd1abb764b1b15ec1e793e502bca0d244f2..da02bb99e70fa155611d5ff74b048a8abfbaa1da
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -21,6 +21,7 @@
       date: string;
       childId: string;
       authorId?: 'dad' | 'mom';
+      pageId?: string;
       editing: boolean;
       origin?: PageOrigin;
     };
@@ -54,12 +55,14 @@
     nextDate: string,
     childId: string,
     authorId?: 'dad' | 'mom',
+    pageId?: string,
   ) =>
     setScreen({
       kind: 'page',
       date: nextDate,
       childId,
       authorId,
+      pageId,
       ...source.current,
     });
   const goHome = () => setScreen({ kind: 'shell', tab: '홈' });
@@ -71,17 +74,19 @@
       <>
         <SyncBanner store={store} />
         <PageScreen
-          key={`${screen.date}__${screen.childId}__${screen.authorId ?? store.getCurrentMemberId()}`}
+          key={`${screen.date}__${screen.childId}__${screen.authorId ?? store.getCurrentMemberId()}__${screen.pageId ?? ''}`}
           store={store}
           snapshot={snapshot}
           child={child}
           date={screen.date}
           authorId={screen.authorId}
-          onAuthor={(authorId) => setScreen({ ...screen, authorId })}
+          pageId={screen.pageId}
+          onSheet={(pageId) => setScreen({ ...screen, pageId })}
+          onAuthor={(authorId) => setScreen({ ...screen, authorId, pageId: undefined })}
           startEditing={screen.editing}
           origin={screen.origin}
           onBack={goHome}
-          onDate={(nextDate) => setScreen({ ...screen, date: nextDate })}
+          onDate={(nextDate) => setScreen({ ...screen, date: nextDate, pageId: undefined })}
           onSaved={() => {
             setDate(screen.date);
             setSavedToast(true);
diff --git a/src/data/DataStore.ts b/src/data/DataStore.ts
index f971f02a5dfebfb3d80078f7b9969496a9c389f5..7a060f742f390c8bc42505056d4e66e94fd40b12
--- a/src/data/DataStore.ts
+++ b/src/data/DataStore.ts
@@ -26,6 +26,7 @@
   listMembers(): Member[];
   listTags(): Tag[];
   listPages(range?: PageRange): Page[];
+  getPageById(id: string): Page | undefined;
   getPage(
     date: string,
     childId: string,
diff --git a/src/data/artifactStore.ts b/src/data/artifactStore.ts
index 12bc4bc34c5b1a126e4edb9ed437b89b8e321250..cef23dd0e95e57aaf64f8ca15b024c648033f2c4
--- a/src/data/artifactStore.ts
+++ b/src/data/artifactStore.ts
@@ -1,5 +1,6 @@
 import { normalizePageColor } from '../lib/pageColors';
 import { todayKey } from '../lib/date';
+import { sheetsFor } from '../lib/pageId';
 import { LegacyAdapter } from './legacyAdapter';
 import { migrateMonthSnapshot, defaultChildStatus, defaultPageColor } from './migrate';
 import { preparePage } from '../lib/stroke';
@@ -55,6 +56,7 @@
     tagIds: page.tagIds,
     hasDrawing: page.drawing.length > 0,
     photoCount: page.photos.length,
+    createdAt: page.createdAt,
     updatedAt: page.updatedAt,
     deletedAt: null,
   };
@@ -100,7 +102,7 @@
             tagIds: summary.tagIds,
             drawing: [],
             photos: [],
-            createdAt: summary.updatedAt,
+            createdAt: summary.createdAt ?? summary.updatedAt,
             updatedAt: summary.updatedAt,
           },
     ),
@@ -536,14 +538,17 @@
     childId: string,
     authorId = this.getCurrentMemberId() || 'dad',
   ): Page | undefined {
-    const id = date + '__' + childId + '__' + authorId;
+    const page = sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
+    return page ? this.getPageById(page.id) : undefined;
+  }
+  getPageById(id: string): Page | undefined {
     if (
       this.cache.has(id) ||
       this.pending.some((write) => write.path === 'pages/' + id)
     ) {
       return this.snapshot.pages.find((page) => page.id === id);
     }
-    if (!this.months[date.slice(0, 7)]?.pages[id])
+    if (!this.months[id.slice(0, 7)]?.pages[id])
       return this.snapshot.pages.find((page) => page.id === id);
     return undefined;
   }
diff --git a/src/data/legacyAdapter.ts b/src/data/legacyAdapter.ts
index 4d7ce7f39a0ad9354ba0eeffdc3ef38daa6b4fb9..2709be0fd351ca154fa2f3dee184eeaac556332b
--- a/src/data/legacyAdapter.ts
+++ b/src/data/legacyAdapter.ts
@@ -1,6 +1,7 @@
 import type { DataStore } from './DataStore';
 import type { Child, Page, StoreSnapshot } from './types';
 import { noteAuthor } from './migrate';
+import { basePageId, isValidPageId } from '../lib/pageId';
 
 export type LegacyEntry = {
   id: string;
@@ -34,6 +35,9 @@
   abstract updateChild(child: Child): void;
   abstract uploadPhoto(blob: Blob): Promise<{ src: string }>;
   protected async removePhotoAsset(_src: string): Promise<void> {}
+  getPageById(id: string): Page | undefined {
+    return this.getSnapshot().pages.find((page) => page.id === id);
+  }
   async loadPage(id: string): Promise<Page> {
     const page = this.getSnapshot().pages.find((item) => item.id === id);
     if (!page) throw new Error('페이지를 찾을 수 없어요.');
@@ -111,7 +115,9 @@
   updateEntry(entry: LegacyEntry): void {
     const data = this.getSnapshot();
     const authorId = noteAuthor(entry.authorId, data.members);
-    const id = entry.date + '__' + entry.childId + '__' + authorId;
+    const id = isValidPageId({ ...entry, authorId })
+      ? entry.id
+      : basePageId(entry.date, entry.childId, authorId);
     const page = data.pages.find((item) => item.id === id);
     this.savePage({
       ...page,
diff --git a/src/data/localStore.ts b/src/data/localStore.ts
index 12680619118dcfaea6acc91957a09ed6514c27ba..eb37c8d5740b98661822f2666c16c3dbc28a1cf4
--- a/src/data/localStore.ts
+++ b/src/data/localStore.ts
@@ -3,6 +3,7 @@
 import { LegacyAdapter } from './legacyAdapter';
 import { defaultChildStatus, migrateSnapshot, type LegacySnapshot } from './migrate';
 import { preparePage } from '../lib/stroke';
+import { sheetsFor } from '../lib/pageId';
 import { downscalePhoto, blobToDataUrl } from '../lib/image';
 import type { DataStore } from './DataStore';
 import { seedChildren, seedMembers, seedTags } from './seed';
@@ -164,9 +165,7 @@
     childId: string,
     authorId = this.getCurrentMemberId() || 'dad',
   ): Page | undefined {
-    return this.snapshot.pages.find(
-      (page) => page.id === date + '__' + childId + '__' + authorId,
-    );
+    return sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
   }
 
   savePage(page: Page): void {
diff --git a/src/data/migrate.ts b/src/data/migrate.ts
index 85c598394abec3735d904cf7234107ba2124cdd8..f9fcd44cb1693aac5585d753846bf5b007d7f001
--- a/src/data/migrate.ts
+++ b/src/data/migrate.ts
@@ -1,4 +1,5 @@
 import { normalizePageColor } from '../lib/pageColors';
+import { basePageId } from '../lib/pageId';
 import type { LegacyEntry } from './legacyAdapter';
 import type {
   Child,
@@ -164,11 +165,11 @@
         a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
     );
     const owner = notes[0]?.authorId ?? 'dad';
-    owners.set(source.id, source.date + '__' + source.childId + '__' + owner);
+    owners.set(source.id, basePageId(source.date, source.childId, owner));
     for (const authorId of [
       ...new Set([owner, ...notes.map((note) => note.authorId)]),
     ]) {
-      const id = source.date + '__' + source.childId + '__' + authorId;
+      const id = basePageId(source.date, source.childId, authorId);
       const { notes: _, ...rest } = source;
       const value: Page = {
         ...rest,
diff --git a/src/data/supabaseStore.ts b/src/data/supabaseStore.ts
index 8e7946188600aa4ea4e61091c345cefb1e259a94..3f1a707e942ff04b9d521a686e47a5a06e68ee06
--- a/src/data/supabaseStore.ts
+++ b/src/data/supabaseStore.ts
@@ -3,6 +3,7 @@
 import { externalizeSnapshot, hasInlinePhotos } from './importPhotos';
 import { LegacyAdapter } from './legacyAdapter';
 import { preparePage } from '../lib/stroke';
+import { sheetsFor } from '../lib/pageId';
 import { downscalePhoto } from '../lib/image';
 import { enterFamily, loadMembership, makeInvite, inviteRequired, inviteFailure, type FamilyMembership } from './familyAccess';
 import {
@@ -595,9 +596,7 @@
     childId: string,
     authorId = this.membership?.member_id === 'mom' ? 'mom' : 'dad',
   ): Page | undefined {
-    return this.snapshot.pages.find(
-      (page) => page.id === date + '__' + childId + '__' + authorId,
-    );
+    return sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
   }
   savePage(page: Page): void {
     if (page.photos.some((photo) => photo.src.startsWith('data:')))
diff --git a/src/data/types.ts b/src/data/types.ts
index a565623240c4c75b5494dac7f23863356708bebe..896b815d2be90a47dea69f388e141a7902d88765
--- a/src/data/types.ts
+++ b/src/data/types.ts
@@ -85,6 +85,7 @@
   Page,
   'id' | 'date' | 'childId' | 'authorId' | 'color' | 'tagIds' | 'updatedAt'
 > & {
+  createdAt?: string;
   firstLine: string;
   hasDrawing: boolean;
   photoCount: number;
diff --git a/src/features/page/PageScreen.tsx b/src/features/page/PageScreen.tsx
index ca12a5b57216a2324e49cfcc7497dac71bc0268f..239c9bd52feb12996aad9fff76a2cca0917fd4d1
--- a/src/features/page/PageScreen.tsx
+++ b/src/features/page/PageScreen.tsx
@@ -13,6 +13,7 @@
 import { usePageColorStyle } from '../../lib/usePageColorStyle';
 import { noteAuthor } from '../../data/migrate';
 import { preparePage } from '../../lib/stroke';
+import { basePageId, newSheetId, sheetsFor } from '../../lib/pageId';
 import { BadgeSheet } from './BadgeSheet';
 import { CommentsSheet } from './CommentsSheet';
 import { DiarySheet } from './DiarySheet';
@@ -33,6 +34,8 @@
   child,
   date,
   authorId,
+  pageId,
+  onSheet,
   onAuthor,
   startEditing,
   origin,
@@ -45,6 +48,8 @@
   child: Child;
   date: string;
   authorId?: 'dad' | 'mom';
+  pageId?: string;
+  onSheet: (pageId: string) => void;
   onAuthor: (authorId: 'dad' | 'mom') => void;
   startEditing: boolean;
   origin?: PageOrigin;
@@ -53,15 +58,17 @@
   onSaved: (pageId: string) => void;
 }) {
   const [initial] = useState(() => {
-    const saved = store.getPage(date, child.id, authorId);
+    const author = authorId ??
+      noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members);
+    const id = pageId ?? sheetsFor(snapshot.pages, date, child.id, author).slice(-1)[0]?.id ??
+      basePageId(date, child.id, author);
+    const saved = store.getPageById(id);
     const now = new Date().toISOString();
     const blank: Page = {
-      id: `${date}__${child.id}__${authorId ?? noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members)}`,
+      id,
       childId: child.id,
       date,
-      authorId:
-        authorId ??
-        noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members),
+      authorId: author,
       drawing: [],
       photos: [],
       text: '',
@@ -71,15 +78,13 @@
     };
     return {
       saved: !!saved || snapshot.pages.some((page) => page.id === blank.id),
+      loading: !saved && snapshot.pages.some((page) => page.id === id),
       page: structuredClone(saved ?? blank),
     };
   });
   const [page, setPage] = useState(initial.page);
   const baseline = useRef(initial.page);
-  const [loading, setLoading] = useState(
-    !store.getPage(date, child.id, authorId) &&
-      snapshot.pages.some((page) => page.id === initial.page.id),
-  );
+  const [loading, setLoading] = useState(initial.loading);
   useEffect(() => {
     if (!loading) return;
     let active = true;
@@ -109,6 +114,10 @@
     ? undefined
     : noteAuthor(store.getCurrentMemberId(), snapshot.members);
   const ownPage = page.authorId === writer;
+  const savedSheets = sheetsFor(snapshot.pages, date, child.id, page.authorId);
+  const currentSaved = savedSheets.some((sheet) => sheet.id === page.id);
+  const sheets = currentSaved ? savedSheets : [...savedSheets, page];
+  const showSheetNumbers = savedSheets.length >= 2 || (!currentSaved && !!pageId);
   const [drawing, setDrawing] = useState(false);
   const [sheet, setSheet] = useState<'badges' | 'palette' | 'comments'>();
   const [pending, setPending] = useState<() => void>();
@@ -298,6 +307,26 @@
             </button>
           ))}
         </div>
+        <div className="page-sheets" role="group" aria-label="이 날의 장">
+          {showSheetNumbers && sheets.map((sheet, index) => (
+            <button
+              key={sheet.id}
+              aria-label={`${index + 1}번째 장`}
+              aria-pressed={sheet.id === page.id}
+              onClick={() => navigate(() => onSheet(sheet.id))}
+            >
+              {index + 1}
+            </button>
+          ))}
+          {ownPage && !store.readOnly && currentSaved && (
+            <button
+              aria-label="한 장 더 쓰기"
+              onClick={() => navigate(() => onSheet(newSheetId(date, child.id, page.authorId)))}
+            >
+              ＋
+            </button>
+          )}
+        </div>
         <DrawingArea
           page={{ ...page, color: page.color ?? child.pageColor }}
           store={store}
diff --git a/src/features/page/WritingArea.tsx b/src/features/page/WritingArea.tsx
index ef273ae1617da347d1bc699fdc7b2e5bb8501f58..5b03111c483c9f73c3ecd5a100b8228ef5d72582
--- a/src/features/page/WritingArea.tsx
+++ b/src/features/page/WritingArea.tsx
@@ -15,7 +15,7 @@
   return (
     <section className="writing" aria-label={`${name}의 일기`}>
       <div className="notes">
-        {notes.filter((note) => !editing || note.id !== current?.id).map((note) => (
+        {notes.filter((note) => note.text.trim() && (!editing || note.id !== current?.id)).map((note) => (
           <p key={note.id} className={`note ${note.authorId}-writing`}>
             {note.text}
             <span className="initial">{note.authorId === 'dad' ? '아' : '엄'}</span>
diff --git a/src/lib/exportFormat.ts b/src/lib/exportFormat.ts
index 580b521cd97b9d598c2ba3343e908b435c7d6d18..310d396f34f82a3714de28d1724f30f26f633646
--- a/src/lib/exportFormat.ts
+++ b/src/lib/exportFormat.ts
@@ -1,5 +1,6 @@
 import { migrateSnapshot, type LegacySnapshot } from '../data/migrate';
 import type { StoreSnapshot } from '../data/types';
+import { isValidPageId } from './pageId';
 
 export type BackupJson = StoreSnapshot & { version: 3; exportedAt: string };
 
@@ -71,8 +72,7 @@
     data.version === 3 &&
     snapshot.pages.some(
       (page) =>
-        !['dad', 'mom'].includes(page.authorId) ||
-        page.id !== page.date + '__' + page.childId + '__' + page.authorId ||
+        !isValidPageId(page) ||
         typeof page.text !== 'string',
     )
   )
diff --git a/src/lib/pageId.ts b/src/lib/pageId.ts
new file mode 100644
index 0000000000000000000000000000000000000000..96522fdd7bfe8b4306dc4b51be31b25d671fba54
--- /dev/null
+++ b/src/lib/pageId.ts
@@ -0,0 +1,63 @@
+import type { Page } from '../data/types';
+
+export function basePageId(
+  date: string,
+  childId: string,
+  authorId: Page['authorId'],
+): string {
+  return `${date}__${childId}__${authorId}`;
+}
+
+export function newSheetId(
+  date: string,
+  childId: string,
+  authorId: Page['authorId'],
+): string {
+  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
+  let suffix = '';
+  // Rejection sampling keeps all 36 characters equally likely.
+  while (suffix.length < 8) {
+    for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
+      if (byte < 252 && suffix.length < 8) suffix += alphabet[byte % 36];
+    }
+  }
+  return `${basePageId(date, childId, authorId)}__${suffix}`;
+}
+
+export function isValidPageId(
+  page: Pick<Page, 'id' | 'date' | 'childId' | 'authorId'>,
+): boolean {
+  if (
+    typeof page.id !== 'string' ||
+    !/^\d{4}-\d{2}-\d{2}$/.test(page.date) ||
+    typeof page.childId !== 'string' ||
+    !page.childId ||
+    !['dad', 'mom'].includes(page.authorId)
+  )
+    return false;
+  const base = basePageId(page.date, page.childId, page.authorId);
+  return (
+    page.id === base ||
+    (page.id.startsWith(base + '__') &&
+      /^[a-z0-9]{8}$/.test(page.id.slice(base.length + 2)))
+  );
+}
+
+export function sheetsFor(
+  pages: Page[],
+  date: string,
+  childId: string,
+  authorId: string,
+): Page[] {
+  return pages
+    .filter(
+      (page) =>
+        page.date === date &&
+        page.childId === childId &&
+        page.authorId === authorId,
+    )
+    .sort(
+      (a, b) =>
+        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
+    );
+}
diff --git a/src/lib/stroke.ts b/src/lib/stroke.ts
index eeb2602ccc92f797967bab59b66c64def8c1bafd..253c1de265e46f07018c76f5291876f44732f73c
--- a/src/lib/stroke.ts
+++ b/src/lib/stroke.ts
@@ -1,4 +1,5 @@
 import type { Page, Stroke } from '../data/types';
+import { isValidPageId } from './pageId';
 
 export function isStrokeWidth(width: unknown): width is Stroke['width'] {
   return [2, 5, 8, 14, 28].includes(width as number);
@@ -29,13 +30,11 @@
 }
 
 export function preparePage(page: Page): Page {
-  const id = page.date + '__' + page.childId + '__' + page.authorId;
-  if (!['dad', 'mom'].includes(page.authorId) || page.id !== id) {
+  if (!isValidPageId(page)) {
     throw new Error('페이지의 날짜, 아이와 작성자는 바꿀 수 없어요.');
   }
   const result = {
     ...page,
-    id,
     drawing: page.drawing.map((stroke) => {
       if (!isStrokeWidth(stroke.width)) {
         throw new Error('그림 도구의 굵기를 확인해 주세요.');
diff --git a/src/styles/app.css b/src/styles/app.css
index 04aa18bd154ce5eccb83359658fa4914663081a7..9654cc22dda57720d60b97215fc5893e5d6113cd
--- a/src/styles/app.css
+++ b/src/styles/app.css
@@ -8,6 +8,7 @@
 }
 body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg); }
 button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
+input, textarea, select { color: inherit; }
 .artifact-welcome { min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; padding: calc(24px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-inset-bottom)); background: var(--bg); }
 .artifact-welcome h2 { font-size: 22px; }
 .artifact-picker { display: flex; gap: 16px; width: 100%; max-width: 320px; }
@@ -187,10 +188,6 @@
 .action-sheet button:last-child { border-bottom: 0; color: var(--sub); }
 .action-sheet .danger { color: var(--kid1); }
 
-.notes { max-width: 1240px; margin: 40px auto 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
-.note { background: var(--card); border-radius: var(--r-card); padding: 18px; box-shadow: var(--shadow); font-size: 14px; }
-.note h4 { font-size: 15px; margin-bottom: 6px; }
-.note ul { padding-left: 18px; color: var(--sub); }
 .swatches { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
 .sw { width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--line); }
 
diff --git a/src/styles/page.css b/src/styles/page.css
index f30f5abb2d2e20133f2b3b3bf2a7d5b4d5f421a7..2ffdbe722bf73e4276370ba567b709820c2030ca
--- a/src/styles/page.css
+++ b/src/styles/page.css
@@ -227,11 +227,18 @@
   min-height: 176px;
 }
 
-.notes {
+.diary .notes {
+  display: block;
+  margin: 0;
   min-height: 140px;
 }
 
-.note {
+.diary .note {
+  background: none;
+  box-shadow: none;
+  border-radius: 0;
+  padding: 0;
+  font-size: 20px;
   margin-bottom: 14px;
   line-height: 35px;
   white-space: pre-wrap;
@@ -240,7 +247,7 @@
 
 .initial {
   margin-left: 7px;
-  opacity: 0.5;
+  opacity: 0.7;
   font-size: 13px;
 }
 
@@ -545,6 +552,23 @@
   gap: 8px;
   word-break: keep-all;
 }
+.diary .page-sheets {
+  display: flex;
+  justify-content: center;
+  flex: none;
+  height: 44px;
+  overflow-x: auto;
+  color: var(--page-ink);
+}
+.page-sheets button {
+  flex: 0 0 44px;
+  opacity: 0.7;
+}
+.page-sheets button[aria-pressed='true'] {
+  opacity: 1;
+  text-decoration: underline;
+  text-underline-offset: 4px;
+}
 .parent-pages button {
   min-height: 44px;
   padding: 2px 5px;
diff --git a/src/styles/tokens.css b/src/styles/tokens.css
index ef78879c69b0ec08ac3018f3aa658a2b2b9b7347..8524e9344622284da57edbccc696862aca9c36e8
--- a/src/styles/tokens.css
+++ b/src/styles/tokens.css
@@ -1,6 +1,7 @@
 
 /* ===== Design tokens ===== */
 :root {
+  color-scheme: light;
   --bg: #F6F5F2;
   --card: #FFFFFF;
   --surface: #FFFFFF;
@@ -35,6 +36,7 @@
 }
 @media (prefers-color-scheme: dark) {
   :root:not([data-theme="light"]) {
+    color-scheme: dark;
     --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
     --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
     --dad: #8AA6E3; --mom: #E39BB3;
@@ -47,6 +49,7 @@
   }
 }
 :root[data-theme="dark"] {
+  color-scheme: dark;
   --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
   --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
   --dad: #8AA6E3; --mom: #E39BB3;

codex
부모 선택 아래에 높이가 고정된 장 번호 행을 추가하고 있습니다. 목록·달력에서 누른 장은 ID로 정확히 열고, 홈·날짜 이동·부모 전환은 해당 날짜의 마지막 장을 열도록 연결했습니다. 장 이동과 추가에도 기존 미저장 변경 확인을 적용했습니다.

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
const fs = require('node:fs');
for (const file of ['src/features/archive/ArchiveScreen.tsx', 'src/features/calendar/CalendarScreen.tsx', 'src/features/calendar/DayPreview.tsx']) {
  let s = fs.readFileSync(file, 'utf8');
  s = s.replace(\"openPage: (date: string, childId: string, authorId?: 'dad' | 'mom') => void;\", \"openPage: (date: string, childId: string, authorId?: 'dad' | 'mom', pageId?: string) => void;\");
  s = s.replaceAll('openPage(page.date, page.childId, page.authorId)', 'openPage(page.date, page.childId, page.authorId, page.id)');
  s = s.replaceAll('openPage(date, child.id, page?.authorId)', 'openPage(date, child.id, page?.authorId, page?.id)');
  s = s.replaceAll('openPage(date, child.id, page.authorId)', 'openPage(date, child.id, page.authorId, page.id)');
  fs.writeFileSync(file, s);
}
'@ | node" in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
 succeeded in 266ms:
apply patch
patch: completed
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\settings\bookExport.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\settings\bookLayout.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\datedArchive.mjs
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\supabase\migrations\20261102000000_multi_page_sheets.sql
diff --git a/src/App.tsx b/src/App.tsx
index 83254dd1abb764b1b15ec1e793e502bca0d244f2..da02bb99e70fa155611d5ff74b048a8abfbaa1da
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -21,6 +21,7 @@
       date: string;
       childId: string;
       authorId?: 'dad' | 'mom';
+      pageId?: string;
       editing: boolean;
       origin?: PageOrigin;
     };
@@ -54,12 +55,14 @@
     nextDate: string,
     childId: string,
     authorId?: 'dad' | 'mom',
+    pageId?: string,
   ) =>
     setScreen({
       kind: 'page',
       date: nextDate,
       childId,
       authorId,
+      pageId,
       ...source.current,
     });
   const goHome = () => setScreen({ kind: 'shell', tab: '홈' });
@@ -71,17 +74,19 @@
       <>
         <SyncBanner store={store} />
         <PageScreen
-          key={`${screen.date}__${screen.childId}__${screen.authorId ?? store.getCurrentMemberId()}`}
+          key={`${screen.date}__${screen.childId}__${screen.authorId ?? store.getCurrentMemberId()}__${screen.pageId ?? ''}`}
           store={store}
           snapshot={snapshot}
           child={child}
           date={screen.date}
           authorId={screen.authorId}
-          onAuthor={(authorId) => setScreen({ ...screen, authorId })}
+          pageId={screen.pageId}
+          onSheet={(pageId) => setScreen({ ...screen, pageId })}
+          onAuthor={(authorId) => setScreen({ ...screen, authorId, pageId: undefined })}
           startEditing={screen.editing}
           origin={screen.origin}
           onBack={goHome}
-          onDate={(nextDate) => setScreen({ ...screen, date: nextDate })}
+          onDate={(nextDate) => setScreen({ ...screen, date: nextDate, pageId: undefined })}
           onSaved={() => {
             setDate(screen.date);
             setSavedToast(true);
diff --git a/src/data/DataStore.ts b/src/data/DataStore.ts
index f971f02a5dfebfb3d80078f7b9969496a9c389f5..7a060f742f390c8bc42505056d4e66e94fd40b12
--- a/src/data/DataStore.ts
+++ b/src/data/DataStore.ts
@@ -26,6 +26,7 @@
   listMembers(): Member[];
   listTags(): Tag[];
   listPages(range?: PageRange): Page[];
+  getPageById(id: string): Page | undefined;
   getPage(
     date: string,
     childId: string,
diff --git a/src/data/artifactStore.ts b/src/data/artifactStore.ts
index 12bc4bc34c5b1a126e4edb9ed437b89b8e321250..cef23dd0e95e57aaf64f8ca15b024c648033f2c4
--- a/src/data/artifactStore.ts
+++ b/src/data/artifactStore.ts
@@ -1,5 +1,6 @@
 import { normalizePageColor } from '../lib/pageColors';
 import { todayKey } from '../lib/date';
+import { sheetsFor } from '../lib/pageId';
 import { LegacyAdapter } from './legacyAdapter';
 import { migrateMonthSnapshot, defaultChildStatus, defaultPageColor } from './migrate';
 import { preparePage } from '../lib/stroke';
@@ -55,6 +56,7 @@
     tagIds: page.tagIds,
     hasDrawing: page.drawing.length > 0,
     photoCount: page.photos.length,
+    createdAt: page.createdAt,
     updatedAt: page.updatedAt,
     deletedAt: null,
   };
@@ -100,7 +102,7 @@
             tagIds: summary.tagIds,
             drawing: [],
             photos: [],
-            createdAt: summary.updatedAt,
+            createdAt: summary.createdAt ?? summary.updatedAt,
             updatedAt: summary.updatedAt,
           },
     ),
@@ -536,14 +538,17 @@
     childId: string,
     authorId = this.getCurrentMemberId() || 'dad',
   ): Page | undefined {
-    const id = date + '__' + childId + '__' + authorId;
+    const page = sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
+    return page ? this.getPageById(page.id) : undefined;
+  }
+  getPageById(id: string): Page | undefined {
     if (
       this.cache.has(id) ||
       this.pending.some((write) => write.path === 'pages/' + id)
     ) {
       return this.snapshot.pages.find((page) => page.id === id);
     }
-    if (!this.months[date.slice(0, 7)]?.pages[id])
+    if (!this.months[id.slice(0, 7)]?.pages[id])
       return this.snapshot.pages.find((page) => page.id === id);
     return undefined;
   }
diff --git a/src/data/legacyAdapter.ts b/src/data/legacyAdapter.ts
index 4d7ce7f39a0ad9354ba0eeffdc3ef38daa6b4fb9..2709be0fd351ca154fa2f3dee184eeaac556332b
--- a/src/data/legacyAdapter.ts
+++ b/src/data/legacyAdapter.ts
@@ -1,6 +1,7 @@
 import type { DataStore } from './DataStore';
 import type { Child, Page, StoreSnapshot } from './types';
 import { noteAuthor } from './migrate';
+import { basePageId, isValidPageId } from '../lib/pageId';
 
 export type LegacyEntry = {
   id: string;
@@ -34,6 +35,9 @@
   abstract updateChild(child: Child): void;
   abstract uploadPhoto(blob: Blob): Promise<{ src: string }>;
   protected async removePhotoAsset(_src: string): Promise<void> {}
+  getPageById(id: string): Page | undefined {
+    return this.getSnapshot().pages.find((page) => page.id === id);
+  }
   async loadPage(id: string): Promise<Page> {
     const page = this.getSnapshot().pages.find((item) => item.id === id);
     if (!page) throw new Error('페이지를 찾을 수 없어요.');
@@ -111,7 +115,9 @@
   updateEntry(entry: LegacyEntry): void {
     const data = this.getSnapshot();
     const authorId = noteAuthor(entry.authorId, data.members);
-    const id = entry.date + '__' + entry.childId + '__' + authorId;
+    const id = isValidPageId({ ...entry, authorId })
+      ? entry.id
+      : basePageId(entry.date, entry.childId, authorId);
     const page = data.pages.find((item) => item.id === id);
     this.savePage({
       ...page,
diff --git a/src/data/localStore.ts b/src/data/localStore.ts
index 12680619118dcfaea6acc91957a09ed6514c27ba..eb37c8d5740b98661822f2666c16c3dbc28a1cf4
--- a/src/data/localStore.ts
+++ b/src/data/localStore.ts
@@ -3,6 +3,7 @@
 import { LegacyAdapter } from './legacyAdapter';
 import { defaultChildStatus, migrateSnapshot, type LegacySnapshot } from './migrate';
 import { preparePage } from '../lib/stroke';
+import { sheetsFor } from '../lib/pageId';
 import { downscalePhoto, blobToDataUrl } from '../lib/image';
 import type { DataStore } from './DataStore';
 import { seedChildren, seedMembers, seedTags } from './seed';
@@ -164,9 +165,7 @@
     childId: string,
     authorId = this.getCurrentMemberId() || 'dad',
   ): Page | undefined {
-    return this.snapshot.pages.find(
-      (page) => page.id === date + '__' + childId + '__' + authorId,
-    );
+    return sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
   }
 
   savePage(page: Page): void {
diff --git a/src/data/migrate.ts b/src/data/migrate.ts
index 85c598394abec3735d904cf7234107ba2124cdd8..f9fcd44cb1693aac5585d753846bf5b007d7f001
--- a/src/data/migrate.ts
+++ b/src/data/migrate.ts
@@ -1,4 +1,5 @@
 import { normalizePageColor } from '../lib/pageColors';
+import { basePageId } from '../lib/pageId';
 import type { LegacyEntry } from './legacyAdapter';
 import type {
   Child,
@@ -164,11 +165,11 @@
         a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
     );
     const owner = notes[0]?.authorId ?? 'dad';
-    owners.set(source.id, source.date + '__' + source.childId + '__' + owner);
+    owners.set(source.id, basePageId(source.date, source.childId, owner));
     for (const authorId of [
       ...new Set([owner, ...notes.map((note) => note.authorId)]),
     ]) {
-      const id = source.date + '__' + source.childId + '__' + authorId;
+      const id = basePageId(source.date, source.childId, authorId);
       const { notes: _, ...rest } = source;
       const value: Page = {
         ...rest,
diff --git a/src/data/supabaseStore.ts b/src/data/supabaseStore.ts
index 8e7946188600aa4ea4e61091c345cefb1e259a94..3f1a707e942ff04b9d521a686e47a5a06e68ee06
--- a/src/data/supabaseStore.ts
+++ b/src/data/supabaseStore.ts
@@ -3,6 +3,7 @@
 import { externalizeSnapshot, hasInlinePhotos } from './importPhotos';
 import { LegacyAdapter } from './legacyAdapter';
 import { preparePage } from '../lib/stroke';
+import { sheetsFor } from '../lib/pageId';
 import { downscalePhoto } from '../lib/image';
 import { enterFamily, loadMembership, makeInvite, inviteRequired, inviteFailure, type FamilyMembership } from './familyAccess';
 import {
@@ -595,9 +596,7 @@
     childId: string,
     authorId = this.membership?.member_id === 'mom' ? 'mom' : 'dad',
   ): Page | undefined {
-    return this.snapshot.pages.find(
-      (page) => page.id === date + '__' + childId + '__' + authorId,
-    );
+    return sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
   }
   savePage(page: Page): void {
     if (page.photos.some((photo) => photo.src.startsWith('data:')))
diff --git a/src/data/types.ts b/src/data/types.ts
index a565623240c4c75b5494dac7f23863356708bebe..896b815d2be90a47dea69f388e141a7902d88765
--- a/src/data/types.ts
+++ b/src/data/types.ts
@@ -85,6 +85,7 @@
   Page,
   'id' | 'date' | 'childId' | 'authorId' | 'color' | 'tagIds' | 'updatedAt'
 > & {
+  createdAt?: string;
   firstLine: string;
   hasDrawing: boolean;
   photoCount: number;
diff --git a/src/features/page/PageScreen.tsx b/src/features/page/PageScreen.tsx
index ca12a5b57216a2324e49cfcc7497dac71bc0268f..239c9bd52feb12996aad9fff76a2cca0917fd4d1
--- a/src/features/page/PageScreen.tsx
+++ b/src/features/page/PageScreen.tsx
@@ -13,6 +13,7 @@
 import { usePageColorStyle } from '../../lib/usePageColorStyle';
 import { noteAuthor } from '../../data/migrate';
 import { preparePage } from '../../lib/stroke';
+import { basePageId, newSheetId, sheetsFor } from '../../lib/pageId';
 import { BadgeSheet } from './BadgeSheet';
 import { CommentsSheet } from './CommentsSheet';
 import { DiarySheet } from './DiarySheet';
@@ -33,6 +34,8 @@
   child,
   date,
   authorId,
+  pageId,
+  onSheet,
   onAuthor,
   startEditing,
   origin,
@@ -45,6 +48,8 @@
   child: Child;
   date: string;
   authorId?: 'dad' | 'mom';
+  pageId?: string;
+  onSheet: (pageId: string) => void;
   onAuthor: (authorId: 'dad' | 'mom') => void;
   startEditing: boolean;
   origin?: PageOrigin;
@@ -53,15 +58,17 @@
   onSaved: (pageId: string) => void;
 }) {
   const [initial] = useState(() => {
-    const saved = store.getPage(date, child.id, authorId);
+    const author = authorId ??
+      noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members);
+    const id = pageId ?? sheetsFor(snapshot.pages, date, child.id, author).slice(-1)[0]?.id ??
+      basePageId(date, child.id, author);
+    const saved = store.getPageById(id);
     const now = new Date().toISOString();
     const blank: Page = {
-      id: `${date}__${child.id}__${authorId ?? noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members)}`,
+      id,
       childId: child.id,
       date,
-      authorId:
-        authorId ??
-        noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members),
+      authorId: author,
       drawing: [],
       photos: [],
       text: '',
@@ -71,15 +78,13 @@
     };
     return {
       saved: !!saved || snapshot.pages.some((page) => page.id === blank.id),
+      loading: !saved && snapshot.pages.some((page) => page.id === id),
       page: structuredClone(saved ?? blank),
     };
   });
   const [page, setPage] = useState(initial.page);
   const baseline = useRef(initial.page);
-  const [loading, setLoading] = useState(
-    !store.getPage(date, child.id, authorId) &&
-      snapshot.pages.some((page) => page.id === initial.page.id),
-  );
+  const [loading, setLoading] = useState(initial.loading);
   useEffect(() => {
     if (!loading) return;
     let active = true;
@@ -109,6 +114,10 @@
     ? undefined
     : noteAuthor(store.getCurrentMemberId(), snapshot.members);
   const ownPage = page.authorId === writer;
+  const savedSheets = sheetsFor(snapshot.pages, date, child.id, page.authorId);
+  const currentSaved = savedSheets.some((sheet) => sheet.id === page.id);
+  const sheets = currentSaved ? savedSheets : [...savedSheets, page];
+  const showSheetNumbers = savedSheets.length >= 2 || (!currentSaved && !!pageId);
   const [drawing, setDrawing] = useState(false);
   const [sheet, setSheet] = useState<'badges' | 'palette' | 'comments'>();
   const [pending, setPending] = useState<() => void>();
@@ -298,6 +307,26 @@
             </button>
           ))}
         </div>
+        <div className="page-sheets" role="group" aria-label="이 날의 장">
+          {showSheetNumbers && sheets.map((sheet, index) => (
+            <button
+              key={sheet.id}
+              aria-label={`${index + 1}번째 장`}
+              aria-pressed={sheet.id === page.id}
+              onClick={() => navigate(() => onSheet(sheet.id))}
+            >
+              {index + 1}
+            </button>
+          ))}
+          {ownPage && !store.readOnly && currentSaved && (
+            <button
+              aria-label="한 장 더 쓰기"
+              onClick={() => navigate(() => onSheet(newSheetId(date, child.id, page.authorId)))}
+            >
+              ＋
+            </button>
+          )}
+        </div>
         <DrawingArea
           page={{ ...page, color: page.color ?? child.pageColor }}
           store={store}
diff --git a/src/features/page/WritingArea.tsx b/src/features/page/WritingArea.tsx
index ef273ae1617da347d1bc699fdc7b2e5bb8501f58..5b03111c483c9f73c3ecd5a100b8228ef5d72582
--- a/src/features/page/WritingArea.tsx
+++ b/src/features/page/WritingArea.tsx
@@ -15,7 +15,7 @@
   return (
     <section className="writing" aria-label={`${name}의 일기`}>
       <div className="notes">
-        {notes.filter((note) => !editing || note.id !== current?.id).map((note) => (
+        {notes.filter((note) => note.text.trim() && (!editing || note.id !== current?.id)).map((note) => (
           <p key={note.id} className={`note ${note.authorId}-writing`}>
             {note.text}
             <span className="initial">{note.authorId === 'dad' ? '아' : '엄'}</span>
diff --git a/src/features/settings/bookExport.ts b/src/features/settings/bookExport.ts
index 18d005769dac657806ed49beb4341262f4ad212f..29628c2cccfdaa773ff7639d60fb80d1f57d3b04
--- a/src/features/settings/bookExport.ts
+++ b/src/features/settings/bookExport.ts
@@ -1,9 +1,10 @@
 import type { DataStore } from '../../data/DataStore';
 import type { Page, StoreSnapshot } from '../../data/types';
 import { inkFor } from '../../lib/pageColors';
+import { sheetsFor } from '../../lib/pageId';
 import { downloadFile } from '../../lib/download';
 import { paintStroke } from '../page/strokes';
-import { BOOK, bookFilename, fitTextPages, wrapText } from './bookLayout';
+import { BOOK, bookFilename, compareBookSheets, fitTextPages, wrapText } from './bookLayout';
 import { loadPdf, loadZip } from '../../lib/loadExportLibs';
 
 export type BookOptions = {
@@ -167,7 +168,7 @@
         (!options.childId || page.childId === options.childId) &&
         (!options.authorId || page.authorId === options.authorId),
     )
-    .sort((a, b) => a.id.localeCompare(b.id));
+    .sort(compareBookSheets);
   if (!pages.length) throw new Error('선택한 기간에 기록이 없어요.');
   progress(0, pages.length);
   const fonts: FontFace[] = [];
@@ -253,6 +254,9 @@
             all.children.find((child) => child.id === page.childId)?.name ??
               page.childId,
             page.authorId === 'mom' ? '엄마' : '아빠',
+            sheetsFor(pages, page.date, page.childId, page.authorId).findIndex(
+              (sheet) => sheet.id === page.id,
+            ) + 1,
           );
           zip.file(
             pageIndex ? name.replace(/\.png$/, `_${pageIndex + 1}.png`) : name,
diff --git a/src/features/settings/bookLayout.ts b/src/features/settings/bookLayout.ts
index 1d73521acbd3e3e9326c361384ced1e2b928c310..2bc5d7caf1a17c377e83b4e1733443082a8ee2fc
--- a/src/features/settings/bookLayout.ts
+++ b/src/features/settings/bookLayout.ts
@@ -5,11 +5,12 @@
   date: string,
   child: string,
   author: string,
+  sheetNumber = 1,
 ): string {
   const safe = (value: string) =>
     value.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '') ||
     '이름없음';
-  return `${date}_${safe(child)}_${safe(author)}.png`;
+  return `${date}_${safe(child)}_${safe(author)}${sheetNumber > 1 ? `__장${sheetNumber}` : ''}.png`;
 }
 
 export function wrapText(
@@ -48,3 +49,15 @@
   }
   return { size, pages: pages.length ? pages : [[]] };
 }
+import type { Page } from '../../data/types';
+
+export function compareBookSheets(a: Page, b: Page): number {
+  return (
+    a.date.localeCompare(b.date) ||
+    a.childId.localeCompare(b.childId) ||
+    a.authorId.localeCompare(b.authorId) ||
+    a.createdAt.localeCompare(b.createdAt) ||
+    a.id.localeCompare(b.id)
+  );
+}
+
diff --git a/src/lib/datedArchive.mjs b/src/lib/datedArchive.mjs
index d6dd32321d4f90ea119a30b25981521b76a25a66..ab875f0569d6ad27155cd22f6945ef97986e9eec
--- a/src/lib/datedArchive.mjs
+++ b/src/lib/datedArchive.mjs
@@ -1,10 +1,17 @@
+function comparePages(a, b) {
+  return (
+    a.date.localeCompare(b.date) ||
+    a.childId.localeCompare(b.childId) ||
+    a.authorId.localeCompare(b.authorId) ||
+    a.createdAt.localeCompare(b.createdAt) ||
+    a.id.localeCompare(b.id)
+  );
+}
+
 export function toMarkdown(all, month) {
   const pages = all.pages
     .filter((page) => !month || page.date.startsWith(month))
-    .sort(
-      (a, b) =>
-        a.date.localeCompare(b.date) || a.childId.localeCompare(b.childId),
-    );
+    .sort(comparePages);
   const children = new Map(all.children.map((child) => [child.id, child.name]));
   const members = new Map(
     all.members.map((member) => [member.id, member.displayName]),
@@ -71,7 +78,7 @@
     const directory = 'diary/' + date.split('-').join('/');
     const pages = snapshot.pages
       .filter((page) => page.date === date)
-      .sort((a, b) => a.id.localeCompare(b.id));
+      .sort(comparePages);
     for (const page of pages)
       files.push({
         path:
@@ -80,6 +87,9 @@
           encodeURIComponent(page.childId) +
           '-' +
           page.authorId +
+          (page.id === `${page.date}__${page.childId}__${page.authorId}`
+            ? ''
+            : '--' + encodeURIComponent(page.id)) +
           '.json',
         content: JSON.stringify(page, null, 2),
       });
diff --git a/src/lib/exportFormat.ts b/src/lib/exportFormat.ts
index 580b521cd97b9d598c2ba3343e908b435c7d6d18..310d396f34f82a3714de28d1724f30f26f633646
--- a/src/lib/exportFormat.ts
+++ b/src/lib/exportFormat.ts
@@ -1,5 +1,6 @@
 import { migrateSnapshot, type LegacySnapshot } from '../data/migrate';
 import type { StoreSnapshot } from '../data/types';
+import { isValidPageId } from './pageId';
 
 export type BackupJson = StoreSnapshot & { version: 3; exportedAt: string };
 
@@ -71,8 +72,7 @@
     data.version === 3 &&
     snapshot.pages.some(
       (page) =>
-        !['dad', 'mom'].includes(page.authorId) ||
-        page.id !== page.date + '__' + page.childId + '__' + page.authorId ||
+        !isValidPageId(page) ||
         typeof page.text !== 'string',
     )
   )
diff --git a/src/lib/pageId.ts b/src/lib/pageId.ts
new file mode 100644
index 0000000000000000000000000000000000000000..96522fdd7bfe8b4306dc4b51be31b25d671fba54
--- /dev/null
+++ b/src/lib/pageId.ts
@@ -0,0 +1,63 @@
+import type { Page } from '../data/types';
+
+export function basePageId(
+  date: string,
+  childId: string,
+  authorId: Page['authorId'],
+): string {
+  return `${date}__${childId}__${authorId}`;
+}
+
+export function newSheetId(
+  date: string,
+  childId: string,
+  authorId: Page['authorId'],
+): string {
+  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
+  let suffix = '';
+  // Rejection sampling keeps all 36 characters equally likely.
+  while (suffix.length < 8) {
+    for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
+      if (byte < 252 && suffix.length < 8) suffix += alphabet[byte % 36];
+    }
+  }
+  return `${basePageId(date, childId, authorId)}__${suffix}`;
+}
+
+export function isValidPageId(
+  page: Pick<Page, 'id' | 'date' | 'childId' | 'authorId'>,
+): boolean {
+  if (
+    typeof page.id !== 'string' ||
+    !/^\d{4}-\d{2}-\d{2}$/.test(page.date) ||
+    typeof page.childId !== 'string' ||
+    !page.childId ||
+    !['dad', 'mom'].includes(page.authorId)
+  )
+    return false;
+  const base = basePageId(page.date, page.childId, page.authorId);
+  return (
+    page.id === base ||
+    (page.id.startsWith(base + '__') &&
+      /^[a-z0-9]{8}$/.test(page.id.slice(base.length + 2)))
+  );
+}
+
+export function sheetsFor(
+  pages: Page[],
+  date: string,
+  childId: string,
+  authorId: string,
+): Page[] {
+  return pages
+    .filter(
+      (page) =>
+        page.date === date &&
+        page.childId === childId &&
+        page.authorId === authorId,
+    )
+    .sort(
+      (a, b) =>
+        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
+    );
+}
diff --git a/src/lib/stroke.ts b/src/lib/stroke.ts
index eeb2602ccc92f797967bab59b66c64def8c1bafd..253c1de265e46f07018c76f5291876f44732f73c
--- a/src/lib/stroke.ts
+++ b/src/lib/stroke.ts
@@ -1,4 +1,5 @@
 import type { Page, Stroke } from '../data/types';
+import { isValidPageId } from './pageId';
 
 export function isStrokeWidth(width: unknown): width is Stroke['width'] {
   return [2, 5, 8, 14, 28].includes(width as number);
@@ -29,13 +30,11 @@
 }
 
 export function preparePage(page: Page): Page {
-  const id = page.date + '__' + page.childId + '__' + page.authorId;
-  if (!['dad', 'mom'].includes(page.authorId) || page.id !== id) {
+  if (!isValidPageId(page)) {
     throw new Error('페이지의 날짜, 아이와 작성자는 바꿀 수 없어요.');
   }
   const result = {
     ...page,
-    id,
     drawing: page.drawing.map((stroke) => {
       if (!isStrokeWidth(stroke.width)) {
         throw new Error('그림 도구의 굵기를 확인해 주세요.');
diff --git a/src/styles/app.css b/src/styles/app.css
index 04aa18bd154ce5eccb83359658fa4914663081a7..9654cc22dda57720d60b97215fc5893e5d6113cd
--- a/src/styles/app.css
+++ b/src/styles/app.css
@@ -8,6 +8,7 @@
 }
 body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg); }
 button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
+input, textarea, select { color: inherit; }
 .artifact-welcome { min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; padding: calc(24px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-inset-bottom)); background: var(--bg); }
 .artifact-welcome h2 { font-size: 22px; }
 .artifact-picker { display: flex; gap: 16px; width: 100%; max-width: 320px; }
@@ -187,10 +188,6 @@
 .action-sheet button:last-child { border-bottom: 0; color: var(--sub); }
 .action-sheet .danger { color: var(--kid1); }
 
-.notes { max-width: 1240px; margin: 40px auto 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
-.note { background: var(--card); border-radius: var(--r-card); padding: 18px; box-shadow: var(--shadow); font-size: 14px; }
-.note h4 { font-size: 15px; margin-bottom: 6px; }
-.note ul { padding-left: 18px; color: var(--sub); }
 .swatches { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
 .sw { width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--line); }
 
diff --git a/src/styles/page.css b/src/styles/page.css
index f30f5abb2d2e20133f2b3b3bf2a7d5b4d5f421a7..2ffdbe722bf73e4276370ba567b709820c2030ca
--- a/src/styles/page.css
+++ b/src/styles/page.css
@@ -227,11 +227,18 @@
   min-height: 176px;
 }
 
-.notes {
+.diary .notes {
+  display: block;
+  margin: 0;
   min-height: 140px;
 }
 
-.note {
+.diary .note {
+  background: none;
+  box-shadow: none;
+  border-radius: 0;
+  padding: 0;
+  font-size: 20px;
   margin-bottom: 14px;
   line-height: 35px;
   white-space: pre-wrap;
@@ -240,7 +247,7 @@
 
 .initial {
   margin-left: 7px;
-  opacity: 0.5;
+  opacity: 0.7;
   font-size: 13px;
 }
 
@@ -545,6 +552,23 @@
   gap: 8px;
   word-break: keep-all;
 }
+.diary .page-sheets {
+  display: flex;
+  justify-content: center;
+  flex: none;
+  height: 44px;
+  overflow-x: auto;
+  color: var(--page-ink);
+}
+.page-sheets button {
+  flex: 0 0 44px;
+  opacity: 0.7;
+}
+.page-sheets button[aria-pressed='true'] {
+  opacity: 1;
+  text-decoration: underline;
+  text-underline-offset: 4px;
+}
 .parent-pages button {
   min-height: 44px;
   padding: 2px 5px;
diff --git a/src/styles/tokens.css b/src/styles/tokens.css
index ef78879c69b0ec08ac3018f3aa658a2b2b9b7347..8524e9344622284da57edbccc696862aca9c36e8
--- a/src/styles/tokens.css
+++ b/src/styles/tokens.css
@@ -1,6 +1,7 @@
 
 /* ===== Design tokens ===== */
 :root {
+  color-scheme: light;
   --bg: #F6F5F2;
   --card: #FFFFFF;
   --surface: #FFFFFF;
@@ -35,6 +36,7 @@
 }
 @media (prefers-color-scheme: dark) {
   :root:not([data-theme="light"]) {
+    color-scheme: dark;
     --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
     --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
     --dad: #8AA6E3; --mom: #E39BB3;
@@ -47,6 +49,7 @@
   }
 }
 :root[data-theme="dark"] {
+  color-scheme: dark;
   --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
   --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
   --dad: #8AA6E3; --mom: #E39BB3;
diff --git a/supabase/migrations/20261102000000_multi_page_sheets.sql b/supabase/migrations/20261102000000_multi_page_sheets.sql
new file mode 100644
index 0000000000000000000000000000000000000000..2488565de9792010012f2d568049a8db572e7cc9
--- /dev/null
+++ b/supabase/migrations/20261102000000_multi_page_sheets.sql
@@ -0,0 +1,33 @@
+begin;
+
+do $$
+declare
+  id_check text;
+  matches integer;
+begin
+  -- Locate the original unnamed ID check by its definition, not its generated name.
+  select count(*), min(conname::text)
+    into matches, id_check
+  from pg_constraint
+  where conrelid = 'public.pages'::regclass
+    and contype = 'c'
+    and regexp_replace(pg_get_constraintdef(oid), '[[:space:]()]', '', 'g') =
+      'CHECKid=datе::text||''__''::text||child_id||''__''::text||author_id';
+
+  if matches <> 1 then
+    raise exception 'Expected exactly one original pages ID check, found %', matches;
+  end if;
+  execute format('alter table public.pages drop constraint %I', id_check);
+end $$;
+
+alter table public.pages add constraint pages_sheet_id_check check (
+  id = date::text || '__' || child_id || '__' || author_id
+  or (
+    left(id, length(date::text || '__' || child_id || '__' || author_id) + 2) =
+      date::text || '__' || child_id || '__' || author_id || '__'
+    and substring(id from length(date::text || '__' || child_id || '__' || author_id) + 3)
+      ~ '^[a-z0-9]{8}$'
+  )
+);
+
+commit;

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-ChildItem src,scripts/backup -Recurse -File | Where-Object { $_.Name -notmatch '"'test|check|fixture' } | Select-String -Pattern \"__|find\\(.*date|Map<|new Map|\\.split\\(\" | ForEach-Object { '{0}:{1}: {2}' -f "'$_.Path.Replace((Get-Location).Path + '"'\\',''), "'$_.LineNumber, $_.Line.Trim() }; npx tsc -b' in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
 exited 1 in 397ms:
src\App.tsx:77: key={`${screen.date}__${screen.childId}__${screen.authorId ?? store.getCurrentMemberId()}__${screen.pageId ?? ''}`}
src\main.tsx:8: if (__ARTIFACT__) document.documentElement.classList.add('is-artifact');
src\main.tsx:24: if (__ARTIFACT__) {
src\data\artifactStore.ts:55: firstLine: page.text.split('\n')[0].slice(0, 120),
src\data\artifactStore.ts:68: cache = new Map<string, Page>(),
src\data\artifactStore.ts:124: private cache = new Map<string, Page>();
src\data\artifactStore.ts:125: private loading = new Map<string, Promise<Page>>();
src\data\artifactStore.ts:269: const id = reaction.pageId + '__' + reaction.memberId;
src\data\artifactStore.ts:305: const cache = new Map(this.cache);
src\data\artifactStore.ts:349: months[month]?.reactions[reaction.pageId + '__' + reaction.memberId]
src\data\artifactStore.ts:400: const write = this.pending.find((candidate, index) => {
src\data\artifactStore.ts:617: this.monthWrite(month, 'reactions', `${id}__${reaction.memberId}`, {
src\data\artifactStore.ts:657: this.monthWrite(month, 'reactions', `${pageId}__${memberId}`, {
src\data\artifactStore.ts:812: `${entry.id}__${reaction.memberId}`,
src\data\importPhotos.ts:22: const converted = new Map<string, string>();
src\data\migrate.ts:51: id: entry.date + '__' + entry.childId,
src\data\migrate.ts:74: const ids = new Map(
src\data\migrate.ts:118: const aliases = new Map<string, string>();
src\data\migrate.ts:120: const grouped = new Map<string, OldPage>();
src\data\migrate.ts:125: const id = entry.date + '__' + entry.childId;
src\data\migrate.ts:151: const pages = new Map<string, Page>();
src\data\migrate.ts:152: const owners = new Map<string, string>();
src\data\migrate.ts:205: const reactions = new Map<string, Reaction>();
src\data\migrate.ts:208: reactions.set(pageId + '__' + item.memberId, {
src\data\supabaseStore.ts:204: private assetUrls = new Map<string, { url: string; expires: number }>();
src\data\supabaseStore.ts:657: : decodeURIComponent(src.slice(index + marker.length).split('?')[0]);
src\data\supabaseStore.ts:672: ? decodeURIComponent(src.split(marker)[1].split('?')[0])
src\features\archive\ArchiveListRow.tsx:34: {page.text.split('\n')[0] || '글 없이 남긴 기록'}
src\features\archive\archiveView.tsx:5: const fallback = new Map<string, boolean>();
src\features\archive\PageCard.tsx:17: const note = page?.text.split('\n')[0] ?? '';
src\features\home\CropEditor.tsx:17: const pointers = useRef(new Map<number, Point>());
src\features\home\HomeFace.tsx:102: __html: lanternArt
src\features\home\HomeFace.tsx:103: .split('lantern-frame')
src\features\home\HomeScreen.tsx:67: dangerouslySetInnerHTML={{ __html: preferences.day === 'sunset' ? sunsetArt : dandelionArt }}
src\features\page\DrawingArea.tsx:45: const pointers = useRef(new Map<number, { x: number; y: number }>());
src\features\settings\bookLayout.ts:13: return `${date}_${safe(child)}_${safe(author)}${sheetNumber > 1 ? `__장${sheetNumber}` : ''}.png`;
src\features\settings\bookLayout.ts:21: return text.split('\n').flatMap((paragraph) => {
src\lib\datedArchive.mjs:15: const children = new Map(all.children.map((child) => [child.id, child.name]));
src\lib\datedArchive.mjs:16: const members = new Map(
src\lib\datedArchive.mjs:22: const tags = new Map(
src\lib\datedArchive.mjs:36: const [, m, d] = page.date.split('-');
src\lib\datedArchive.mjs:78: const directory = 'diary/' + date.split('-').join('/');
src\lib\datedArchive.mjs:90: (page.id === `${page.date}__${page.childId}__${page.authorId}`
src\lib\exportFormat.ts:86: page.id !== page.date + '__' + page.childId ||
src\lib\loadExportLibs.ts:59: if (__ARTIFACT__) {
src\lib\loadExportLibs.ts:74: if (__ARTIFACT__) {
src\lib\pageId.ts:8: return `${date}__${childId}__${authorId}`;
src\lib\pageId.ts:24: return `${basePageId(date, childId, authorId)}__${suffix}`;
src\lib\pageId.ts:41: (page.id.startsWith(base + '__') &&
src\types\build.d.ts:1: declare const __ARTIFACT__: boolean;
scripts\backup\backup.mjs:27: log(`backup: would write ${relative.split(path.sep).join('/')}`);
scripts\backup\fixtures\two-parents.json:10: "id": "2026-10-26__kid1__mom",
scripts\backup\fixtures\two-parents.json:22: "id": "2026-10-26__kid1__dad",
npx : 이 시스템에서 스크립트를 실행할 수 없으므로 C:\Program Files\nodejs\npx.ps1 파일을 로드할 수 없습니다. 자세한 내용은 about_Execution_Policies(https:/
/go.microsoft.com/fwlink/?LinkID=135170)를 참조하십시오.
위치 줄:2 문자:290
+ ... Location).Path + '\',''), $_.LineNumber, $_.Line.Trim() }; npx tsc -b
+                                                                ~~~
    + CategoryInfo          : 보안 오류: (:) [], PSSecurityException
    + FullyQualifiedErrorId : UnauthorizedAccess

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'Get-Content -Encoding UTF8 src/features/settings/bookLayout.ts; Get-Content -Encoding UTF8 src/data/artifactStore.ts | Select-Object -Skip 290 -First 80; Get-Content -Encoding UTF8 src/data/artifactStore.ts | Select-Object -Skip 740 -First 90; Get-Content -Encoding UTF8 src/features/home/history.ts,src/features/calendar/dayFill.ts,src/features/calendar/calendar.ts; npx.cmd tsc -b' in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
 succeeded in 4456ms:
export const mmToPx = (mm: number, dpi = 300) => Math.round((mm / 25.4) * dpi);
export const BOOK = { width: mmToPx(148), height: mmToPx(210) };

export function bookFilename(
  date: string,
  child: string,
  author: string,
  sheetNumber = 1,
): string {
  const safe = (value: string) =>
    value.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '') ||
    '이름없음';
  return `${date}_${safe(child)}_${safe(author)}${sheetNumber > 1 ? `__장${sheetNumber}` : ''}.png`;
}

export function wrapText(
  context: Pick<CanvasRenderingContext2D, 'measureText'>,
  text: string,
  width: number,
): string[] {
  return text.split('\n').flatMap((paragraph) => {
    const lines: string[] = [];
    let line = '';
    for (const char of paragraph) {
      if (line && context.measureText(line + char).width > width) {
        lines.push(line);
        line = '';
      }
      line += char;
    }
    lines.push(line);
    return lines;
  });
}

export function fitTextPages(
  lines: string[],
  baseSize: number,
  maxHeight: number,
): { size: number; pages: string[][] } {
  let size = baseSize;
  while (size > baseSize * 0.8 && lines.length * size * 1.35 > maxHeight) {
    size -= 1;
  }
  const linesPerPage = Math.max(1, Math.floor(maxHeight / (size * 1.35)));
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }
  return { size, pages: pages.length ? pages : [[]] };
}
import type { Page } from '../../data/types';

export function compareBookSheets(a: Page, b: Page): number {
  return (
    a.date.localeCompare(b.date) ||
    a.childId.localeCompare(b.childId) ||
    a.authorId.localeCompare(b.authorId) ||
    a.createdAt.localeCompare(b.createdAt) ||
    a.id.localeCompare(b.id)
  );
}

  get preparing(): boolean {
    return !this.viewConfig || !this.indexLoaded || !this.legacyLoaded;
  }
  get needsMember(): boolean {
    return !this.readOnly && !this.preparing && !this.getCurrentMemberId();
  }
  getSnapshot = (): StoreSnapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private emit(): void {
    let config = this.config;
    const months = { ...this.months };
    const cache = new Map(this.cache);
    for (const { path, patch } of this.pending) {
      if (path === 'meta/config')
        config = mergeDoc(
          (config as unknown as Body) ?? {},
          patch,
        ) as ArtifactConfig;
      else if (path.startsWith('index/')) {
        const month = path.slice(6);
        months[month] = mergeDoc(
          (months[month] ?? emptyMonth()) as unknown as Body,
          patch,
        ) as MonthDoc;
      } else if (path.startsWith('pages/'))
        cache.set(path.slice(6), patch as unknown as Page);
    }
    this.viewConfig = config;
    this.snapshot = buildArtifactSnapshot(config, months, cache);
    // Read access remains available while migration is pending or only a reader is present.
    for (const [month, doc] of Object.entries(this.legacyMonths)) {
      if (months[month]?.authorPagesV3) continue;
      const legacy = this.convertMonth(doc);
      const known = new Set(this.snapshot.pages.map((page) => page.id));
      this.snapshot.pages.push(
        ...legacy.pages.filter(
          (page) =>
            !known.has(page.id) && !months[month]?.pages[page.id]?.deletedAt,
        ),
      );
      this.snapshot.comments.push(
        ...legacy.comments.filter(
          (comment) =>
            !this.snapshot.comments.some((item) => item.id === comment.id) &&
            !months[month]?.comments[comment.id]?.deletedAt,
        ),
      );
      this.snapshot.reactions.push(
        ...legacy.reactions.filter(
          (reaction) =>
            !this.snapshot.reactions.some(
              (item) =>
                item.pageId === reaction.pageId &&
                item.memberId === reaction.memberId,
            ) &&
            months[month]?.reactions[reaction.pageId + '__' + reaction.memberId]
              ?.on !== false,
        ),
      );
    }
    this.listeners.forEach((listener) => listener());
  }
  private write(writes: Write[]): void {
    if (this.readOnly || !this.viewConfig || !writes.length) return;
    this.pending.push(
      ...(JSON.parse(
        JSON.stringify(writes, (_, value: unknown) =>
          value === undefined ? null : value,
        ),
      ) as Write[]),
    );
    this.emit();
    if (!this.timer) void this.flush();
  }
  private fail(error: unknown): void {
    const reason = error as { code?: string; message?: string };
    if (reason.code === 'revoked' || reason.code === 'not_granted')
  }
  createTag(tag: Tag): void {
    this.updateTag(tag);
  }
  updateTag(tag: Tag): void {
    this.meta('tags', tag.id, tag);
  }
  reorderTags(ids: string[]): void {
    ids.forEach((id, sortOrder) => {
      const tag = this.snapshot.tags.find((item) => item.id === id);
      if (tag) this.updateTag({ ...tag, sortOrder });
    });
  }
  getCurrentMemberId(): string {
    return this.uid ? (this.viewConfig?.memberByUser?.[this.uid] ?? '') : '';
  }
  setCurrentMemberId(id: string): void {
    if (this.uid && (id === 'dad' || id === 'mom'))
      this.meta('memberByUser', this.uid, id);
  }
  exportAll(): StoreSnapshot {
    if (
      this.snapshot.pages.some(
        (page) => !this.getPage(page.date, page.childId, page.authorId),
      )
    )
      throw new Error('페이지를 불러온 뒤 백업해 주세요.');
    return structuredClone(this.snapshot);
  }
  importAll(data: StoreSnapshot): void | Promise<void> {
    if (hasInlinePhotos(data)) {
      return externalizeSnapshot(data, (blob) => this.uploadPhoto(blob)).then(
        (converted) => this.importAll(converted),
      );
    }
    const writes: Write[] = [];
    for (const field of ['children', 'tags', 'members'] as const) {
      for (const value of data[field]) {
        if (!this.snapshot[field].some((item) => item.id === value.id)) {
          writes.push({
            path: 'meta/config',
            patch: { [field]: { [value.id]: value } },
          });
        }
      }
    }
    const pages = data.pages
      .filter(
        (entry) => !this.snapshot.pages.some((item) => item.id === entry.id),
      )
      .map(preparePage);
    for (const entry of pages) {
      const month = entry.date.slice(0, 7);
      writes.push(...this.pageWrites(entry));
      for (const comment of data.comments.filter(
        (item) => item.pageId === entry.id,
      )) {
        writes.push(
          this.monthWrite(month, 'comments', comment.id, {
            ...comment,
            deletedAt: null,
          }),
        );
      }
      for (const reaction of data.reactions.filter(
        (item) => item.pageId === entry.id,
      )) {
        writes.push(
          this.monthWrite(
            month,
            'reactions',
            `${entry.id}__${reaction.memberId}`,
            { ...reaction, on: true },
          ),
        );
      }
    }
    this.write(writes);
  }
}
import type { StoreSnapshot } from '../../data/types';
import { addDays } from '../../lib/date';

export function writtenDays(
  snapshot: Pick<StoreSnapshot, 'pages'>,
  childId: string,
  today: string,
) {
  const dates = new Set(
    snapshot.pages
      .filter((page) => page.childId === childId)
      .map((page) => page.date),
  );
  return Array.from({ length: 30 }, (_, day) =>
    dates.has(addDays(today, -day)),
  );
}
import type { Child, Page } from '../../data/types';
import { displayColor, inkFor } from '../../lib/pageColors';

export function dayFillSegments(
  date: string,
  pages: Pick<Page, 'date' | 'childId'>[],
  children: Pick<Child, 'id' | 'pageColor'>[],
  dark: boolean,
) {
  const recorded = new Set(
    pages.filter((page) => page.date === date).map((page) => page.childId),
  );
  return children.filter((child) => recorded.has(child.id)).map((child) => {
    const color = displayColor(child.pageColor, dark);
    return { childId: child.id, color, ink: inkFor(color) };
  });
}
import type { LegacyEntry as Entry } from '../../data/legacyAdapter';
import { addDays, fromKey, toKey } from '../../lib/date';

export type Filters = {
  childId: string;
  tagIds: string[];
  authorId: string;
  query: string;
};

export const emptyFilters: Filters = {
  childId: '',
  tagIds: [],
  authorId: '',
  query: '',
};

export function matchesFilters(entry: Entry, filters: Filters): boolean {
  return (
    (!filters.childId || entry.childId === filters.childId) &&
    (!filters.authorId || entry.authorId === filters.authorId) &&
    (!filters.tagIds.length || filters.tagIds.some((id) => entry.tagIds.includes(id))) &&
    entry.content.toLocaleLowerCase().includes(filters.query.trim().toLocaleLowerCase())
  );
}

export function monthDays(month: string): string[] {
  const first = fromKey(`${month.slice(0, 7)}-01`);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const count = Math.ceil((first.getDay() + last.getDate()) / 7) * 7;
  const start = addDays(toKey(first), -first.getDay());
  return Array.from({ length: count }, (_, index) => addDays(start, index));
}

export function shiftMonth(month: string, delta: number): string {
  const date = fromKey(`${month.slice(0, 7)}-01`);
  date.setMonth(date.getMonth() + delta);
  return toKey(date);
}

apply patch
patch: completed
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\artifactStore.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\settings\bookLayout.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\supabase\migrations\20261102000000_multi_page_sheets.sql
diff --git a/src/App.tsx b/src/App.tsx
index 83254dd1abb764b1b15ec1e793e502bca0d244f2..da02bb99e70fa155611d5ff74b048a8abfbaa1da
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -21,6 +21,7 @@
       date: string;
       childId: string;
       authorId?: 'dad' | 'mom';
+      pageId?: string;
       editing: boolean;
       origin?: PageOrigin;
     };
@@ -54,12 +55,14 @@
     nextDate: string,
     childId: string,
     authorId?: 'dad' | 'mom',
+    pageId?: string,
   ) =>
     setScreen({
       kind: 'page',
       date: nextDate,
       childId,
       authorId,
+      pageId,
       ...source.current,
     });
   const goHome = () => setScreen({ kind: 'shell', tab: '홈' });
@@ -71,17 +74,19 @@
       <>
         <SyncBanner store={store} />
         <PageScreen
-          key={`${screen.date}__${screen.childId}__${screen.authorId ?? store.getCurrentMemberId()}`}
+          key={`${screen.date}__${screen.childId}__${screen.authorId ?? store.getCurrentMemberId()}__${screen.pageId ?? ''}`}
           store={store}
           snapshot={snapshot}
           child={child}
           date={screen.date}
           authorId={screen.authorId}
-          onAuthor={(authorId) => setScreen({ ...screen, authorId })}
+          pageId={screen.pageId}
+          onSheet={(pageId) => setScreen({ ...screen, pageId })}
+          onAuthor={(authorId) => setScreen({ ...screen, authorId, pageId: undefined })}
           startEditing={screen.editing}
           origin={screen.origin}
           onBack={goHome}
-          onDate={(nextDate) => setScreen({ ...screen, date: nextDate })}
+          onDate={(nextDate) => setScreen({ ...screen, date: nextDate, pageId: undefined })}
           onSaved={() => {
             setDate(screen.date);
             setSavedToast(true);
diff --git a/src/data/DataStore.ts b/src/data/DataStore.ts
index f971f02a5dfebfb3d80078f7b9969496a9c389f5..7a060f742f390c8bc42505056d4e66e94fd40b12
--- a/src/data/DataStore.ts
+++ b/src/data/DataStore.ts
@@ -26,6 +26,7 @@
   listMembers(): Member[];
   listTags(): Tag[];
   listPages(range?: PageRange): Page[];
+  getPageById(id: string): Page | undefined;
   getPage(
     date: string,
     childId: string,
diff --git a/src/data/artifactStore.ts b/src/data/artifactStore.ts
index 12bc4bc34c5b1a126e4edb9ed437b89b8e321250..7dbac6520d3953e8cfe596f8b5782919871326c0
--- a/src/data/artifactStore.ts
+++ b/src/data/artifactStore.ts
@@ -1,5 +1,6 @@
 import { normalizePageColor } from '../lib/pageColors';
 import { todayKey } from '../lib/date';
+import { sheetsFor } from '../lib/pageId';
 import { LegacyAdapter } from './legacyAdapter';
 import { migrateMonthSnapshot, defaultChildStatus, defaultPageColor } from './migrate';
 import { preparePage } from '../lib/stroke';
@@ -55,6 +56,7 @@
     tagIds: page.tagIds,
     hasDrawing: page.drawing.length > 0,
     photoCount: page.photos.length,
+    createdAt: page.createdAt,
     updatedAt: page.updatedAt,
     deletedAt: null,
   };
@@ -100,7 +102,7 @@
             tagIds: summary.tagIds,
             drawing: [],
             photos: [],
-            createdAt: summary.updatedAt,
+            createdAt: summary.createdAt ?? summary.updatedAt,
             updatedAt: summary.updatedAt,
           },
     ),
@@ -536,14 +538,17 @@
     childId: string,
     authorId = this.getCurrentMemberId() || 'dad',
   ): Page | undefined {
-    const id = date + '__' + childId + '__' + authorId;
+    const page = sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
+    return page ? this.getPageById(page.id) : undefined;
+  }
+  getPageById(id: string): Page | undefined {
     if (
       this.cache.has(id) ||
       this.pending.some((write) => write.path === 'pages/' + id)
     ) {
       return this.snapshot.pages.find((page) => page.id === id);
     }
-    if (!this.months[date.slice(0, 7)]?.pages[id])
+    if (!this.months[id.slice(0, 7)]?.pages[id])
       return this.snapshot.pages.find((page) => page.id === id);
     return undefined;
   }
@@ -756,7 +761,7 @@
   exportAll(): StoreSnapshot {
     if (
       this.snapshot.pages.some(
-        (page) => !this.getPage(page.date, page.childId, page.authorId),
+        (page) => !this.getPageById(page.id),
       )
     )
       throw new Error('페이지를 불러온 뒤 백업해 주세요.');
diff --git a/src/data/legacyAdapter.ts b/src/data/legacyAdapter.ts
index 4d7ce7f39a0ad9354ba0eeffdc3ef38daa6b4fb9..2709be0fd351ca154fa2f3dee184eeaac556332b
--- a/src/data/legacyAdapter.ts
+++ b/src/data/legacyAdapter.ts
@@ -1,6 +1,7 @@
 import type { DataStore } from './DataStore';
 import type { Child, Page, StoreSnapshot } from './types';
 import { noteAuthor } from './migrate';
+import { basePageId, isValidPageId } from '../lib/pageId';
 
 export type LegacyEntry = {
   id: string;
@@ -34,6 +35,9 @@
   abstract updateChild(child: Child): void;
   abstract uploadPhoto(blob: Blob): Promise<{ src: string }>;
   protected async removePhotoAsset(_src: string): Promise<void> {}
+  getPageById(id: string): Page | undefined {
+    return this.getSnapshot().pages.find((page) => page.id === id);
+  }
   async loadPage(id: string): Promise<Page> {
     const page = this.getSnapshot().pages.find((item) => item.id === id);
     if (!page) throw new Error('페이지를 찾을 수 없어요.');
@@ -111,7 +115,9 @@
   updateEntry(entry: LegacyEntry): void {
     const data = this.getSnapshot();
     const authorId = noteAuthor(entry.authorId, data.members);
-    const id = entry.date + '__' + entry.childId + '__' + authorId;
+    const id = isValidPageId({ ...entry, authorId })
+      ? entry.id
+      : basePageId(entry.date, entry.childId, authorId);
     const page = data.pages.find((item) => item.id === id);
     this.savePage({
       ...page,
diff --git a/src/data/localStore.ts b/src/data/localStore.ts
index 12680619118dcfaea6acc91957a09ed6514c27ba..eb37c8d5740b98661822f2666c16c3dbc28a1cf4
--- a/src/data/localStore.ts
+++ b/src/data/localStore.ts
@@ -3,6 +3,7 @@
 import { LegacyAdapter } from './legacyAdapter';
 import { defaultChildStatus, migrateSnapshot, type LegacySnapshot } from './migrate';
 import { preparePage } from '../lib/stroke';
+import { sheetsFor } from '../lib/pageId';
 import { downscalePhoto, blobToDataUrl } from '../lib/image';
 import type { DataStore } from './DataStore';
 import { seedChildren, seedMembers, seedTags } from './seed';
@@ -164,9 +165,7 @@
     childId: string,
     authorId = this.getCurrentMemberId() || 'dad',
   ): Page | undefined {
-    return this.snapshot.pages.find(
-      (page) => page.id === date + '__' + childId + '__' + authorId,
-    );
+    return sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
   }
 
   savePage(page: Page): void {
diff --git a/src/data/migrate.ts b/src/data/migrate.ts
index 85c598394abec3735d904cf7234107ba2124cdd8..f9fcd44cb1693aac5585d753846bf5b007d7f001
--- a/src/data/migrate.ts
+++ b/src/data/migrate.ts
@@ -1,4 +1,5 @@
 import { normalizePageColor } from '../lib/pageColors';
+import { basePageId } from '../lib/pageId';
 import type { LegacyEntry } from './legacyAdapter';
 import type {
   Child,
@@ -164,11 +165,11 @@
         a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
     );
     const owner = notes[0]?.authorId ?? 'dad';
-    owners.set(source.id, source.date + '__' + source.childId + '__' + owner);
+    owners.set(source.id, basePageId(source.date, source.childId, owner));
     for (const authorId of [
       ...new Set([owner, ...notes.map((note) => note.authorId)]),
     ]) {
-      const id = source.date + '__' + source.childId + '__' + authorId;
+      const id = basePageId(source.date, source.childId, authorId);
       const { notes: _, ...rest } = source;
       const value: Page = {
         ...rest,
diff --git a/src/data/supabaseStore.ts b/src/data/supabaseStore.ts
index 8e7946188600aa4ea4e61091c345cefb1e259a94..3f1a707e942ff04b9d521a686e47a5a06e68ee06
--- a/src/data/supabaseStore.ts
+++ b/src/data/supabaseStore.ts
@@ -3,6 +3,7 @@
 import { externalizeSnapshot, hasInlinePhotos } from './importPhotos';
 import { LegacyAdapter } from './legacyAdapter';
 import { preparePage } from '../lib/stroke';
+import { sheetsFor } from '../lib/pageId';
 import { downscalePhoto } from '../lib/image';
 import { enterFamily, loadMembership, makeInvite, inviteRequired, inviteFailure, type FamilyMembership } from './familyAccess';
 import {
@@ -595,9 +596,7 @@
     childId: string,
     authorId = this.membership?.member_id === 'mom' ? 'mom' : 'dad',
   ): Page | undefined {
-    return this.snapshot.pages.find(
-      (page) => page.id === date + '__' + childId + '__' + authorId,
-    );
+    return sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
   }
   savePage(page: Page): void {
     if (page.photos.some((photo) => photo.src.startsWith('data:')))
diff --git a/src/data/types.ts b/src/data/types.ts
index a565623240c4c75b5494dac7f23863356708bebe..896b815d2be90a47dea69f388e141a7902d88765
--- a/src/data/types.ts
+++ b/src/data/types.ts
@@ -85,6 +85,7 @@
   Page,
   'id' | 'date' | 'childId' | 'authorId' | 'color' | 'tagIds' | 'updatedAt'
 > & {
+  createdAt?: string;
   firstLine: string;
   hasDrawing: boolean;
   photoCount: number;
diff --git a/src/features/page/PageScreen.tsx b/src/features/page/PageScreen.tsx
index ca12a5b57216a2324e49cfcc7497dac71bc0268f..239c9bd52feb12996aad9fff76a2cca0917fd4d1
--- a/src/features/page/PageScreen.tsx
+++ b/src/features/page/PageScreen.tsx
@@ -13,6 +13,7 @@
 import { usePageColorStyle } from '../../lib/usePageColorStyle';
 import { noteAuthor } from '../../data/migrate';
 import { preparePage } from '../../lib/stroke';
+import { basePageId, newSheetId, sheetsFor } from '../../lib/pageId';
 import { BadgeSheet } from './BadgeSheet';
 import { CommentsSheet } from './CommentsSheet';
 import { DiarySheet } from './DiarySheet';
@@ -33,6 +34,8 @@
   child,
   date,
   authorId,
+  pageId,
+  onSheet,
   onAuthor,
   startEditing,
   origin,
@@ -45,6 +48,8 @@
   child: Child;
   date: string;
   authorId?: 'dad' | 'mom';
+  pageId?: string;
+  onSheet: (pageId: string) => void;
   onAuthor: (authorId: 'dad' | 'mom') => void;
   startEditing: boolean;
   origin?: PageOrigin;
@@ -53,15 +58,17 @@
   onSaved: (pageId: string) => void;
 }) {
   const [initial] = useState(() => {
-    const saved = store.getPage(date, child.id, authorId);
+    const author = authorId ??
+      noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members);
+    const id = pageId ?? sheetsFor(snapshot.pages, date, child.id, author).slice(-1)[0]?.id ??
+      basePageId(date, child.id, author);
+    const saved = store.getPageById(id);
     const now = new Date().toISOString();
     const blank: Page = {
-      id: `${date}__${child.id}__${authorId ?? noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members)}`,
+      id,
       childId: child.id,
       date,
-      authorId:
-        authorId ??
-        noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members),
+      authorId: author,
       drawing: [],
       photos: [],
       text: '',
@@ -71,15 +78,13 @@
     };
     return {
       saved: !!saved || snapshot.pages.some((page) => page.id === blank.id),
+      loading: !saved && snapshot.pages.some((page) => page.id === id),
       page: structuredClone(saved ?? blank),
     };
   });
   const [page, setPage] = useState(initial.page);
   const baseline = useRef(initial.page);
-  const [loading, setLoading] = useState(
-    !store.getPage(date, child.id, authorId) &&
-      snapshot.pages.some((page) => page.id === initial.page.id),
-  );
+  const [loading, setLoading] = useState(initial.loading);
   useEffect(() => {
     if (!loading) return;
     let active = true;
@@ -109,6 +114,10 @@
     ? undefined
     : noteAuthor(store.getCurrentMemberId(), snapshot.members);
   const ownPage = page.authorId === writer;
+  const savedSheets = sheetsFor(snapshot.pages, date, child.id, page.authorId);
+  const currentSaved = savedSheets.some((sheet) => sheet.id === page.id);
+  const sheets = currentSaved ? savedSheets : [...savedSheets, page];
+  const showSheetNumbers = savedSheets.length >= 2 || (!currentSaved && !!pageId);
   const [drawing, setDrawing] = useState(false);
   const [sheet, setSheet] = useState<'badges' | 'palette' | 'comments'>();
   const [pending, setPending] = useState<() => void>();
@@ -298,6 +307,26 @@
             </button>
           ))}
         </div>
+        <div className="page-sheets" role="group" aria-label="이 날의 장">
+          {showSheetNumbers && sheets.map((sheet, index) => (
+            <button
+              key={sheet.id}
+              aria-label={`${index + 1}번째 장`}
+              aria-pressed={sheet.id === page.id}
+              onClick={() => navigate(() => onSheet(sheet.id))}
+            >
+              {index + 1}
+            </button>
+          ))}
+          {ownPage && !store.readOnly && currentSaved && (
+            <button
+              aria-label="한 장 더 쓰기"
+              onClick={() => navigate(() => onSheet(newSheetId(date, child.id, page.authorId)))}
+            >
+              ＋
+            </button>
+          )}
+        </div>
         <DrawingArea
           page={{ ...page, color: page.color ?? child.pageColor }}
           store={store}
diff --git a/src/features/page/WritingArea.tsx b/src/features/page/WritingArea.tsx
index ef273ae1617da347d1bc699fdc7b2e5bb8501f58..5b03111c483c9f73c3ecd5a100b8228ef5d72582
--- a/src/features/page/WritingArea.tsx
+++ b/src/features/page/WritingArea.tsx
@@ -15,7 +15,7 @@
   return (
     <section className="writing" aria-label={`${name}의 일기`}>
       <div className="notes">
-        {notes.filter((note) => !editing || note.id !== current?.id).map((note) => (
+        {notes.filter((note) => note.text.trim() && (!editing || note.id !== current?.id)).map((note) => (
           <p key={note.id} className={`note ${note.authorId}-writing`}>
             {note.text}
             <span className="initial">{note.authorId === 'dad' ? '아' : '엄'}</span>
diff --git a/src/features/settings/bookExport.ts b/src/features/settings/bookExport.ts
index 18d005769dac657806ed49beb4341262f4ad212f..29628c2cccfdaa773ff7639d60fb80d1f57d3b04
--- a/src/features/settings/bookExport.ts
+++ b/src/features/settings/bookExport.ts
@@ -1,9 +1,10 @@
 import type { DataStore } from '../../data/DataStore';
 import type { Page, StoreSnapshot } from '../../data/types';
 import { inkFor } from '../../lib/pageColors';
+import { sheetsFor } from '../../lib/pageId';
 import { downloadFile } from '../../lib/download';
 import { paintStroke } from '../page/strokes';
-import { BOOK, bookFilename, fitTextPages, wrapText } from './bookLayout';
+import { BOOK, bookFilename, compareBookSheets, fitTextPages, wrapText } from './bookLayout';
 import { loadPdf, loadZip } from '../../lib/loadExportLibs';
 
 export type BookOptions = {
@@ -167,7 +168,7 @@
         (!options.childId || page.childId === options.childId) &&
         (!options.authorId || page.authorId === options.authorId),
     )
-    .sort((a, b) => a.id.localeCompare(b.id));
+    .sort(compareBookSheets);
   if (!pages.length) throw new Error('선택한 기간에 기록이 없어요.');
   progress(0, pages.length);
   const fonts: FontFace[] = [];
@@ -253,6 +254,9 @@
             all.children.find((child) => child.id === page.childId)?.name ??
               page.childId,
             page.authorId === 'mom' ? '엄마' : '아빠',
+            sheetsFor(pages, page.date, page.childId, page.authorId).findIndex(
+              (sheet) => sheet.id === page.id,
+            ) + 1,
           );
           zip.file(
             pageIndex ? name.replace(/\.png$/, `_${pageIndex + 1}.png`) : name,
diff --git a/src/features/settings/bookLayout.ts b/src/features/settings/bookLayout.ts
index 1d73521acbd3e3e9326c361384ced1e2b928c310..e73b8254cfd1c77e6789f97ded07ff7ea3f2eefe
--- a/src/features/settings/bookLayout.ts
+++ b/src/features/settings/bookLayout.ts
@@ -1,3 +1,5 @@
+import type { Page } from '../../data/types';
+
 export const mmToPx = (mm: number, dpi = 300) => Math.round((mm / 25.4) * dpi);
 export const BOOK = { width: mmToPx(148), height: mmToPx(210) };
 
@@ -5,11 +7,12 @@
   date: string,
   child: string,
   author: string,
+  sheetNumber = 1,
 ): string {
   const safe = (value: string) =>
     value.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '') ||
     '이름없음';
-  return `${date}_${safe(child)}_${safe(author)}.png`;
+  return `${date}_${safe(child)}_${safe(author)}${sheetNumber > 1 ? `__장${sheetNumber}` : ''}.png`;
 }
 
 export function wrapText(
@@ -48,3 +51,13 @@
   }
   return { size, pages: pages.length ? pages : [[]] };
 }
+export function compareBookSheets(a: Page, b: Page): number {
+  return (
+    a.date.localeCompare(b.date) ||
+    a.childId.localeCompare(b.childId) ||
+    a.authorId.localeCompare(b.authorId) ||
+    a.createdAt.localeCompare(b.createdAt) ||
+    a.id.localeCompare(b.id)
+  );
+}
+
diff --git a/src/lib/datedArchive.mjs b/src/lib/datedArchive.mjs
index d6dd32321d4f90ea119a30b25981521b76a25a66..ab875f0569d6ad27155cd22f6945ef97986e9eec
--- a/src/lib/datedArchive.mjs
+++ b/src/lib/datedArchive.mjs
@@ -1,10 +1,17 @@
+function comparePages(a, b) {
+  return (
+    a.date.localeCompare(b.date) ||
+    a.childId.localeCompare(b.childId) ||
+    a.authorId.localeCompare(b.authorId) ||
+    a.createdAt.localeCompare(b.createdAt) ||
+    a.id.localeCompare(b.id)
+  );
+}
+
 export function toMarkdown(all, month) {
   const pages = all.pages
     .filter((page) => !month || page.date.startsWith(month))
-    .sort(
-      (a, b) =>
-        a.date.localeCompare(b.date) || a.childId.localeCompare(b.childId),
-    );
+    .sort(comparePages);
   const children = new Map(all.children.map((child) => [child.id, child.name]));
   const members = new Map(
     all.members.map((member) => [member.id, member.displayName]),
@@ -71,7 +78,7 @@
     const directory = 'diary/' + date.split('-').join('/');
     const pages = snapshot.pages
       .filter((page) => page.date === date)
-      .sort((a, b) => a.id.localeCompare(b.id));
+      .sort(comparePages);
     for (const page of pages)
       files.push({
         path:
@@ -80,6 +87,9 @@
           encodeURIComponent(page.childId) +
           '-' +
           page.authorId +
+          (page.id === `${page.date}__${page.childId}__${page.authorId}`
+            ? ''
+            : '--' + encodeURIComponent(page.id)) +
           '.json',
         content: JSON.stringify(page, null, 2),
       });
diff --git a/src/lib/exportFormat.ts b/src/lib/exportFormat.ts
index 580b521cd97b9d598c2ba3343e908b435c7d6d18..310d396f34f82a3714de28d1724f30f26f633646
--- a/src/lib/exportFormat.ts
+++ b/src/lib/exportFormat.ts
@@ -1,5 +1,6 @@
 import { migrateSnapshot, type LegacySnapshot } from '../data/migrate';
 import type { StoreSnapshot } from '../data/types';
+import { isValidPageId } from './pageId';
 
 export type BackupJson = StoreSnapshot & { version: 3; exportedAt: string };
 
@@ -71,8 +72,7 @@
     data.version === 3 &&
     snapshot.pages.some(
       (page) =>
-        !['dad', 'mom'].includes(page.authorId) ||
-        page.id !== page.date + '__' + page.childId + '__' + page.authorId ||
+        !isValidPageId(page) ||
         typeof page.text !== 'string',
     )
   )
diff --git a/src/lib/pageId.ts b/src/lib/pageId.ts
new file mode 100644
index 0000000000000000000000000000000000000000..96522fdd7bfe8b4306dc4b51be31b25d671fba54
--- /dev/null
+++ b/src/lib/pageId.ts
@@ -0,0 +1,63 @@
+import type { Page } from '../data/types';
+
+export function basePageId(
+  date: string,
+  childId: string,
+  authorId: Page['authorId'],
+): string {
+  return `${date}__${childId}__${authorId}`;
+}
+
+export function newSheetId(
+  date: string,
+  childId: string,
+  authorId: Page['authorId'],
+): string {
+  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
+  let suffix = '';
+  // Rejection sampling keeps all 36 characters equally likely.
+  while (suffix.length < 8) {
+    for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
+      if (byte < 252 && suffix.length < 8) suffix += alphabet[byte % 36];
+    }
+  }
+  return `${basePageId(date, childId, authorId)}__${suffix}`;
+}
+
+export function isValidPageId(
+  page: Pick<Page, 'id' | 'date' | 'childId' | 'authorId'>,
+): boolean {
+  if (
+    typeof page.id !== 'string' ||
+    !/^\d{4}-\d{2}-\d{2}$/.test(page.date) ||
+    typeof page.childId !== 'string' ||
+    !page.childId ||
+    !['dad', 'mom'].includes(page.authorId)
+  )
+    return false;
+  const base = basePageId(page.date, page.childId, page.authorId);
+  return (
+    page.id === base ||
+    (page.id.startsWith(base + '__') &&
+      /^[a-z0-9]{8}$/.test(page.id.slice(base.length + 2)))
+  );
+}
+
+export function sheetsFor(
+  pages: Page[],
+  date: string,
+  childId: string,
+  authorId: string,
+): Page[] {
+  return pages
+    .filter(
+      (page) =>
+        page.date === date &&
+        page.childId === childId &&
+        page.authorId === authorId,
+    )
+    .sort(
+      (a, b) =>
+        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
+    );
+}
diff --git a/src/lib/stroke.ts b/src/lib/stroke.ts
index eeb2602ccc92f797967bab59b66c64def8c1bafd..253c1de265e46f07018c76f5291876f44732f73c
--- a/src/lib/stroke.ts
+++ b/src/lib/stroke.ts
@@ -1,4 +1,5 @@
 import type { Page, Stroke } from '../data/types';
+import { isValidPageId } from './pageId';
 
 export function isStrokeWidth(width: unknown): width is Stroke['width'] {
   return [2, 5, 8, 14, 28].includes(width as number);
@@ -29,13 +30,11 @@
 }
 
 export function preparePage(page: Page): Page {
-  const id = page.date + '__' + page.childId + '__' + page.authorId;
-  if (!['dad', 'mom'].includes(page.authorId) || page.id !== id) {
+  if (!isValidPageId(page)) {
     throw new Error('페이지의 날짜, 아이와 작성자는 바꿀 수 없어요.');
   }
   const result = {
     ...page,
-    id,
     drawing: page.drawing.map((stroke) => {
       if (!isStrokeWidth(stroke.width)) {
         throw new Error('그림 도구의 굵기를 확인해 주세요.');
diff --git a/src/styles/app.css b/src/styles/app.css
index 04aa18bd154ce5eccb83359658fa4914663081a7..9654cc22dda57720d60b97215fc5893e5d6113cd
--- a/src/styles/app.css
+++ b/src/styles/app.css
@@ -8,6 +8,7 @@
 }
 body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg); }
 button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
+input, textarea, select { color: inherit; }
 .artifact-welcome { min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; padding: calc(24px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-inset-bottom)); background: var(--bg); }
 .artifact-welcome h2 { font-size: 22px; }
 .artifact-picker { display: flex; gap: 16px; width: 100%; max-width: 320px; }
@@ -187,10 +188,6 @@
 .action-sheet button:last-child { border-bottom: 0; color: var(--sub); }
 .action-sheet .danger { color: var(--kid1); }
 
-.notes { max-width: 1240px; margin: 40px auto 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
-.note { background: var(--card); border-radius: var(--r-card); padding: 18px; box-shadow: var(--shadow); font-size: 14px; }
-.note h4 { font-size: 15px; margin-bottom: 6px; }
-.note ul { padding-left: 18px; color: var(--sub); }
 .swatches { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
 .sw { width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--line); }
 
diff --git a/src/styles/page.css b/src/styles/page.css
index f30f5abb2d2e20133f2b3b3bf2a7d5b4d5f421a7..2ffdbe722bf73e4276370ba567b709820c2030ca
--- a/src/styles/page.css
+++ b/src/styles/page.css
@@ -227,11 +227,18 @@
   min-height: 176px;
 }
 
-.notes {
+.diary .notes {
+  display: block;
+  margin: 0;
   min-height: 140px;
 }
 
-.note {
+.diary .note {
+  background: none;
+  box-shadow: none;
+  border-radius: 0;
+  padding: 0;
+  font-size: 20px;
   margin-bottom: 14px;
   line-height: 35px;
   white-space: pre-wrap;
@@ -240,7 +247,7 @@
 
 .initial {
   margin-left: 7px;
-  opacity: 0.5;
+  opacity: 0.7;
   font-size: 13px;
 }
 
@@ -545,6 +552,23 @@
   gap: 8px;
   word-break: keep-all;
 }
+.diary .page-sheets {
+  display: flex;
+  justify-content: center;
+  flex: none;
+  height: 44px;
+  overflow-x: auto;
+  color: var(--page-ink);
+}
+.page-sheets button {
+  flex: 0 0 44px;
+  opacity: 0.7;
+}
+.page-sheets button[aria-pressed='true'] {
+  opacity: 1;
+  text-decoration: underline;
+  text-underline-offset: 4px;
+}
 .parent-pages button {
   min-height: 44px;
   padding: 2px 5px;
diff --git a/src/styles/tokens.css b/src/styles/tokens.css
index ef78879c69b0ec08ac3018f3aa658a2b2b9b7347..8524e9344622284da57edbccc696862aca9c36e8
--- a/src/styles/tokens.css
+++ b/src/styles/tokens.css
@@ -1,6 +1,7 @@
 
 /* ===== Design tokens ===== */
 :root {
+  color-scheme: light;
   --bg: #F6F5F2;
   --card: #FFFFFF;
   --surface: #FFFFFF;
@@ -35,6 +36,7 @@
 }
 @media (prefers-color-scheme: dark) {
   :root:not([data-theme="light"]) {
+    color-scheme: dark;
     --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
     --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
     --dad: #8AA6E3; --mom: #E39BB3;
@@ -47,6 +49,7 @@
   }
 }
 :root[data-theme="dark"] {
+  color-scheme: dark;
   --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
   --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
   --dad: #8AA6E3; --mom: #E39BB3;
diff --git a/supabase/migrations/20261102000000_multi_page_sheets.sql b/supabase/migrations/20261102000000_multi_page_sheets.sql
new file mode 100644
index 0000000000000000000000000000000000000000..1e5bedbd6b90797a3ea023f41e804e32464a5049
--- /dev/null
+++ b/supabase/migrations/20261102000000_multi_page_sheets.sql
@@ -0,0 +1,33 @@
+begin;
+
+do $$
+declare
+  id_check text;
+  matches integer;
+begin
+  -- Locate the original unnamed ID check by its definition, not its generated name.
+  select count(*), min(conname::text)
+    into matches, id_check
+  from pg_constraint
+  where conrelid = 'public.pages'::regclass
+    and contype = 'c'
+    and regexp_replace(pg_get_constraintdef(oid), '[[:space:]()]', '', 'g') =
+      'CHECKid=date::text||''__''::text||child_id||''__''::text||author_id';
+
+  if matches <> 1 then
+    raise exception 'Expected exactly one original pages ID check, found %', matches;
+  end if;
+  execute format('alter table public.pages drop constraint %I', id_check);
+end $$;
+
+alter table public.pages add constraint pages_sheet_id_check check (
+  id = date::text || '__' || child_id || '__' || author_id
+  or (
+    left(id, length(date::text || '__' || child_id || '__' || author_id) + 2) =
+      date::text || '__' || child_id || '__' || author_id || '__'
+    and substring(id from length(date::text || '__' || child_id || '__' || author_id) + 3)
+      ~ '^[a-z0-9]{8}$'
+  )
+);
+
+commit;

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
const fs = require('node:fs');
let s = fs.readFileSync('AGENTS.md', 'utf8');
s = s.replace('**one page per child per day per parent**', '**one or more sheets per child per day per parent**');
s = s.replace('(one child, one day, one parent):', '(one sheet for one child, one day, one parent):');
s = s.replace('switch (swipe or tap), drawing, writing, bottom', 'switch (swipe or tap), a quiet fixed-height sheet-number row with ＋ for another saved own page, drawing, writing, bottom');
s = s.replace('id: "'`${date}__${childId}__${authorId}`;'"', 'id: "'`${date}__${childId}__${authorId}` /* first sheet; additional sheets append __ + 8 random [a-z0-9] characters */;'"');
fs.writeFileSync('AGENTS.md', s);
'@ | node" in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
 succeeded in 261ms:
codex
TypeScript 검사는 통과했습니다. 내보내기도 확인해 날짜별 JSON과 책 ZIP에서 각 장의 파일명이 겹치지 않게 했고, PDF·마크다운은 생성 순서로 정렬했습니다. 이제 세 저장소의 재로딩, 백업 복원, 잘못된 ID 거부를 테스트하겠습니다. SQL 마이그레이션은 파일만 작성하며 실행하지 않습니다.

apply patch
patch: completed
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\artifactStore.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\localStore.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\supabaseStore.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\settings\bookLayout.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\exportFormat.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\pageId.test.ts
diff --git a/src/App.tsx b/src/App.tsx
index 83254dd1abb764b1b15ec1e793e502bca0d244f2..da02bb99e70fa155611d5ff74b048a8abfbaa1da
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -21,6 +21,7 @@
       date: string;
       childId: string;
       authorId?: 'dad' | 'mom';
+      pageId?: string;
       editing: boolean;
       origin?: PageOrigin;
     };
@@ -54,12 +55,14 @@
     nextDate: string,
     childId: string,
     authorId?: 'dad' | 'mom',
+    pageId?: string,
   ) =>
     setScreen({
       kind: 'page',
       date: nextDate,
       childId,
       authorId,
+      pageId,
       ...source.current,
     });
   const goHome = () => setScreen({ kind: 'shell', tab: '홈' });
@@ -71,17 +74,19 @@
       <>
         <SyncBanner store={store} />
         <PageScreen
-          key={`${screen.date}__${screen.childId}__${screen.authorId ?? store.getCurrentMemberId()}`}
+          key={`${screen.date}__${screen.childId}__${screen.authorId ?? store.getCurrentMemberId()}__${screen.pageId ?? ''}`}
           store={store}
           snapshot={snapshot}
           child={child}
           date={screen.date}
           authorId={screen.authorId}
-          onAuthor={(authorId) => setScreen({ ...screen, authorId })}
+          pageId={screen.pageId}
+          onSheet={(pageId) => setScreen({ ...screen, pageId })}
+          onAuthor={(authorId) => setScreen({ ...screen, authorId, pageId: undefined })}
           startEditing={screen.editing}
           origin={screen.origin}
           onBack={goHome}
-          onDate={(nextDate) => setScreen({ ...screen, date: nextDate })}
+          onDate={(nextDate) => setScreen({ ...screen, date: nextDate, pageId: undefined })}
           onSaved={() => {
             setDate(screen.date);
             setSavedToast(true);
diff --git a/src/data/DataStore.ts b/src/data/DataStore.ts
index f971f02a5dfebfb3d80078f7b9969496a9c389f5..7a060f742f390c8bc42505056d4e66e94fd40b12
--- a/src/data/DataStore.ts
+++ b/src/data/DataStore.ts
@@ -26,6 +26,7 @@
   listMembers(): Member[];
   listTags(): Tag[];
   listPages(range?: PageRange): Page[];
+  getPageById(id: string): Page | undefined;
   getPage(
     date: string,
     childId: string,
diff --git a/src/data/artifactStore.test.ts b/src/data/artifactStore.test.ts
index b5713064c8ceb7becb8c1189d59f0918d23a179e..e460b5fda6d74d3376ab7c3bb757b3290bb86fcc
--- a/src/data/artifactStore.test.ts
+++ b/src/data/artifactStore.test.ts
@@ -4,6 +4,31 @@
 import * as images from '../lib/image';
 
 afterEach(() => vi.restoreAllMocks());
+it('preserves and lazily reloads both same-day sheets and checks every body before export', async () => {
+  const db = new FakeDb();
+  const first = page('2020-01-01');
+  const second = { ...first, id: first.id + '__abc12345', text: '두 번째 장', createdAt: '2026-10-26T04:00:00Z' };
+  const store = new ArtifactStore(db, 'viewer');
+  store.savePage(first);
+  store.savePage(second);
+  await settle();
+  store.dispose();
+  const loaded = new ArtifactStore(db, 'viewer');
+  expect(loaded.getPageById(first.id)).toBeUndefined();
+  expect(loaded.getPageById(second.id)).toBeUndefined();
+  expect(await loaded.loadPage(second.id)).toEqual(second);
+  expect(() => loaded.exportAll()).toThrow();
+  expect(await loaded.loadPage(first.id)).toEqual(first);
+  expect(loaded.exportAll().pages).toHaveLength(2);
+  loaded.savePage({ ...first, text: '첫 장 수정', updatedAt: '2026-10-26T05:00:00Z' });
+  await settle();
+  expect(loaded.getPage(first.date, first.childId, first.authorId)?.id).toBe(second.id);
+  expect(loaded.getPageById(second.id)?.text).toBe(second.text);
+  expect(db.bodies.get('index/2020-01')).toMatchObject({
+    pages: { [first.id]: { createdAt: first.createdAt }, [second.id]: { createdAt: second.createdAt } },
+  });
+  loaded.dispose();
+});
 it('writes one full body per page and small index summaries with no media bytes', async () => {
   const db = new FakeDb();
   const store = new ArtifactStore(db, 'viewer');
diff --git a/src/data/artifactStore.ts b/src/data/artifactStore.ts
index 12bc4bc34c5b1a126e4edb9ed437b89b8e321250..7dbac6520d3953e8cfe596f8b5782919871326c0
--- a/src/data/artifactStore.ts
+++ b/src/data/artifactStore.ts
@@ -1,5 +1,6 @@
 import { normalizePageColor } from '../lib/pageColors';
 import { todayKey } from '../lib/date';
+import { sheetsFor } from '../lib/pageId';
 import { LegacyAdapter } from './legacyAdapter';
 import { migrateMonthSnapshot, defaultChildStatus, defaultPageColor } from './migrate';
 import { preparePage } from '../lib/stroke';
@@ -55,6 +56,7 @@
     tagIds: page.tagIds,
     hasDrawing: page.drawing.length > 0,
     photoCount: page.photos.length,
+    createdAt: page.createdAt,
     updatedAt: page.updatedAt,
     deletedAt: null,
   };
@@ -100,7 +102,7 @@
             tagIds: summary.tagIds,
             drawing: [],
             photos: [],
-            createdAt: summary.updatedAt,
+            createdAt: summary.createdAt ?? summary.updatedAt,
             updatedAt: summary.updatedAt,
           },
     ),
@@ -536,14 +538,17 @@
     childId: string,
     authorId = this.getCurrentMemberId() || 'dad',
   ): Page | undefined {
-    const id = date + '__' + childId + '__' + authorId;
+    const page = sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
+    return page ? this.getPageById(page.id) : undefined;
+  }
+  getPageById(id: string): Page | undefined {
     if (
       this.cache.has(id) ||
       this.pending.some((write) => write.path === 'pages/' + id)
     ) {
       return this.snapshot.pages.find((page) => page.id === id);
     }
-    if (!this.months[date.slice(0, 7)]?.pages[id])
+    if (!this.months[id.slice(0, 7)]?.pages[id])
       return this.snapshot.pages.find((page) => page.id === id);
     return undefined;
   }
@@ -756,7 +761,7 @@
   exportAll(): StoreSnapshot {
     if (
       this.snapshot.pages.some(
-        (page) => !this.getPage(page.date, page.childId, page.authorId),
+        (page) => !this.getPageById(page.id),
       )
     )
       throw new Error('페이지를 불러온 뒤 백업해 주세요.');
diff --git a/src/data/legacyAdapter.ts b/src/data/legacyAdapter.ts
index 4d7ce7f39a0ad9354ba0eeffdc3ef38daa6b4fb9..2709be0fd351ca154fa2f3dee184eeaac556332b
--- a/src/data/legacyAdapter.ts
+++ b/src/data/legacyAdapter.ts
@@ -1,6 +1,7 @@
 import type { DataStore } from './DataStore';
 import type { Child, Page, StoreSnapshot } from './types';
 import { noteAuthor } from './migrate';
+import { basePageId, isValidPageId } from '../lib/pageId';
 
 export type LegacyEntry = {
   id: string;
@@ -34,6 +35,9 @@
   abstract updateChild(child: Child): void;
   abstract uploadPhoto(blob: Blob): Promise<{ src: string }>;
   protected async removePhotoAsset(_src: string): Promise<void> {}
+  getPageById(id: string): Page | undefined {
+    return this.getSnapshot().pages.find((page) => page.id === id);
+  }
   async loadPage(id: string): Promise<Page> {
     const page = this.getSnapshot().pages.find((item) => item.id === id);
     if (!page) throw new Error('페이지를 찾을 수 없어요.');
@@ -111,7 +115,9 @@
   updateEntry(entry: LegacyEntry): void {
     const data = this.getSnapshot();
     const authorId = noteAuthor(entry.authorId, data.members);
-    const id = entry.date + '__' + entry.childId + '__' + authorId;
+    const id = isValidPageId({ ...entry, authorId })
+      ? entry.id
+      : basePageId(entry.date, entry.childId, authorId);
     const page = data.pages.find((item) => item.id === id);
     this.savePage({
       ...page,
diff --git a/src/data/localStore.test.ts b/src/data/localStore.test.ts
index ff7912a470d2cc65be0d5a6ae6970cd167c23a28..442dbfda6b4d1aba90ddfa2dafbcf9085a144162
--- a/src/data/localStore.test.ts
+++ b/src/data/localStore.test.ts
@@ -65,6 +65,25 @@
 });
 
 describe('page migration and local persistence', () => {
+  it('saves, reloads and independently updates additional same-day sheets', async () => {
+    const store = new LocalStore();
+    const first = migrateSnapshot(legacy()).pages[0];
+    const second = { ...first, id: first.id + '__abc12345', text: '두 번째 장', createdAt: '2026-10-26T05:00:00Z' };
+    store.savePage(first);
+    store.savePage(second);
+    const loaded = new LocalStore();
+    expect(await loaded.loadPage(first.id)).toEqual(first);
+    expect(await loaded.loadPage(second.id)).toEqual(second);
+    loaded.savePage({ ...second, text: '두 번째 장 수정' });
+    expect(new LocalStore().getPageById(first.id)).toEqual(first);
+    expect(new LocalStore().getPageById(second.id)?.text).toBe('두 번째 장 수정');
+    expect(loaded.getPage(first.date, first.childId, first.authorId)?.id).toBe(second.id);
+    loaded.updateEntry({
+      ...second, content: '호환 경로 수정',
+    });
+    expect(loaded.getPageById(second.id)?.text).toBe('호환 경로 수정');
+    expect(loaded.getPageById(first.id)).toEqual(first);
+  });
   it('normalizes stored page and default child colors on load', () => {
     const data = migrateSnapshot(legacy());
     data.pages[0].color = '#0F4D3A';
diff --git a/src/data/localStore.ts b/src/data/localStore.ts
index 12680619118dcfaea6acc91957a09ed6514c27ba..eb37c8d5740b98661822f2666c16c3dbc28a1cf4
--- a/src/data/localStore.ts
+++ b/src/data/localStore.ts
@@ -3,6 +3,7 @@
 import { LegacyAdapter } from './legacyAdapter';
 import { defaultChildStatus, migrateSnapshot, type LegacySnapshot } from './migrate';
 import { preparePage } from '../lib/stroke';
+import { sheetsFor } from '../lib/pageId';
 import { downscalePhoto, blobToDataUrl } from '../lib/image';
 import type { DataStore } from './DataStore';
 import { seedChildren, seedMembers, seedTags } from './seed';
@@ -164,9 +165,7 @@
     childId: string,
     authorId = this.getCurrentMemberId() || 'dad',
   ): Page | undefined {
-    return this.snapshot.pages.find(
-      (page) => page.id === date + '__' + childId + '__' + authorId,
-    );
+    return sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
   }
 
   savePage(page: Page): void {
diff --git a/src/data/migrate.ts b/src/data/migrate.ts
index 85c598394abec3735d904cf7234107ba2124cdd8..f9fcd44cb1693aac5585d753846bf5b007d7f001
--- a/src/data/migrate.ts
+++ b/src/data/migrate.ts
@@ -1,4 +1,5 @@
 import { normalizePageColor } from '../lib/pageColors';
+import { basePageId } from '../lib/pageId';
 import type { LegacyEntry } from './legacyAdapter';
 import type {
   Child,
@@ -164,11 +165,11 @@
         a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
     );
     const owner = notes[0]?.authorId ?? 'dad';
-    owners.set(source.id, source.date + '__' + source.childId + '__' + owner);
+    owners.set(source.id, basePageId(source.date, source.childId, owner));
     for (const authorId of [
       ...new Set([owner, ...notes.map((note) => note.authorId)]),
     ]) {
-      const id = source.date + '__' + source.childId + '__' + authorId;
+      const id = basePageId(source.date, source.childId, authorId);
       const { notes: _, ...rest } = source;
       const value: Page = {
         ...rest,
diff --git a/src/data/supabaseStore.test.ts b/src/data/supabaseStore.test.ts
index 8d3a728323a7fc1e20faa3e6f6b2e7654c02f7ef..1bfb0421cebbff3358a29390c6a625b8099d9cd7
--- a/src/data/supabaseStore.test.ts
+++ b/src/data/supabaseStore.test.ts
@@ -103,6 +103,28 @@
 });
 afterEach(() => { stores.forEach((store) => store.dispose()); stores = []; vi.unstubAllGlobals(); });
 describe('family SupabaseStore', () => {
+  it('persists, reloads and updates same-day sheets independently by ID', async () => {
+    const server = fakeServer();
+    const store = create(server);
+    await ready(store);
+    const second = { ...page, id: page.id + '__abc12345', text: '두 번째 장', createdAt: '2026-10-26T01:00:00Z' };
+    store.savePage(page);
+    store.savePage(second);
+    vi.stubGlobal('navigator', { onLine: true });
+    store.retry();
+    await vi.waitFor(() => expect(store.getStatus().pending).toBe(0));
+    store.dispose();
+    const loaded = create(server);
+    await ready(loaded);
+    expect(await loaded.loadPage(page.id)).toEqual(page);
+    expect(await loaded.loadPage(second.id)).toEqual(second);
+    expect(loaded.getPage(page.date, page.childId, page.authorId)?.id).toBe(second.id);
+    loaded.savePage({ ...second, text: '두 번째 장 수정' });
+    await vi.waitFor(() => expect(loaded.getStatus().pending).toBe(0));
+    expect(server.rows.pages).toHaveLength(2);
+    expect(loaded.getPageById(page.id)).toEqual(page);
+    expect(loaded.getPageById(second.id)?.text).toBe('두 번째 장 수정');
+  });
   it('queues only the current member font and sends its storage path, including reset', async () => {
     const server = fakeServer();
     const store = create(server);
diff --git a/src/data/supabaseStore.ts b/src/data/supabaseStore.ts
index 8e7946188600aa4ea4e61091c345cefb1e259a94..3f1a707e942ff04b9d521a686e47a5a06e68ee06
--- a/src/data/supabaseStore.ts
+++ b/src/data/supabaseStore.ts
@@ -3,6 +3,7 @@
 import { externalizeSnapshot, hasInlinePhotos } from './importPhotos';
 import { LegacyAdapter } from './legacyAdapter';
 import { preparePage } from '../lib/stroke';
+import { sheetsFor } from '../lib/pageId';
 import { downscalePhoto } from '../lib/image';
 import { enterFamily, loadMembership, makeInvite, inviteRequired, inviteFailure, type FamilyMembership } from './familyAccess';
 import {
@@ -595,9 +596,7 @@
     childId: string,
     authorId = this.membership?.member_id === 'mom' ? 'mom' : 'dad',
   ): Page | undefined {
-    return this.snapshot.pages.find(
-      (page) => page.id === date + '__' + childId + '__' + authorId,
-    );
+    return sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
   }
   savePage(page: Page): void {
     if (page.photos.some((photo) => photo.src.startsWith('data:')))
diff --git a/src/data/types.ts b/src/data/types.ts
index a565623240c4c75b5494dac7f23863356708bebe..896b815d2be90a47dea69f388e141a7902d88765
--- a/src/data/types.ts
+++ b/src/data/types.ts
@@ -85,6 +85,7 @@
   Page,
   'id' | 'date' | 'childId' | 'authorId' | 'color' | 'tagIds' | 'updatedAt'
 > & {
+  createdAt?: string;
   firstLine: string;
   hasDrawing: boolean;
   photoCount: number;
diff --git a/src/features/page/PageScreen.tsx b/src/features/page/PageScreen.tsx
index ca12a5b57216a2324e49cfcc7497dac71bc0268f..239c9bd52feb12996aad9fff76a2cca0917fd4d1
--- a/src/features/page/PageScreen.tsx
+++ b/src/features/page/PageScreen.tsx
@@ -13,6 +13,7 @@
 import { usePageColorStyle } from '../../lib/usePageColorStyle';
 import { noteAuthor } from '../../data/migrate';
 import { preparePage } from '../../lib/stroke';
+import { basePageId, newSheetId, sheetsFor } from '../../lib/pageId';
 import { BadgeSheet } from './BadgeSheet';
 import { CommentsSheet } from './CommentsSheet';
 import { DiarySheet } from './DiarySheet';
@@ -33,6 +34,8 @@
   child,
   date,
   authorId,
+  pageId,
+  onSheet,
   onAuthor,
   startEditing,
   origin,
@@ -45,6 +48,8 @@
   child: Child;
   date: string;
   authorId?: 'dad' | 'mom';
+  pageId?: string;
+  onSheet: (pageId: string) => void;
   onAuthor: (authorId: 'dad' | 'mom') => void;
   startEditing: boolean;
   origin?: PageOrigin;
@@ -53,15 +58,17 @@
   onSaved: (pageId: string) => void;
 }) {
   const [initial] = useState(() => {
-    const saved = store.getPage(date, child.id, authorId);
+    const author = authorId ??
+      noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members);
+    const id = pageId ?? sheetsFor(snapshot.pages, date, child.id, author).slice(-1)[0]?.id ??
+      basePageId(date, child.id, author);
+    const saved = store.getPageById(id);
     const now = new Date().toISOString();
     const blank: Page = {
-      id: `${date}__${child.id}__${authorId ?? noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members)}`,
+      id,
       childId: child.id,
       date,
-      authorId:
-        authorId ??
-        noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members),
+      authorId: author,
       drawing: [],
       photos: [],
       text: '',
@@ -71,15 +78,13 @@
     };
     return {
       saved: !!saved || snapshot.pages.some((page) => page.id === blank.id),
+      loading: !saved && snapshot.pages.some((page) => page.id === id),
       page: structuredClone(saved ?? blank),
     };
   });
   const [page, setPage] = useState(initial.page);
   const baseline = useRef(initial.page);
-  const [loading, setLoading] = useState(
-    !store.getPage(date, child.id, authorId) &&
-      snapshot.pages.some((page) => page.id === initial.page.id),
-  );
+  const [loading, setLoading] = useState(initial.loading);
   useEffect(() => {
     if (!loading) return;
     let active = true;
@@ -109,6 +114,10 @@
     ? undefined
     : noteAuthor(store.getCurrentMemberId(), snapshot.members);
   const ownPage = page.authorId === writer;
+  const savedSheets = sheetsFor(snapshot.pages, date, child.id, page.authorId);
+  const currentSaved = savedSheets.some((sheet) => sheet.id === page.id);
+  const sheets = currentSaved ? savedSheets : [...savedSheets, page];
+  const showSheetNumbers = savedSheets.length >= 2 || (!currentSaved && !!pageId);
   const [drawing, setDrawing] = useState(false);
   const [sheet, setSheet] = useState<'badges' | 'palette' | 'comments'>();
   const [pending, setPending] = useState<() => void>();
@@ -298,6 +307,26 @@
             </button>
           ))}
         </div>
+        <div className="page-sheets" role="group" aria-label="이 날의 장">
+          {showSheetNumbers && sheets.map((sheet, index) => (
+            <button
+              key={sheet.id}
+              aria-label={`${index + 1}번째 장`}
+              aria-pressed={sheet.id === page.id}
+              onClick={() => navigate(() => onSheet(sheet.id))}
+            >
+              {index + 1}
+            </button>
+          ))}
+          {ownPage && !store.readOnly && currentSaved && (
+            <button
+              aria-label="한 장 더 쓰기"
+              onClick={() => navigate(() => onSheet(newSheetId(date, child.id, page.authorId)))}
+            >
+              ＋
+            </button>
+          )}
+        </div>
         <DrawingArea
           page={{ ...page, color: page.color ?? child.pageColor }}
           store={store}
diff --git a/src/features/page/WritingArea.tsx b/src/features/page/WritingArea.tsx
index ef273ae1617da347d1bc699fdc7b2e5bb8501f58..5b03111c483c9f73c3ecd5a100b8228ef5d72582
--- a/src/features/page/WritingArea.tsx
+++ b/src/features/page/WritingArea.tsx
@@ -15,7 +15,7 @@
   return (
     <section className="writing" aria-label={`${name}의 일기`}>
       <div className="notes">
-        {notes.filter((note) => !editing || note.id !== current?.id).map((note) => (
+        {notes.filter((note) => note.text.trim() && (!editing || note.id !== current?.id)).map((note) => (
           <p key={note.id} className={`note ${note.authorId}-writing`}>
             {note.text}
             <span className="initial">{note.authorId === 'dad' ? '아' : '엄'}</span>
diff --git a/src/features/settings/bookExport.ts b/src/features/settings/bookExport.ts
index 18d005769dac657806ed49beb4341262f4ad212f..29628c2cccfdaa773ff7639d60fb80d1f57d3b04
--- a/src/features/settings/bookExport.ts
+++ b/src/features/settings/bookExport.ts
@@ -1,9 +1,10 @@
 import type { DataStore } from '../../data/DataStore';
 import type { Page, StoreSnapshot } from '../../data/types';
 import { inkFor } from '../../lib/pageColors';
+import { sheetsFor } from '../../lib/pageId';
 import { downloadFile } from '../../lib/download';
 import { paintStroke } from '../page/strokes';
-import { BOOK, bookFilename, fitTextPages, wrapText } from './bookLayout';
+import { BOOK, bookFilename, compareBookSheets, fitTextPages, wrapText } from './bookLayout';
 import { loadPdf, loadZip } from '../../lib/loadExportLibs';
 
 export type BookOptions = {
@@ -167,7 +168,7 @@
         (!options.childId || page.childId === options.childId) &&
         (!options.authorId || page.authorId === options.authorId),
     )
-    .sort((a, b) => a.id.localeCompare(b.id));
+    .sort(compareBookSheets);
   if (!pages.length) throw new Error('선택한 기간에 기록이 없어요.');
   progress(0, pages.length);
   const fonts: FontFace[] = [];
@@ -253,6 +254,9 @@
             all.children.find((child) => child.id === page.childId)?.name ??
               page.childId,
             page.authorId === 'mom' ? '엄마' : '아빠',
+            sheetsFor(pages, page.date, page.childId, page.authorId).findIndex(
+              (sheet) => sheet.id === page.id,
+            ) + 1,
           );
           zip.file(
             pageIndex ? name.replace(/\.png$/, `_${pageIndex + 1}.png`) : name,
diff --git a/src/features/settings/bookLayout.test.ts b/src/features/settings/bookLayout.test.ts
index eb122956ac6cddebccf2fb463aac45f6ebe64562..31815cf8136f1c456a73a9340b6edc7a9a093d1d
--- a/src/features/settings/bookLayout.test.ts
+++ b/src/features/settings/bookLayout.test.ts
@@ -1,7 +1,19 @@
 import { describe, expect, it } from 'vitest';
-import { BOOK, bookFilename, fitTextPages, mmToPx, wrapText } from './bookLayout';
+import { BOOK, bookFilename, compareBookSheets, fitTextPages, mmToPx, wrapText } from './bookLayout';
+import { page } from '../../data/testDb';
 
 describe('book layout', () => {
+  it('keeps same-day sheets in creation order and gives each image and continuation its own name', () => {
+    const first = page();
+    const second = { ...first, id: first.id + '__zzzzzzzz', createdAt: '2026-10-26T04:00:00Z' };
+    const third = { ...second, id: first.id + '__aaaaaaaa', createdAt: '2026-10-26T05:00:00Z' };
+    expect([third, second, first].sort(compareBookSheets)).toEqual([first, second, third]);
+    const names = [1, 2, 3].flatMap((number) => {
+      const name = bookFilename(first.date, '조비안', '아빠', number);
+      return [name, name.replace(/\.png$/, '_2.png')];
+    });
+    expect(new Set(names).size).toBe(6);
+  });
   it('rounds A5 millimetres to 300 dpi pixels', () => {
     expect(BOOK).toEqual({ width: 1748, height: 2480 });
     expect(mmToPx(25.4)).toBe(300);
diff --git a/src/features/settings/bookLayout.ts b/src/features/settings/bookLayout.ts
index 1d73521acbd3e3e9326c361384ced1e2b928c310..e73b8254cfd1c77e6789f97ded07ff7ea3f2eefe
--- a/src/features/settings/bookLayout.ts
+++ b/src/features/settings/bookLayout.ts
@@ -1,3 +1,5 @@
+import type { Page } from '../../data/types';
+
 export const mmToPx = (mm: number, dpi = 300) => Math.round((mm / 25.4) * dpi);
 export const BOOK = { width: mmToPx(148), height: mmToPx(210) };
 
@@ -5,11 +7,12 @@
   date: string,
   child: string,
   author: string,
+  sheetNumber = 1,
 ): string {
   const safe = (value: string) =>
     value.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '') ||
     '이름없음';
-  return `${date}_${safe(child)}_${safe(author)}.png`;
+  return `${date}_${safe(child)}_${safe(author)}${sheetNumber > 1 ? `__장${sheetNumber}` : ''}.png`;
 }
 
 export function wrapText(
@@ -48,3 +51,13 @@
   }
   return { size, pages: pages.length ? pages : [[]] };
 }
+export function compareBookSheets(a: Page, b: Page): number {
+  return (
+    a.date.localeCompare(b.date) ||
+    a.childId.localeCompare(b.childId) ||
+    a.authorId.localeCompare(b.authorId) ||
+    a.createdAt.localeCompare(b.createdAt) ||
+    a.id.localeCompare(b.id)
+  );
+}
+
diff --git a/src/lib/datedArchive.mjs b/src/lib/datedArchive.mjs
index d6dd32321d4f90ea119a30b25981521b76a25a66..ab875f0569d6ad27155cd22f6945ef97986e9eec
--- a/src/lib/datedArchive.mjs
+++ b/src/lib/datedArchive.mjs
@@ -1,10 +1,17 @@
+function comparePages(a, b) {
+  return (
+    a.date.localeCompare(b.date) ||
+    a.childId.localeCompare(b.childId) ||
+    a.authorId.localeCompare(b.authorId) ||
+    a.createdAt.localeCompare(b.createdAt) ||
+    a.id.localeCompare(b.id)
+  );
+}
+
 export function toMarkdown(all, month) {
   const pages = all.pages
     .filter((page) => !month || page.date.startsWith(month))
-    .sort(
-      (a, b) =>
-        a.date.localeCompare(b.date) || a.childId.localeCompare(b.childId),
-    );
+    .sort(comparePages);
   const children = new Map(all.children.map((child) => [child.id, child.name]));
   const members = new Map(
     all.members.map((member) => [member.id, member.displayName]),
@@ -71,7 +78,7 @@
     const directory = 'diary/' + date.split('-').join('/');
     const pages = snapshot.pages
       .filter((page) => page.date === date)
-      .sort((a, b) => a.id.localeCompare(b.id));
+      .sort(comparePages);
     for (const page of pages)
       files.push({
         path:
@@ -80,6 +87,9 @@
           encodeURIComponent(page.childId) +
           '-' +
           page.authorId +
+          (page.id === `${page.date}__${page.childId}__${page.authorId}`
+            ? ''
+            : '--' + encodeURIComponent(page.id)) +
           '.json',
         content: JSON.stringify(page, null, 2),
       });
diff --git a/src/lib/exportFormat.test.ts b/src/lib/exportFormat.test.ts
index 784cf902cd7bc3b95314a2e919091f489be90d1e..b570cb06d564c32674c113c21da3590998830e40
--- a/src/lib/exportFormat.test.ts
+++ b/src/lib/exportFormat.test.ts
@@ -1,5 +1,5 @@
 import { describe, expect, it } from 'vitest';
-import { fromBackupJson, toBackupJson, toMarkdown } from './exportFormat';
+import { fromBackupJson, toBackupJson, toMarkdown, toDatedArchive } from './exportFormat';
 import { migrateSnapshot, type LegacySnapshot } from '../data/migrate';
 import { seedChildren, seedMembers, seedTags } from '../data/seed';
 
@@ -38,6 +38,41 @@
 ];
 
 describe('page exports', () => {
+  it('round-trips all same-day sheets with their own media, comments and reactions', () => {
+    const second = {
+      ...all.pages[0],
+      id: all.pages[0].id + '__abc12345',
+      text: '두 번째 장',
+      createdAt: '2026-10-26T01:00:00Z',
+    };
+    const data = {
+      ...all,
+      pages: [second, all.pages[0]],
+      comments: [...all.comments, { ...all.comments[0], id: 'second-comment', pageId: second.id }],
+      reactions: [...all.reactions, { ...all.reactions[0], pageId: second.id }],
+    };
+    expect(fromBackupJson(toBackupJson(data))).toEqual(data);
+    expect(migrateSnapshot(data)).toEqual(data);
+    const files = toDatedArchive(data);
+    const json = files.filter((file) => file.path.endsWith('.json'));
+    expect(new Set(files.map((file) => file.path)).size).toBe(files.length);
+    expect(json.map((file) => JSON.parse(file.content))).toEqual([all.pages[0], second]);
+    const markdown = files.find((file) => file.path.endsWith('.md'))!.content;
+    expect(markdown.indexOf('첫 걸음')).toBeLessThan(markdown.indexOf('두 번째 장'));
+  });
+  it.each([
+    '2026-10-26__kid1__mom',
+    '2026-10-27__kid1__dad',
+    '2026-10-26__kid2__dad',
+    '2026-10-26__kid1__dad__1234567',
+    '2026-10-26__kid1__dad__123456789',
+    '2026-10-26__kid1__dad__ABC12345',
+    '2026-10-26__kid1__dad__abc12345__extra',
+  ])('rejects malformed or mismatched v3 sheet ID %s', (id) => {
+    expect(() => fromBackupJson({
+      ...toBackupJson(all), pages: [{ ...all.pages[0], id }],
+    })).toThrow();
+  });
   it('round-trips v3 including drawings, photos and activity', () => {
     const backup = toBackupJson(all);
     expect(backup.version).toBe(3);
diff --git a/src/lib/exportFormat.ts b/src/lib/exportFormat.ts
index 580b521cd97b9d598c2ba3343e908b435c7d6d18..310d396f34f82a3714de28d1724f30f26f633646
--- a/src/lib/exportFormat.ts
+++ b/src/lib/exportFormat.ts
@@ -1,5 +1,6 @@
 import { migrateSnapshot, type LegacySnapshot } from '../data/migrate';
 import type { StoreSnapshot } from '../data/types';
+import { isValidPageId } from './pageId';
 
 export type BackupJson = StoreSnapshot & { version: 3; exportedAt: string };
 
@@ -71,8 +72,7 @@
     data.version === 3 &&
     snapshot.pages.some(
       (page) =>
-        !['dad', 'mom'].includes(page.authorId) ||
-        page.id !== page.date + '__' + page.childId + '__' + page.authorId ||
+        !isValidPageId(page) ||
         typeof page.text !== 'string',
     )
   )
diff --git a/src/lib/pageId.test.ts b/src/lib/pageId.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..7e00d921642c16354cfa41d1560896aee26b918d
--- /dev/null
+++ b/src/lib/pageId.test.ts
@@ -0,0 +1,77 @@
+import { describe, expect, it } from 'vitest';
+import { basePageId, isValidPageId, newSheetId, sheetsFor } from './pageId';
+import { preparePage } from './stroke';
+import type { Page } from '../data/types';
+
+const page: Page = {
+  id: '2026-11-02__kid1__dad',
+  date: '2026-11-02',
+  childId: 'kid1',
+  authorId: 'dad',
+  text: '첫 장',
+  drawing: [],
+  photos: [],
+  tagIds: [],
+  createdAt: '2026-11-02T00:00:00Z',
+  updatedAt: '2026-11-02T00:00:00Z',
+};
+
+describe('page IDs and sheet order', () => {
+  it('keeps first IDs and generates independent eight-character sheet suffixes', () => {
+    expect(basePageId(page.date, page.childId, page.authorId)).toBe(page.id);
+    const ids = new Set(
+      Array.from({ length: 100 }, () =>
+        newSheetId(page.date, page.childId, page.authorId),
+      ),
+    );
+    expect(ids.size).toBe(100);
+    for (const id of ids) {
+      expect(id).toMatch(/^2026-11-02__kid1__dad__[a-z0-9]{8}$/);
+      expect(isValidPageId({ ...page, id })).toBe(true);
+      expect(preparePage({ ...page, id }).id).toBe(id);
+    }
+    expect(isValidPageId(page)).toBe(true);
+  });
+
+  it.each([
+    '__abc1234',
+    '__abc123456',
+    '__ABC12345',
+    '__abc_1234',
+    '__abc-1234',
+    '__abc12345__extra',
+    '__abc12345\n',
+    '__',
+  ])('rejects malformed suffix %j', (suffix) => {
+    const invalid = { ...page, id: page.id + suffix };
+    expect(isValidPageId(invalid)).toBe(false);
+    expect(() => preparePage(invalid)).toThrow();
+  });
+
+  it('rejects IDs mismatching any identity field', () => {
+    expect(isValidPageId({ ...page, date: '2026-11-03' })).toBe(false);
+    expect(isValidPageId({ ...page, childId: 'kid2' })).toBe(false);
+    expect(isValidPageId({ ...page, authorId: 'mom' })).toBe(false);
+    expect(isValidPageId({ ...page, childId: '' })).toBe(false);
+  });
+
+  it('filters the exact day, child and parent and sorts by creation then ID without mutation', () => {
+    const second = { ...page, id: page.id + '__zzzzzzzz', createdAt: '2026-11-02T01:00:00Z' };
+    const third = { ...second, id: page.id + '__aaaaaaaa', createdAt: '2026-11-02T02:00:00Z' };
+    const tied = { ...third, id: page.id + '__bbbbbbbb' };
+    const pages = [
+      tied,
+      third,
+      second,
+      { ...page, updatedAt: '2026-11-03T00:00:00Z' },
+      { ...page, date: '2026-11-01' },
+      { ...page, childId: 'kid2' },
+      { ...page, authorId: 'mom' as const },
+    ];
+    const before = structuredClone(pages);
+    expect(sheetsFor(pages, page.date, page.childId, page.authorId).map((p) => p.id)).toEqual([
+      page.id, second.id, third.id, tied.id,
+    ]);
+    expect(pages).toEqual(before);
+  });
+});
diff --git a/src/lib/pageId.ts b/src/lib/pageId.ts
new file mode 100644
index 0000000000000000000000000000000000000000..96522fdd7bfe8b4306dc4b51be31b25d671fba54
--- /dev/null
+++ b/src/lib/pageId.ts
@@ -0,0 +1,63 @@
+import type { Page } from '../data/types';
+
+export function basePageId(
+  date: string,
+  childId: string,
+  authorId: Page['authorId'],
+): string {
+  return `${date}__${childId}__${authorId}`;
+}
+
+export function newSheetId(
+  date: string,
+  childId: string,
+  authorId: Page['authorId'],
+): string {
+  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
+  let suffix = '';
+  // Rejection sampling keeps all 36 characters equally likely.
+  while (suffix.length < 8) {
+    for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
+      if (byte < 252 && suffix.length < 8) suffix += alphabet[byte % 36];
+    }
+  }
+  return `${basePageId(date, childId, authorId)}__${suffix}`;
+}
+
+export function isValidPageId(
+  page: Pick<Page, 'id' | 'date' | 'childId' | 'authorId'>,
+): boolean {
+  if (
+    typeof page.id !== 'string' ||
+    !/^\d{4}-\d{2}-\d{2}$/.test(page.date) ||
+    typeof page.childId !== 'string' ||
+    !page.childId ||
+    !['dad', 'mom'].includes(page.authorId)
+  )
+    return false;
+  const base = basePageId(page.date, page.childId, page.authorId);
+  return (
+    page.id === base ||
+    (page.id.startsWith(base + '__') &&
+      /^[a-z0-9]{8}$/.test(page.id.slice(base.length + 2)))
+  );
+}
+
+export function sheetsFor(
+  pages: Page[],
+  date: string,
+  childId: string,
+  authorId: string,
+): Page[] {
+  return pages
+    .filter(
+      (page) =>
+        page.date === date &&
+        page.childId === childId &&
+        page.authorId === authorId,
+    )
+    .sort(
+      (a, b) =>
+        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
+    );
+}
diff --git a/src/lib/stroke.ts b/src/lib/stroke.ts
index eeb2602ccc92f797967bab59b66c64def8c1bafd..253c1de265e46f07018c76f5291876f44732f73c
--- a/src/lib/stroke.ts
+++ b/src/lib/stroke.ts
@@ -1,4 +1,5 @@
 import type { Page, Stroke } from '../data/types';
+import { isValidPageId } from './pageId';
 
 export function isStrokeWidth(width: unknown): width is Stroke['width'] {
   return [2, 5, 8, 14, 28].includes(width as number);
@@ -29,13 +30,11 @@
 }
 
 export function preparePage(page: Page): Page {
-  const id = page.date + '__' + page.childId + '__' + page.authorId;
-  if (!['dad', 'mom'].includes(page.authorId) || page.id !== id) {
+  if (!isValidPageId(page)) {
     throw new Error('페이지의 날짜, 아이와 작성자는 바꿀 수 없어요.');
   }
   const result = {
     ...page,
-    id,
     drawing: page.drawing.map((stroke) => {
       if (!isStrokeWidth(stroke.width)) {
         throw new Error('그림 도구의 굵기를 확인해 주세요.');
diff --git a/src/styles/app.css b/src/styles/app.css
index 04aa18bd154ce5eccb83359658fa4914663081a7..9654cc22dda57720d60b97215fc5893e5d6113cd
--- a/src/styles/app.css
+++ b/src/styles/app.css
@@ -8,6 +8,7 @@
 }
 body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg); }
 button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
+input, textarea, select { color: inherit; }
 .artifact-welcome { min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; padding: calc(24px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-inset-bottom)); background: var(--bg); }
 .artifact-welcome h2 { font-size: 22px; }
 .artifact-picker { display: flex; gap: 16px; width: 100%; max-width: 320px; }
@@ -187,10 +188,6 @@
 .action-sheet button:last-child { border-bottom: 0; color: var(--sub); }
 .action-sheet .danger { color: var(--kid1); }
 
-.notes { max-width: 1240px; margin: 40px auto 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
-.note { background: var(--card); border-radius: var(--r-card); padding: 18px; box-shadow: var(--shadow); font-size: 14px; }
-.note h4 { font-size: 15px; margin-bottom: 6px; }
-.note ul { padding-left: 18px; color: var(--sub); }
 .swatches { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
 .sw { width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--line); }
 
diff --git a/src/styles/page.css b/src/styles/page.css
index f30f5abb2d2e20133f2b3b3bf2a7d5b4d5f421a7..2ffdbe722bf73e4276370ba567b709820c2030ca
--- a/src/styles/page.css
+++ b/src/styles/page.css
@@ -227,11 +227,18 @@
   min-height: 176px;
 }
 
-.notes {
+.diary .notes {
+  display: block;
+  margin: 0;
   min-height: 140px;
 }
 
-.note {
+.diary .note {
+  background: none;
+  box-shadow: none;
+  border-radius: 0;
+  padding: 0;
+  font-size: 20px;
   margin-bottom: 14px;
   line-height: 35px;
   white-space: pre-wrap;
@@ -240,7 +247,7 @@
 
 .initial {
   margin-left: 7px;
-  opacity: 0.5;
+  opacity: 0.7;
   font-size: 13px;
 }
 
@@ -545,6 +552,23 @@
   gap: 8px;
   word-break: keep-all;
 }
+.diary .page-sheets {
+  display: flex;
+  justify-content: center;
+  flex: none;
+  height: 44px;
+  overflow-x: auto;
+  color: var(--page-ink);
+}
+.page-sheets button {
+  flex: 0 0 44px;
+  opacity: 0.7;
+}
+.page-sheets button[aria-pressed='true'] {
+  opacity: 1;
+  text-decoration: underline;
+  text-underline-offset: 4px;
+}
 .parent-pages button {
   min-height: 44px;
   padding: 2px 5px;
diff --git a/src/styles/tokens.css b/src/styles/tokens.css
index ef78879c69b0ec08ac3018f3aa658a2b2b9b7347..8524e9344622284da57edbccc696862aca9c36e8
--- a/src/styles/tokens.css
+++ b/src/styles/tokens.css
@@ -1,6 +1,7 @@
 
 /* ===== Design tokens ===== */
 :root {
+  color-scheme: light;
   --bg: #F6F5F2;
   --card: #FFFFFF;
   --surface: #FFFFFF;
@@ -35,6 +36,7 @@
 }
 @media (prefers-color-scheme: dark) {
   :root:not([data-theme="light"]) {
+    color-scheme: dark;
     --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
     --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
     --dad: #8AA6E3; --mom: #E39BB3;
@@ -47,6 +49,7 @@
   }
 }
 :root[data-theme="dark"] {
+  color-scheme: dark;
   --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
   --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
   --dad: #8AA6E3; --mom: #E39BB3;
diff --git a/supabase/migrations/20261102000000_multi_page_sheets.sql b/supabase/migrations/20261102000000_multi_page_sheets.sql
new file mode 100644
index 0000000000000000000000000000000000000000..1e5bedbd6b90797a3ea023f41e804e32464a5049
--- /dev/null
+++ b/supabase/migrations/20261102000000_multi_page_sheets.sql
@@ -0,0 +1,33 @@
+begin;
+
+do $$
+declare
+  id_check text;
+  matches integer;
+begin
+  -- Locate the original unnamed ID check by its definition, not its generated name.
+  select count(*), min(conname::text)
+    into matches, id_check
+  from pg_constraint
+  where conrelid = 'public.pages'::regclass
+    and contype = 'c'
+    and regexp_replace(pg_get_constraintdef(oid), '[[:space:]()]', '', 'g') =
+      'CHECKid=date::text||''__''::text||child_id||''__''::text||author_id';
+
+  if matches <> 1 then
+    raise exception 'Expected exactly one original pages ID check, found %', matches;
+  end if;
+  execute format('alter table public.pages drop constraint %I', id_check);
+end $$;
+
+alter table public.pages add constraint pages_sheet_id_check check (
+  id = date::text || '__' || child_id || '__' || author_id
+  or (
+    left(id, length(date::text || '__' || child_id || '__' || author_id) + 2) =
+      date::text || '__' || child_id || '__' || author_id || '__'
+    and substring(id from length(date::text || '__' || child_id || '__' || author_id) + 3)
+      ~ '^[a-z0-9]{8}$'
+  )
+);
+
+commit;

apply patch
patch: completed
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\scripts\backup\backup.check.mjs
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\pageId.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\supabase\migrations\20261102000000_multi_page_sheets.sql
diff --git a/scripts/backup/backup.check.mjs b/scripts/backup/backup.check.mjs
index 93c14b559fda0e5000ca229445592daf9bffb72c..31e898950ea6096e2c6fd0b3db73dfbfb47a64db
--- a/scripts/backup/backup.check.mjs
+++ b/scripts/backup/backup.check.mjs
@@ -19,6 +19,34 @@
   new URL('./fixtures/two-parents.json', import.meta.url),
 );
 
+test('dated archives preserve multiple sheets for one parent in creation order', async () => {
+  const snapshot = JSON.parse(await readFile(fixture, 'utf8'));
+  const first = snapshot.pages.find((page) => page.authorId === 'dad');
+  const second = {
+    ...first,
+    id: first.id + '__zzzzzzzz',
+    text: '두 번째 장',
+    createdAt: '2026-10-26T20:00:00Z',
+  };
+  const third = {
+    ...second,
+    id: first.id + '__aaaaaaaa',
+    text: '세 번째 장',
+    createdAt: '2026-10-26T21:00:00Z',
+  };
+  snapshot.pages = [third, second, ...snapshot.pages];
+  const files = toDatedArchive(snapshot);
+  assert.equal(new Set(files.map((file) => file.path)).size, files.length);
+  assert.deepEqual(
+    files.filter((file) => file.path.endsWith('.json'))
+      .map((file) => JSON.parse(file.content).id),
+    [first.id, second.id, third.id, snapshot.pages.find((page) => page.authorId === 'mom').id],
+  );
+  const markdown = files.find((file) => file.path.endsWith('.md')).content;
+  assert.ok(markdown.indexOf('아빠 기록') < markdown.indexOf('두 번째 장'));
+  assert.ok(markdown.indexOf('두 번째 장') < markdown.indexOf('세 번째 장'));
+});
+
 test('dated backup dry-run and incremental writes preserve old files and both parents', async () => {
   const directory = await mkdtemp(path.join(tmpdir(), 'diary-backup-'));
   const run = (...args) =>
diff --git a/src/App.tsx b/src/App.tsx
index 83254dd1abb764b1b15ec1e793e502bca0d244f2..da02bb99e70fa155611d5ff74b048a8abfbaa1da
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -21,6 +21,7 @@
       date: string;
       childId: string;
       authorId?: 'dad' | 'mom';
+      pageId?: string;
       editing: boolean;
       origin?: PageOrigin;
     };
@@ -54,12 +55,14 @@
     nextDate: string,
     childId: string,
     authorId?: 'dad' | 'mom',
+    pageId?: string,
   ) =>
     setScreen({
       kind: 'page',
       date: nextDate,
       childId,
       authorId,
+      pageId,
       ...source.current,
     });
   const goHome = () => setScreen({ kind: 'shell', tab: '홈' });
@@ -71,17 +74,19 @@
       <>
         <SyncBanner store={store} />
         <PageScreen
-          key={`${screen.date}__${screen.childId}__${screen.authorId ?? store.getCurrentMemberId()}`}
+          key={`${screen.date}__${screen.childId}__${screen.authorId ?? store.getCurrentMemberId()}__${screen.pageId ?? ''}`}
           store={store}
           snapshot={snapshot}
           child={child}
           date={screen.date}
           authorId={screen.authorId}
-          onAuthor={(authorId) => setScreen({ ...screen, authorId })}
+          pageId={screen.pageId}
+          onSheet={(pageId) => setScreen({ ...screen, pageId })}
+          onAuthor={(authorId) => setScreen({ ...screen, authorId, pageId: undefined })}
           startEditing={screen.editing}
           origin={screen.origin}
           onBack={goHome}
-          onDate={(nextDate) => setScreen({ ...screen, date: nextDate })}
+          onDate={(nextDate) => setScreen({ ...screen, date: nextDate, pageId: undefined })}
           onSaved={() => {
             setDate(screen.date);
             setSavedToast(true);
diff --git a/src/data/DataStore.ts b/src/data/DataStore.ts
index f971f02a5dfebfb3d80078f7b9969496a9c389f5..7a060f742f390c8bc42505056d4e66e94fd40b12
--- a/src/data/DataStore.ts
+++ b/src/data/DataStore.ts
@@ -26,6 +26,7 @@
   listMembers(): Member[];
   listTags(): Tag[];
   listPages(range?: PageRange): Page[];
+  getPageById(id: string): Page | undefined;
   getPage(
     date: string,
     childId: string,
diff --git a/src/data/artifactStore.test.ts b/src/data/artifactStore.test.ts
index b5713064c8ceb7becb8c1189d59f0918d23a179e..e460b5fda6d74d3376ab7c3bb757b3290bb86fcc
--- a/src/data/artifactStore.test.ts
+++ b/src/data/artifactStore.test.ts
@@ -4,6 +4,31 @@
 import * as images from '../lib/image';
 
 afterEach(() => vi.restoreAllMocks());
+it('preserves and lazily reloads both same-day sheets and checks every body before export', async () => {
+  const db = new FakeDb();
+  const first = page('2020-01-01');
+  const second = { ...first, id: first.id + '__abc12345', text: '두 번째 장', createdAt: '2026-10-26T04:00:00Z' };
+  const store = new ArtifactStore(db, 'viewer');
+  store.savePage(first);
+  store.savePage(second);
+  await settle();
+  store.dispose();
+  const loaded = new ArtifactStore(db, 'viewer');
+  expect(loaded.getPageById(first.id)).toBeUndefined();
+  expect(loaded.getPageById(second.id)).toBeUndefined();
+  expect(await loaded.loadPage(second.id)).toEqual(second);
+  expect(() => loaded.exportAll()).toThrow();
+  expect(await loaded.loadPage(first.id)).toEqual(first);
+  expect(loaded.exportAll().pages).toHaveLength(2);
+  loaded.savePage({ ...first, text: '첫 장 수정', updatedAt: '2026-10-26T05:00:00Z' });
+  await settle();
+  expect(loaded.getPage(first.date, first.childId, first.authorId)?.id).toBe(second.id);
+  expect(loaded.getPageById(second.id)?.text).toBe(second.text);
+  expect(db.bodies.get('index/2020-01')).toMatchObject({
+    pages: { [first.id]: { createdAt: first.createdAt }, [second.id]: { createdAt: second.createdAt } },
+  });
+  loaded.dispose();
+});
 it('writes one full body per page and small index summaries with no media bytes', async () => {
   const db = new FakeDb();
   const store = new ArtifactStore(db, 'viewer');
diff --git a/src/data/artifactStore.ts b/src/data/artifactStore.ts
index 12bc4bc34c5b1a126e4edb9ed437b89b8e321250..7dbac6520d3953e8cfe596f8b5782919871326c0
--- a/src/data/artifactStore.ts
+++ b/src/data/artifactStore.ts
@@ -1,5 +1,6 @@
 import { normalizePageColor } from '../lib/pageColors';
 import { todayKey } from '../lib/date';
+import { sheetsFor } from '../lib/pageId';
 import { LegacyAdapter } from './legacyAdapter';
 import { migrateMonthSnapshot, defaultChildStatus, defaultPageColor } from './migrate';
 import { preparePage } from '../lib/stroke';
@@ -55,6 +56,7 @@
     tagIds: page.tagIds,
     hasDrawing: page.drawing.length > 0,
     photoCount: page.photos.length,
+    createdAt: page.createdAt,
     updatedAt: page.updatedAt,
     deletedAt: null,
   };
@@ -100,7 +102,7 @@
             tagIds: summary.tagIds,
             drawing: [],
             photos: [],
-            createdAt: summary.updatedAt,
+            createdAt: summary.createdAt ?? summary.updatedAt,
             updatedAt: summary.updatedAt,
           },
     ),
@@ -536,14 +538,17 @@
     childId: string,
     authorId = this.getCurrentMemberId() || 'dad',
   ): Page | undefined {
-    const id = date + '__' + childId + '__' + authorId;
+    const page = sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
+    return page ? this.getPageById(page.id) : undefined;
+  }
+  getPageById(id: string): Page | undefined {
     if (
       this.cache.has(id) ||
       this.pending.some((write) => write.path === 'pages/' + id)
     ) {
       return this.snapshot.pages.find((page) => page.id === id);
     }
-    if (!this.months[date.slice(0, 7)]?.pages[id])
+    if (!this.months[id.slice(0, 7)]?.pages[id])
       return this.snapshot.pages.find((page) => page.id === id);
     return undefined;
   }
@@ -756,7 +761,7 @@
   exportAll(): StoreSnapshot {
     if (
       this.snapshot.pages.some(
-        (page) => !this.getPage(page.date, page.childId, page.authorId),
+        (page) => !this.getPageById(page.id),
       )
     )
       throw new Error('페이지를 불러온 뒤 백업해 주세요.');
diff --git a/src/data/legacyAdapter.ts b/src/data/legacyAdapter.ts
index 4d7ce7f39a0ad9354ba0eeffdc3ef38daa6b4fb9..2709be0fd351ca154fa2f3dee184eeaac556332b
--- a/src/data/legacyAdapter.ts
+++ b/src/data/legacyAdapter.ts
@@ -1,6 +1,7 @@
 import type { DataStore } from './DataStore';
 import type { Child, Page, StoreSnapshot } from './types';
 import { noteAuthor } from './migrate';
+import { basePageId, isValidPageId } from '../lib/pageId';
 
 export type LegacyEntry = {
   id: string;
@@ -34,6 +35,9 @@
   abstract updateChild(child: Child): void;
   abstract uploadPhoto(blob: Blob): Promise<{ src: string }>;
   protected async removePhotoAsset(_src: string): Promise<void> {}
+  getPageById(id: string): Page | undefined {
+    return this.getSnapshot().pages.find((page) => page.id === id);
+  }
   async loadPage(id: string): Promise<Page> {
     const page = this.getSnapshot().pages.find((item) => item.id === id);
     if (!page) throw new Error('페이지를 찾을 수 없어요.');
@@ -111,7 +115,9 @@
   updateEntry(entry: LegacyEntry): void {
     const data = this.getSnapshot();
     const authorId = noteAuthor(entry.authorId, data.members);
-    const id = entry.date + '__' + entry.childId + '__' + authorId;
+    const id = isValidPageId({ ...entry, authorId })
+      ? entry.id
+      : basePageId(entry.date, entry.childId, authorId);
     const page = data.pages.find((item) => item.id === id);
     this.savePage({
       ...page,
diff --git a/src/data/localStore.test.ts b/src/data/localStore.test.ts
index ff7912a470d2cc65be0d5a6ae6970cd167c23a28..442dbfda6b4d1aba90ddfa2dafbcf9085a144162
--- a/src/data/localStore.test.ts
+++ b/src/data/localStore.test.ts
@@ -65,6 +65,25 @@
 });
 
 describe('page migration and local persistence', () => {
+  it('saves, reloads and independently updates additional same-day sheets', async () => {
+    const store = new LocalStore();
+    const first = migrateSnapshot(legacy()).pages[0];
+    const second = { ...first, id: first.id + '__abc12345', text: '두 번째 장', createdAt: '2026-10-26T05:00:00Z' };
+    store.savePage(first);
+    store.savePage(second);
+    const loaded = new LocalStore();
+    expect(await loaded.loadPage(first.id)).toEqual(first);
+    expect(await loaded.loadPage(second.id)).toEqual(second);
+    loaded.savePage({ ...second, text: '두 번째 장 수정' });
+    expect(new LocalStore().getPageById(first.id)).toEqual(first);
+    expect(new LocalStore().getPageById(second.id)?.text).toBe('두 번째 장 수정');
+    expect(loaded.getPage(first.date, first.childId, first.authorId)?.id).toBe(second.id);
+    loaded.updateEntry({
+      ...second, content: '호환 경로 수정',
+    });
+    expect(loaded.getPageById(second.id)?.text).toBe('호환 경로 수정');
+    expect(loaded.getPageById(first.id)).toEqual(first);
+  });
   it('normalizes stored page and default child colors on load', () => {
     const data = migrateSnapshot(legacy());
     data.pages[0].color = '#0F4D3A';
diff --git a/src/data/localStore.ts b/src/data/localStore.ts
index 12680619118dcfaea6acc91957a09ed6514c27ba..eb37c8d5740b98661822f2666c16c3dbc28a1cf4
--- a/src/data/localStore.ts
+++ b/src/data/localStore.ts
@@ -3,6 +3,7 @@
 import { LegacyAdapter } from './legacyAdapter';
 import { defaultChildStatus, migrateSnapshot, type LegacySnapshot } from './migrate';
 import { preparePage } from '../lib/stroke';
+import { sheetsFor } from '../lib/pageId';
 import { downscalePhoto, blobToDataUrl } from '../lib/image';
 import type { DataStore } from './DataStore';
 import { seedChildren, seedMembers, seedTags } from './seed';
@@ -164,9 +165,7 @@
     childId: string,
     authorId = this.getCurrentMemberId() || 'dad',
   ): Page | undefined {
-    return this.snapshot.pages.find(
-      (page) => page.id === date + '__' + childId + '__' + authorId,
-    );
+    return sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
   }
 
   savePage(page: Page): void {
diff --git a/src/data/migrate.ts b/src/data/migrate.ts
index 85c598394abec3735d904cf7234107ba2124cdd8..f9fcd44cb1693aac5585d753846bf5b007d7f001
--- a/src/data/migrate.ts
+++ b/src/data/migrate.ts
@@ -1,4 +1,5 @@
 import { normalizePageColor } from '../lib/pageColors';
+import { basePageId } from '../lib/pageId';
 import type { LegacyEntry } from './legacyAdapter';
 import type {
   Child,
@@ -164,11 +165,11 @@
         a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
     );
     const owner = notes[0]?.authorId ?? 'dad';
-    owners.set(source.id, source.date + '__' + source.childId + '__' + owner);
+    owners.set(source.id, basePageId(source.date, source.childId, owner));
     for (const authorId of [
       ...new Set([owner, ...notes.map((note) => note.authorId)]),
     ]) {
-      const id = source.date + '__' + source.childId + '__' + authorId;
+      const id = basePageId(source.date, source.childId, authorId);
       const { notes: _, ...rest } = source;
       const value: Page = {
         ...rest,
diff --git a/src/data/supabaseStore.test.ts b/src/data/supabaseStore.test.ts
index 8d3a728323a7fc1e20faa3e6f6b2e7654c02f7ef..1bfb0421cebbff3358a29390c6a625b8099d9cd7
--- a/src/data/supabaseStore.test.ts
+++ b/src/data/supabaseStore.test.ts
@@ -103,6 +103,28 @@
 });
 afterEach(() => { stores.forEach((store) => store.dispose()); stores = []; vi.unstubAllGlobals(); });
 describe('family SupabaseStore', () => {
+  it('persists, reloads and updates same-day sheets independently by ID', async () => {
+    const server = fakeServer();
+    const store = create(server);
+    await ready(store);
+    const second = { ...page, id: page.id + '__abc12345', text: '두 번째 장', createdAt: '2026-10-26T01:00:00Z' };
+    store.savePage(page);
+    store.savePage(second);
+    vi.stubGlobal('navigator', { onLine: true });
+    store.retry();
+    await vi.waitFor(() => expect(store.getStatus().pending).toBe(0));
+    store.dispose();
+    const loaded = create(server);
+    await ready(loaded);
+    expect(await loaded.loadPage(page.id)).toEqual(page);
+    expect(await loaded.loadPage(second.id)).toEqual(second);
+    expect(loaded.getPage(page.date, page.childId, page.authorId)?.id).toBe(second.id);
+    loaded.savePage({ ...second, text: '두 번째 장 수정' });
+    await vi.waitFor(() => expect(loaded.getStatus().pending).toBe(0));
+    expect(server.rows.pages).toHaveLength(2);
+    expect(loaded.getPageById(page.id)).toEqual(page);
+    expect(loaded.getPageById(second.id)?.text).toBe('두 번째 장 수정');
+  });
   it('queues only the current member font and sends its storage path, including reset', async () => {
     const server = fakeServer();
     const store = create(server);
diff --git a/src/data/supabaseStore.ts b/src/data/supabaseStore.ts
index 8e7946188600aa4ea4e61091c345cefb1e259a94..3f1a707e942ff04b9d521a686e47a5a06e68ee06
--- a/src/data/supabaseStore.ts
+++ b/src/data/supabaseStore.ts
@@ -3,6 +3,7 @@
 import { externalizeSnapshot, hasInlinePhotos } from './importPhotos';
 import { LegacyAdapter } from './legacyAdapter';
 import { preparePage } from '../lib/stroke';
+import { sheetsFor } from '../lib/pageId';
 import { downscalePhoto } from '../lib/image';
 import { enterFamily, loadMembership, makeInvite, inviteRequired, inviteFailure, type FamilyMembership } from './familyAccess';
 import {
@@ -595,9 +596,7 @@
     childId: string,
     authorId = this.membership?.member_id === 'mom' ? 'mom' : 'dad',
   ): Page | undefined {
-    return this.snapshot.pages.find(
-      (page) => page.id === date + '__' + childId + '__' + authorId,
-    );
+    return sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
   }
   savePage(page: Page): void {
     if (page.photos.some((photo) => photo.src.startsWith('data:')))
diff --git a/src/data/types.ts b/src/data/types.ts
index a565623240c4c75b5494dac7f23863356708bebe..896b815d2be90a47dea69f388e141a7902d88765
--- a/src/data/types.ts
+++ b/src/data/types.ts
@@ -85,6 +85,7 @@
   Page,
   'id' | 'date' | 'childId' | 'authorId' | 'color' | 'tagIds' | 'updatedAt'
 > & {
+  createdAt?: string;
   firstLine: string;
   hasDrawing: boolean;
   photoCount: number;
diff --git a/src/features/page/PageScreen.tsx b/src/features/page/PageScreen.tsx
index ca12a5b57216a2324e49cfcc7497dac71bc0268f..239c9bd52feb12996aad9fff76a2cca0917fd4d1
--- a/src/features/page/PageScreen.tsx
+++ b/src/features/page/PageScreen.tsx
@@ -13,6 +13,7 @@
 import { usePageColorStyle } from '../../lib/usePageColorStyle';
 import { noteAuthor } from '../../data/migrate';
 import { preparePage } from '../../lib/stroke';
+import { basePageId, newSheetId, sheetsFor } from '../../lib/pageId';
 import { BadgeSheet } from './BadgeSheet';
 import { CommentsSheet } from './CommentsSheet';
 import { DiarySheet } from './DiarySheet';
@@ -33,6 +34,8 @@
   child,
   date,
   authorId,
+  pageId,
+  onSheet,
   onAuthor,
   startEditing,
   origin,
@@ -45,6 +48,8 @@
   child: Child;
   date: string;
   authorId?: 'dad' | 'mom';
+  pageId?: string;
+  onSheet: (pageId: string) => void;
   onAuthor: (authorId: 'dad' | 'mom') => void;
   startEditing: boolean;
   origin?: PageOrigin;
@@ -53,15 +58,17 @@
   onSaved: (pageId: string) => void;
 }) {
   const [initial] = useState(() => {
-    const saved = store.getPage(date, child.id, authorId);
+    const author = authorId ??
+      noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members);
+    const id = pageId ?? sheetsFor(snapshot.pages, date, child.id, author).slice(-1)[0]?.id ??
+      basePageId(date, child.id, author);
+    const saved = store.getPageById(id);
     const now = new Date().toISOString();
     const blank: Page = {
-      id: `${date}__${child.id}__${authorId ?? noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members)}`,
+      id,
       childId: child.id,
       date,
-      authorId:
-        authorId ??
-        noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members),
+      authorId: author,
       drawing: [],
       photos: [],
       text: '',
@@ -71,15 +78,13 @@
     };
     return {
       saved: !!saved || snapshot.pages.some((page) => page.id === blank.id),
+      loading: !saved && snapshot.pages.some((page) => page.id === id),
       page: structuredClone(saved ?? blank),
     };
   });
   const [page, setPage] = useState(initial.page);
   const baseline = useRef(initial.page);
-  const [loading, setLoading] = useState(
-    !store.getPage(date, child.id, authorId) &&
-      snapshot.pages.some((page) => page.id === initial.page.id),
-  );
+  const [loading, setLoading] = useState(initial.loading);
   useEffect(() => {
     if (!loading) return;
     let active = true;
@@ -109,6 +114,10 @@
     ? undefined
     : noteAuthor(store.getCurrentMemberId(), snapshot.members);
   const ownPage = page.authorId === writer;
+  const savedSheets = sheetsFor(snapshot.pages, date, child.id, page.authorId);
+  const currentSaved = savedSheets.some((sheet) => sheet.id === page.id);
+  const sheets = currentSaved ? savedSheets : [...savedSheets, page];
+  const showSheetNumbers = savedSheets.length >= 2 || (!currentSaved && !!pageId);
   const [drawing, setDrawing] = useState(false);
   const [sheet, setSheet] = useState<'badges' | 'palette' | 'comments'>();
   const [pending, setPending] = useState<() => void>();
@@ -298,6 +307,26 @@
             </button>
           ))}
         </div>
+        <div className="page-sheets" role="group" aria-label="이 날의 장">
+          {showSheetNumbers && sheets.map((sheet, index) => (
+            <button
+              key={sheet.id}
+              aria-label={`${index + 1}번째 장`}
+              aria-pressed={sheet.id === page.id}
+              onClick={() => navigate(() => onSheet(sheet.id))}
+            >
+              {index + 1}
+            </button>
+          ))}
+          {ownPage && !store.readOnly && currentSaved && (
+            <button
+              aria-label="한 장 더 쓰기"
+              onClick={() => navigate(() => onSheet(newSheetId(date, child.id, page.authorId)))}
+            >
+              ＋
+            </button>
+          )}
+        </div>
         <DrawingArea
           page={{ ...page, color: page.color ?? child.pageColor }}
           store={store}
diff --git a/src/features/page/WritingArea.tsx b/src/features/page/WritingArea.tsx
index ef273ae1617da347d1bc699fdc7b2e5bb8501f58..5b03111c483c9f73c3ecd5a100b8228ef5d72582
--- a/src/features/page/WritingArea.tsx
+++ b/src/features/page/WritingArea.tsx
@@ -15,7 +15,7 @@
   return (
     <section className="writing" aria-label={`${name}의 일기`}>
       <div className="notes">
-        {notes.filter((note) => !editing || note.id !== current?.id).map((note) => (
+        {notes.filter((note) => note.text.trim() && (!editing || note.id !== current?.id)).map((note) => (
           <p key={note.id} className={`note ${note.authorId}-writing`}>
             {note.text}
             <span className="initial">{note.authorId === 'dad' ? '아' : '엄'}</span>
diff --git a/src/features/settings/bookExport.ts b/src/features/settings/bookExport.ts
index 18d005769dac657806ed49beb4341262f4ad212f..29628c2cccfdaa773ff7639d60fb80d1f57d3b04
--- a/src/features/settings/bookExport.ts
+++ b/src/features/settings/bookExport.ts
@@ -1,9 +1,10 @@
 import type { DataStore } from '../../data/DataStore';
 import type { Page, StoreSnapshot } from '../../data/types';
 import { inkFor } from '../../lib/pageColors';
+import { sheetsFor } from '../../lib/pageId';
 import { downloadFile } from '../../lib/download';
 import { paintStroke } from '../page/strokes';
-import { BOOK, bookFilename, fitTextPages, wrapText } from './bookLayout';
+import { BOOK, bookFilename, compareBookSheets, fitTextPages, wrapText } from './bookLayout';
 import { loadPdf, loadZip } from '../../lib/loadExportLibs';
 
 export type BookOptions = {
@@ -167,7 +168,7 @@
         (!options.childId || page.childId === options.childId) &&
         (!options.authorId || page.authorId === options.authorId),
     )
-    .sort((a, b) => a.id.localeCompare(b.id));
+    .sort(compareBookSheets);
   if (!pages.length) throw new Error('선택한 기간에 기록이 없어요.');
   progress(0, pages.length);
   const fonts: FontFace[] = [];
@@ -253,6 +254,9 @@
             all.children.find((child) => child.id === page.childId)?.name ??
               page.childId,
             page.authorId === 'mom' ? '엄마' : '아빠',
+            sheetsFor(pages, page.date, page.childId, page.authorId).findIndex(
+              (sheet) => sheet.id === page.id,
+            ) + 1,
           );
           zip.file(
             pageIndex ? name.replace(/\.png$/, `_${pageIndex + 1}.png`) : name,
diff --git a/src/features/settings/bookLayout.test.ts b/src/features/settings/bookLayout.test.ts
index eb122956ac6cddebccf2fb463aac45f6ebe64562..31815cf8136f1c456a73a9340b6edc7a9a093d1d
--- a/src/features/settings/bookLayout.test.ts
+++ b/src/features/settings/bookLayout.test.ts
@@ -1,7 +1,19 @@
 import { describe, expect, it } from 'vitest';
-import { BOOK, bookFilename, fitTextPages, mmToPx, wrapText } from './bookLayout';
+import { BOOK, bookFilename, compareBookSheets, fitTextPages, mmToPx, wrapText } from './bookLayout';
+import { page } from '../../data/testDb';
 
 describe('book layout', () => {
+  it('keeps same-day sheets in creation order and gives each image and continuation its own name', () => {
+    const first = page();
+    const second = { ...first, id: first.id + '__zzzzzzzz', createdAt: '2026-10-26T04:00:00Z' };
+    const third = { ...second, id: first.id + '__aaaaaaaa', createdAt: '2026-10-26T05:00:00Z' };
+    expect([third, second, first].sort(compareBookSheets)).toEqual([first, second, third]);
+    const names = [1, 2, 3].flatMap((number) => {
+      const name = bookFilename(first.date, '조비안', '아빠', number);
+      return [name, name.replace(/\.png$/, '_2.png')];
+    });
+    expect(new Set(names).size).toBe(6);
+  });
   it('rounds A5 millimetres to 300 dpi pixels', () => {
     expect(BOOK).toEqual({ width: 1748, height: 2480 });
     expect(mmToPx(25.4)).toBe(300);
diff --git a/src/features/settings/bookLayout.ts b/src/features/settings/bookLayout.ts
index 1d73521acbd3e3e9326c361384ced1e2b928c310..e73b8254cfd1c77e6789f97ded07ff7ea3f2eefe
--- a/src/features/settings/bookLayout.ts
+++ b/src/features/settings/bookLayout.ts
@@ -1,3 +1,5 @@
+import type { Page } from '../../data/types';
+
 export const mmToPx = (mm: number, dpi = 300) => Math.round((mm / 25.4) * dpi);
 export const BOOK = { width: mmToPx(148), height: mmToPx(210) };
 
@@ -5,11 +7,12 @@
   date: string,
   child: string,
   author: string,
+  sheetNumber = 1,
 ): string {
   const safe = (value: string) =>
     value.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '') ||
     '이름없음';
-  return `${date}_${safe(child)}_${safe(author)}.png`;
+  return `${date}_${safe(child)}_${safe(author)}${sheetNumber > 1 ? `__장${sheetNumber}` : ''}.png`;
 }
 
 export function wrapText(
@@ -48,3 +51,13 @@
   }
   return { size, pages: pages.length ? pages : [[]] };
 }
+export function compareBookSheets(a: Page, b: Page): number {
+  return (
+    a.date.localeCompare(b.date) ||
+    a.childId.localeCompare(b.childId) ||
+    a.authorId.localeCompare(b.authorId) ||
+    a.createdAt.localeCompare(b.createdAt) ||
+    a.id.localeCompare(b.id)
+  );
+}
+
diff --git a/src/lib/datedArchive.mjs b/src/lib/datedArchive.mjs
index d6dd32321d4f90ea119a30b25981521b76a25a66..ab875f0569d6ad27155cd22f6945ef97986e9eec
--- a/src/lib/datedArchive.mjs
+++ b/src/lib/datedArchive.mjs
@@ -1,10 +1,17 @@
+function comparePages(a, b) {
+  return (
+    a.date.localeCompare(b.date) ||
+    a.childId.localeCompare(b.childId) ||
+    a.authorId.localeCompare(b.authorId) ||
+    a.createdAt.localeCompare(b.createdAt) ||
+    a.id.localeCompare(b.id)
+  );
+}
+
 export function toMarkdown(all, month) {
   const pages = all.pages
     .filter((page) => !month || page.date.startsWith(month))
-    .sort(
-      (a, b) =>
-        a.date.localeCompare(b.date) || a.childId.localeCompare(b.childId),
-    );
+    .sort(comparePages);
   const children = new Map(all.children.map((child) => [child.id, child.name]));
   const members = new Map(
     all.members.map((member) => [member.id, member.displayName]),
@@ -71,7 +78,7 @@
     const directory = 'diary/' + date.split('-').join('/');
     const pages = snapshot.pages
       .filter((page) => page.date === date)
-      .sort((a, b) => a.id.localeCompare(b.id));
+      .sort(comparePages);
     for (const page of pages)
       files.push({
         path:
@@ -80,6 +87,9 @@
           encodeURIComponent(page.childId) +
           '-' +
           page.authorId +
+          (page.id === `${page.date}__${page.childId}__${page.authorId}`
+            ? ''
+            : '--' + encodeURIComponent(page.id)) +
           '.json',
         content: JSON.stringify(page, null, 2),
       });
diff --git a/src/lib/exportFormat.test.ts b/src/lib/exportFormat.test.ts
index 784cf902cd7bc3b95314a2e919091f489be90d1e..b570cb06d564c32674c113c21da3590998830e40
--- a/src/lib/exportFormat.test.ts
+++ b/src/lib/exportFormat.test.ts
@@ -1,5 +1,5 @@
 import { describe, expect, it } from 'vitest';
-import { fromBackupJson, toBackupJson, toMarkdown } from './exportFormat';
+import { fromBackupJson, toBackupJson, toMarkdown, toDatedArchive } from './exportFormat';
 import { migrateSnapshot, type LegacySnapshot } from '../data/migrate';
 import { seedChildren, seedMembers, seedTags } from '../data/seed';
 
@@ -38,6 +38,41 @@
 ];
 
 describe('page exports', () => {
+  it('round-trips all same-day sheets with their own media, comments and reactions', () => {
+    const second = {
+      ...all.pages[0],
+      id: all.pages[0].id + '__abc12345',
+      text: '두 번째 장',
+      createdAt: '2026-10-26T01:00:00Z',
+    };
+    const data = {
+      ...all,
+      pages: [second, all.pages[0]],
+      comments: [...all.comments, { ...all.comments[0], id: 'second-comment', pageId: second.id }],
+      reactions: [...all.reactions, { ...all.reactions[0], pageId: second.id }],
+    };
+    expect(fromBackupJson(toBackupJson(data))).toEqual(data);
+    expect(migrateSnapshot(data)).toEqual(data);
+    const files = toDatedArchive(data);
+    const json = files.filter((file) => file.path.endsWith('.json'));
+    expect(new Set(files.map((file) => file.path)).size).toBe(files.length);
+    expect(json.map((file) => JSON.parse(file.content))).toEqual([all.pages[0], second]);
+    const markdown = files.find((file) => file.path.endsWith('.md'))!.content;
+    expect(markdown.indexOf('첫 걸음')).toBeLessThan(markdown.indexOf('두 번째 장'));
+  });
+  it.each([
+    '2026-10-26__kid1__mom',
+    '2026-10-27__kid1__dad',
+    '2026-10-26__kid2__dad',
+    '2026-10-26__kid1__dad__1234567',
+    '2026-10-26__kid1__dad__123456789',
+    '2026-10-26__kid1__dad__ABC12345',
+    '2026-10-26__kid1__dad__abc12345__extra',
+  ])('rejects malformed or mismatched v3 sheet ID %s', (id) => {
+    expect(() => fromBackupJson({
+      ...toBackupJson(all), pages: [{ ...all.pages[0], id }],
+    })).toThrow();
+  });
   it('round-trips v3 including drawings, photos and activity', () => {
     const backup = toBackupJson(all);
     expect(backup.version).toBe(3);
diff --git a/src/lib/exportFormat.ts b/src/lib/exportFormat.ts
index 580b521cd97b9d598c2ba3343e908b435c7d6d18..310d396f34f82a3714de28d1724f30f26f633646
--- a/src/lib/exportFormat.ts
+++ b/src/lib/exportFormat.ts
@@ -1,5 +1,6 @@
 import { migrateSnapshot, type LegacySnapshot } from '../data/migrate';
 import type { StoreSnapshot } from '../data/types';
+import { isValidPageId } from './pageId';
 
 export type BackupJson = StoreSnapshot & { version: 3; exportedAt: string };
 
@@ -71,8 +72,7 @@
     data.version === 3 &&
     snapshot.pages.some(
       (page) =>
-        !['dad', 'mom'].includes(page.authorId) ||
-        page.id !== page.date + '__' + page.childId + '__' + page.authorId ||
+        !isValidPageId(page) ||
         typeof page.text !== 'string',
     )
   )
diff --git a/src/lib/pageId.test.ts b/src/lib/pageId.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..7e00d921642c16354cfa41d1560896aee26b918d
--- /dev/null
+++ b/src/lib/pageId.test.ts
@@ -0,0 +1,77 @@
+import { describe, expect, it } from 'vitest';
+import { basePageId, isValidPageId, newSheetId, sheetsFor } from './pageId';
+import { preparePage } from './stroke';
+import type { Page } from '../data/types';
+
+const page: Page = {
+  id: '2026-11-02__kid1__dad',
+  date: '2026-11-02',
+  childId: 'kid1',
+  authorId: 'dad',
+  text: '첫 장',
+  drawing: [],
+  photos: [],
+  tagIds: [],
+  createdAt: '2026-11-02T00:00:00Z',
+  updatedAt: '2026-11-02T00:00:00Z',
+};
+
+describe('page IDs and sheet order', () => {
+  it('keeps first IDs and generates independent eight-character sheet suffixes', () => {
+    expect(basePageId(page.date, page.childId, page.authorId)).toBe(page.id);
+    const ids = new Set(
+      Array.from({ length: 100 }, () =>
+        newSheetId(page.date, page.childId, page.authorId),
+      ),
+    );
+    expect(ids.size).toBe(100);
+    for (const id of ids) {
+      expect(id).toMatch(/^2026-11-02__kid1__dad__[a-z0-9]{8}$/);
+      expect(isValidPageId({ ...page, id })).toBe(true);
+      expect(preparePage({ ...page, id }).id).toBe(id);
+    }
+    expect(isValidPageId(page)).toBe(true);
+  });
+
+  it.each([
+    '__abc1234',
+    '__abc123456',
+    '__ABC12345',
+    '__abc_1234',
+    '__abc-1234',
+    '__abc12345__extra',
+    '__abc12345\n',
+    '__',
+  ])('rejects malformed suffix %j', (suffix) => {
+    const invalid = { ...page, id: page.id + suffix };
+    expect(isValidPageId(invalid)).toBe(false);
+    expect(() => preparePage(invalid)).toThrow();
+  });
+
+  it('rejects IDs mismatching any identity field', () => {
+    expect(isValidPageId({ ...page, date: '2026-11-03' })).toBe(false);
+    expect(isValidPageId({ ...page, childId: 'kid2' })).toBe(false);
+    expect(isValidPageId({ ...page, authorId: 'mom' })).toBe(false);
+    expect(isValidPageId({ ...page, childId: '' })).toBe(false);
+  });
+
+  it('filters the exact day, child and parent and sorts by creation then ID without mutation', () => {
+    const second = { ...page, id: page.id + '__zzzzzzzz', createdAt: '2026-11-02T01:00:00Z' };
+    const third = { ...second, id: page.id + '__aaaaaaaa', createdAt: '2026-11-02T02:00:00Z' };
+    const tied = { ...third, id: page.id + '__bbbbbbbb' };
+    const pages = [
+      tied,
+      third,
+      second,
+      { ...page, updatedAt: '2026-11-03T00:00:00Z' },
+      { ...page, date: '2026-11-01' },
+      { ...page, childId: 'kid2' },
+      { ...page, authorId: 'mom' as const },
+    ];
+    const before = structuredClone(pages);
+    expect(sheetsFor(pages, page.date, page.childId, page.authorId).map((p) => p.id)).toEqual([
+      page.id, second.id, third.id, tied.id,
+    ]);
+    expect(pages).toEqual(before);
+  });
+});
diff --git a/src/lib/pageId.ts b/src/lib/pageId.ts
new file mode 100644
index 0000000000000000000000000000000000000000..3d44116710f40c1752a86239aba3d758e6702c6a
--- /dev/null
+++ b/src/lib/pageId.ts
@@ -0,0 +1,66 @@
+import type { Page } from '../data/types';
+
+export function basePageId(
+  date: string,
+  childId: string,
+  authorId: Page['authorId'],
+): string {
+  return `${date}__${childId}__${authorId}`;
+}
+
+export function newSheetId(
+  date: string,
+  childId: string,
+  authorId: Page['authorId'],
+): string {
+  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
+  let suffix = '';
+  // Rejection sampling keeps all 36 characters equally likely.
+  while (suffix.length < 8) {
+    for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
+      if (byte < 252 && suffix.length < 8) suffix += alphabet[byte % 36];
+    }
+  }
+  return `${basePageId(date, childId, authorId)}__${suffix}`;
+}
+
+export function isValidPageId(
+  page: Pick<Page, 'id' | 'date' | 'childId' | 'authorId'>,
+): boolean {
+  if (
+    typeof page.id !== 'string' ||
+    typeof page.date !== 'string' ||
+    page.date.length !== 10 ||
+    !/^\d{4}-\d{2}-\d{2}$/.test(page.date) ||
+    typeof page.childId !== 'string' ||
+    !page.childId ||
+    !['dad', 'mom'].includes(page.authorId)
+  )
+    return false;
+  const base = basePageId(page.date, page.childId, page.authorId);
+  return (
+    page.id === base ||
+    (page.id.length === base.length + 10 &&
+      page.id.startsWith(base + '__') &&
+      /^[a-z0-9]{8}$/.test(page.id.slice(base.length + 2)))
+  );
+}
+
+export function sheetsFor(
+  pages: Page[],
+  date: string,
+  childId: string,
+  authorId: string,
+): Page[] {
+  return pages
+    .filter(
+      (page) =>
+        page.date === date &&
+        page.childId === childId &&
+        page.authorId === authorId,
+    )
+    .sort(
+      (a, b) =>
+        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
+    );
+}
diff --git a/src/lib/stroke.ts b/src/lib/stroke.ts
index eeb2602ccc92f797967bab59b66c64def8c1bafd..253c1de265e46f07018c76f5291876f44732f73c
--- a/src/lib/stroke.ts
+++ b/src/lib/stroke.ts
@@ -1,4 +1,5 @@
 import type { Page, Stroke } from '../data/types';
+import { isValidPageId } from './pageId';
 
 export function isStrokeWidth(width: unknown): width is Stroke['width'] {
   return [2, 5, 8, 14, 28].includes(width as number);
@@ -29,13 +30,11 @@
 }
 
 export function preparePage(page: Page): Page {
-  const id = page.date + '__' + page.childId + '__' + page.authorId;
-  if (!['dad', 'mom'].includes(page.authorId) || page.id !== id) {
+  if (!isValidPageId(page)) {
     throw new Error('페이지의 날짜, 아이와 작성자는 바꿀 수 없어요.');
   }
   const result = {
     ...page,
-    id,
     drawing: page.drawing.map((stroke) => {
       if (!isStrokeWidth(stroke.width)) {
         throw new Error('그림 도구의 굵기를 확인해 주세요.');
diff --git a/src/styles/app.css b/src/styles/app.css
index 04aa18bd154ce5eccb83359658fa4914663081a7..9654cc22dda57720d60b97215fc5893e5d6113cd
--- a/src/styles/app.css
+++ b/src/styles/app.css
@@ -8,6 +8,7 @@
 }
 body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg); }
 button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
+input, textarea, select { color: inherit; }
 .artifact-welcome { min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; padding: calc(24px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-inset-bottom)); background: var(--bg); }
 .artifact-welcome h2 { font-size: 22px; }
 .artifact-picker { display: flex; gap: 16px; width: 100%; max-width: 320px; }
@@ -187,10 +188,6 @@
 .action-sheet button:last-child { border-bottom: 0; color: var(--sub); }
 .action-sheet .danger { color: var(--kid1); }
 
-.notes { max-width: 1240px; margin: 40px auto 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
-.note { background: var(--card); border-radius: var(--r-card); padding: 18px; box-shadow: var(--shadow); font-size: 14px; }
-.note h4 { font-size: 15px; margin-bottom: 6px; }
-.note ul { padding-left: 18px; color: var(--sub); }
 .swatches { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
 .sw { width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--line); }
 
diff --git a/src/styles/page.css b/src/styles/page.css
index f30f5abb2d2e20133f2b3b3bf2a7d5b4d5f421a7..2ffdbe722bf73e4276370ba567b709820c2030ca
--- a/src/styles/page.css
+++ b/src/styles/page.css
@@ -227,11 +227,18 @@
   min-height: 176px;
 }
 
-.notes {
+.diary .notes {
+  display: block;
+  margin: 0;
   min-height: 140px;
 }
 
-.note {
+.diary .note {
+  background: none;
+  box-shadow: none;
+  border-radius: 0;
+  padding: 0;
+  font-size: 20px;
   margin-bottom: 14px;
   line-height: 35px;
   white-space: pre-wrap;
@@ -240,7 +247,7 @@
 
 .initial {
   margin-left: 7px;
-  opacity: 0.5;
+  opacity: 0.7;
   font-size: 13px;
 }
 
@@ -545,6 +552,23 @@
   gap: 8px;
   word-break: keep-all;
 }
+.diary .page-sheets {
+  display: flex;
+  justify-content: center;
+  flex: none;
+  height: 44px;
+  overflow-x: auto;
+  color: var(--page-ink);
+}
+.page-sheets button {
+  flex: 0 0 44px;
+  opacity: 0.7;
+}
+.page-sheets button[aria-pressed='true'] {
+  opacity: 1;
+  text-decoration: underline;
+  text-underline-offset: 4px;
+}
 .parent-pages button {
   min-height: 44px;
   padding: 2px 5px;
diff --git a/src/styles/tokens.css b/src/styles/tokens.css
index ef78879c69b0ec08ac3018f3aa658a2b2b9b7347..8524e9344622284da57edbccc696862aca9c36e8
--- a/src/styles/tokens.css
+++ b/src/styles/tokens.css
@@ -1,6 +1,7 @@
 
 /* ===== Design tokens ===== */
 :root {
+  color-scheme: light;
   --bg: #F6F5F2;
   --card: #FFFFFF;
   --surface: #FFFFFF;
@@ -35,6 +36,7 @@
 }
 @media (prefers-color-scheme: dark) {
   :root:not([data-theme="light"]) {
+    color-scheme: dark;
     --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
     --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
     --dad: #8AA6E3; --mom: #E39BB3;
@@ -47,6 +49,7 @@
   }
 }
 :root[data-theme="dark"] {
+  color-scheme: dark;
   --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
   --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
   --dad: #8AA6E3; --mom: #E39BB3;
diff --git a/supabase/migrations/20261102000000_multi_page_sheets.sql b/supabase/migrations/20261102000000_multi_page_sheets.sql
new file mode 100644
index 0000000000000000000000000000000000000000..fedcc73ae4d3a6fbfb7bbbd028c889418b3471a2
--- /dev/null
+++ b/supabase/migrations/20261102000000_multi_page_sheets.sql
@@ -0,0 +1,35 @@
+begin;
+
+do $$
+declare
+  id_check text;
+  matches integer;
+begin
+  -- Locate the original unnamed ID check by its definition, not its generated name.
+  select count(*), min(conname::text)
+    into matches, id_check
+  from pg_constraint
+  where conrelid = 'public.pages'::regclass
+    and contype = 'c'
+    and regexp_replace(pg_get_constraintdef(oid), '[[:space:]()]', '', 'g') =
+      'CHECKid=date::text||''__''::text||child_id||''__''::text||author_id';
+
+  if matches <> 1 then
+    raise exception 'Expected exactly one original pages ID check, found %', matches;
+  end if;
+  execute format('alter table public.pages drop constraint %I', id_check);
+end $$;
+
+alter table public.pages add constraint pages_sheet_id_check check (
+  id = date::text || '__' || child_id || '__' || author_id
+  or (
+    length(id) = length(date::text || '__' || child_id || '__' || author_id) + 10
+    and
+    left(id, length(date::text || '__' || child_id || '__' || author_id) + 2) =
+      date::text || '__' || child_id || '__' || author_id || '__'
+    and substring(id from length(date::text || '__' || child_id || '__' || author_id) + 3)
+      ~ '^[a-z0-9]{8}$'
+  )
+);
+
+commit;

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'npx.cmd tsc -b; npx.cmd vitest run; npm.cmd run test:backup; Test-Path node_modules/prettier' in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
 succeeded in 7913ms:
X [ERROR] Cannot read directory "../../../..": Access is denied.

X [ERROR] Could not resolve "C:\\Users\\ajou\\OneDrive\\0. 개인정보\\00. 주현♥\\육아일기 앱\\vite.config.ts"

failed to load config from C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\vite.config.ts

⎯⎯⎯⎯⎯⎯⎯ Startup Error ⎯⎯⎯⎯⎯⎯⎯⎯
Error: Build failed with 2 errors:
error: Cannot read directory "../../../..": Access is denied.
error: Could not resolve "C:\\Users\\ajou\\OneDrive\\0. 개인정보\\00. 주현♥\\육아일기 앱\\vite.config.ts"
    at failureErrorWithLog (C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\node_modules\esbuild\lib\main.js:1467:15)
    at C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\node_modules\esbuild\lib\main.js:926:25
    at runOnEndCallbacks (C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\node_modules\esbuild\lib\main.js:1307:45)
    at buildResponseToResult (C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\node_modules\esbuild\lib\main.js:924:7)
    at C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\node_modules\esbuild\lib\main.js:951:16
    at responseCallbacks.<computed> (C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\node_modules\esbuild\lib\main.js:603:9)
    at handleIncomingPacket (C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\node_modules\esbuild\lib\main.js:658:12)
    at Socket.readFromStdout (C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\node_modules\esbuild\lib\main.js:581:7)
    at Socket.emit (node:events:509:28)
    at addChunk (node:internal/streams/readable:563:12) {
  errors: [Getter/Setter],
  warnings: [Getter/Setter]
}




> yuga-record@0.1.0 test:backup
> node --test scripts/backup/backup.check.mjs

✔ dated archives preserve multiple sheets for one parent in creation order (14.4711ms)
✔ dated backup dry-run and incremental writes preserve old files and both parents (724.2315ms)
✔ public backup encryption roundtrips and rejects a wrong key or modified ciphertext (439.8425ms)
ℹ tests 3
ℹ suites 0
ℹ pass 3
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1281.3625
False

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "node --input-type=module -e \"import { startVitest } from 'vitest/node'; const ctx = await startVitest('test', [], { config: false }); await ctx?.close();\"" in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "git diff --stat; git diff -- src/App.tsx src/features/page/PageScreen.tsx src/lib/pageId.ts src/data/types.ts src/data/legacyAdapter.ts src/data/artifactStore.ts supabase/migrations/20261102000000_multi_page_sheets.sql; Get-Content -Encoding UTF8 src/features/settings/useMemberFonts.ts,src/lib/pageColors.ts | Select-String -Pattern 'writing|page-ink' -Context 2,3; git diff -- AGENTS.md" in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
 succeeded in 939ms:
warning: in the working copy of 'AGENTS.md', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'scripts/backup/backup.check.mjs', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/App.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/data/DataStore.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/data/artifactStore.test.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/data/artifactStore.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/data/legacyAdapter.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/data/localStore.test.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/data/localStore.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/data/migrate.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/data/supabaseStore.test.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/data/supabaseStore.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/data/types.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/features/archive/ArchiveScreen.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/features/calendar/CalendarScreen.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/features/calendar/DayPreview.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/features/page/PageScreen.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/features/page/WritingArea.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/features/settings/bookExport.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/features/settings/bookLayout.test.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/features/settings/bookLayout.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/lib/datedArchive.mjs', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/lib/exportFormat.test.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/lib/exportFormat.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/lib/stroke.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/styles/app.css', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/styles/page.css', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/styles/tokens.css', LF will be replaced by CRLF the next time Git touches it
 AGENTS.md                                |  6 ++--
 scripts/backup/backup.check.mjs          | 28 +++++++++++++++++++
 src/App.tsx                              | 11 ++++++--
 src/data/DataStore.ts                    |  1 +
 src/data/artifactStore.test.ts           | 25 +++++++++++++++++
 src/data/artifactStore.ts                | 13 ++++++---
 src/data/legacyAdapter.ts                |  8 +++++-
 src/data/localStore.test.ts              | 19 +++++++++++++
 src/data/localStore.ts                   |  5 ++--
 src/data/migrate.ts                      |  5 ++--
 src/data/supabaseStore.test.ts           | 22 +++++++++++++++
 src/data/supabaseStore.ts                |  5 ++--
 src/data/types.ts                        |  1 +
 src/features/archive/ArchiveScreen.tsx   |  6 ++--
 src/features/calendar/CalendarScreen.tsx |  2 +-
 src/features/calendar/DayPreview.tsx     |  6 ++--
 src/features/page/PageScreen.tsx         | 47 ++++++++++++++++++++++++++------
 src/features/page/WritingArea.tsx        |  2 +-
 src/features/settings/bookExport.ts      |  8 ++++--
 src/features/settings/bookLayout.test.ts | 14 +++++++++-
 src/features/settings/bookLayout.ts      | 15 +++++++++-
 src/lib/datedArchive.mjs                 | 20 ++++++++++----
 src/lib/exportFormat.test.ts             | 37 ++++++++++++++++++++++++-
 src/lib/exportFormat.ts                  |  4 +--
 src/lib/stroke.ts                        |  5 ++--
 src/styles/app.css                       |  5 +---
 src/styles/page.css                      | 30 ++++++++++++++++++--
 src/styles/tokens.css                    |  3 ++
 28 files changed, 295 insertions(+), 58 deletions(-)
warning: in the working copy of 'src/App.tsx', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/data/artifactStore.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/data/legacyAdapter.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/data/types.ts', LF will be replaced by CRLF the next time Git touches it
warning: in the working copy of 'src/features/page/PageScreen.tsx', LF will be replaced by CRLF the next time Git touches it
diff --git a/src/App.tsx b/src/App.tsx
index 83254dd..da02bb9 100644
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -21,6 +21,7 @@ type Screen =
       date: string;
       childId: string;
       authorId?: 'dad' | 'mom';
+      pageId?: string;
       editing: boolean;
       origin?: PageOrigin;
     };
@@ -54,12 +55,14 @@ export default function App({ store }: { store: DataStore }) {
     nextDate: string,
     childId: string,
     authorId?: 'dad' | 'mom',
+    pageId?: string,
   ) =>
     setScreen({
       kind: 'page',
       date: nextDate,
       childId,
       authorId,
+      pageId,
       ...source.current,
     });
   const goHome = () => setScreen({ kind: 'shell', tab: '홈' });
@@ -71,17 +74,19 @@ export default function App({ store }: { store: DataStore }) {
       <>
         <SyncBanner store={store} />
         <PageScreen
-          key={`${screen.date}__${screen.childId}__${screen.authorId ?? store.getCurrentMemberId()}`}
+          key={`${screen.date}__${screen.childId}__${screen.authorId ?? store.getCurrentMemberId()}__${screen.pageId ?? ''}`}
           store={store}
           snapshot={snapshot}
           child={child}
           date={screen.date}
           authorId={screen.authorId}
-          onAuthor={(authorId) => setScreen({ ...screen, authorId })}
+          pageId={screen.pageId}
+          onSheet={(pageId) => setScreen({ ...screen, pageId })}
+          onAuthor={(authorId) => setScreen({ ...screen, authorId, pageId: undefined })}
           startEditing={screen.editing}
           origin={screen.origin}
           onBack={goHome}
-          onDate={(nextDate) => setScreen({ ...screen, date: nextDate })}
+          onDate={(nextDate) => setScreen({ ...screen, date: nextDate, pageId: undefined })}
           onSaved={() => {
             setDate(screen.date);
             setSavedToast(true);
diff --git a/src/data/artifactStore.ts b/src/data/artifactStore.ts
index 12bc4bc..7dbac65 100644
--- a/src/data/artifactStore.ts
+++ b/src/data/artifactStore.ts
@@ -1,5 +1,6 @@
 import { normalizePageColor } from '../lib/pageColors';
 import { todayKey } from '../lib/date';
+import { sheetsFor } from '../lib/pageId';
 import { LegacyAdapter } from './legacyAdapter';
 import { migrateMonthSnapshot, defaultChildStatus, defaultPageColor } from './migrate';
 import { preparePage } from '../lib/stroke';
@@ -55,6 +56,7 @@ function summarize(page: Page): PageSummary {
     tagIds: page.tagIds,
     hasDrawing: page.drawing.length > 0,
     photoCount: page.photos.length,
+    createdAt: page.createdAt,
     updatedAt: page.updatedAt,
     deletedAt: null,
   };
@@ -100,7 +102,7 @@ export function buildArtifactSnapshot(
             tagIds: summary.tagIds,
             drawing: [],
             photos: [],
-            createdAt: summary.updatedAt,
+            createdAt: summary.createdAt ?? summary.updatedAt,
             updatedAt: summary.updatedAt,
           },
     ),
@@ -536,14 +538,17 @@ export class ArtifactStore extends LegacyAdapter implements DataStore {
     childId: string,
     authorId = this.getCurrentMemberId() || 'dad',
   ): Page | undefined {
-    const id = date + '__' + childId + '__' + authorId;
+    const page = sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
+    return page ? this.getPageById(page.id) : undefined;
+  }
+  getPageById(id: string): Page | undefined {
     if (
       this.cache.has(id) ||
       this.pending.some((write) => write.path === 'pages/' + id)
     ) {
       return this.snapshot.pages.find((page) => page.id === id);
     }
-    if (!this.months[date.slice(0, 7)]?.pages[id])
+    if (!this.months[id.slice(0, 7)]?.pages[id])
       return this.snapshot.pages.find((page) => page.id === id);
     return undefined;
   }
@@ -756,7 +761,7 @@ export class ArtifactStore extends LegacyAdapter implements DataStore {
   exportAll(): StoreSnapshot {
     if (
       this.snapshot.pages.some(
-        (page) => !this.getPage(page.date, page.childId, page.authorId),
+        (page) => !this.getPageById(page.id),
       )
     )
       throw new Error('페이지를 불러온 뒤 백업해 주세요.');
diff --git a/src/data/legacyAdapter.ts b/src/data/legacyAdapter.ts
index 4d7ce7f..2709be0 100644
--- a/src/data/legacyAdapter.ts
+++ b/src/data/legacyAdapter.ts
@@ -1,6 +1,7 @@
 import type { DataStore } from './DataStore';
 import type { Child, Page, StoreSnapshot } from './types';
 import { noteAuthor } from './migrate';
+import { basePageId, isValidPageId } from '../lib/pageId';
 
 export type LegacyEntry = {
   id: string;
@@ -34,6 +35,9 @@ export abstract class LegacyAdapter {
   abstract updateChild(child: Child): void;
   abstract uploadPhoto(blob: Blob): Promise<{ src: string }>;
   protected async removePhotoAsset(_src: string): Promise<void> {}
+  getPageById(id: string): Page | undefined {
+    return this.getSnapshot().pages.find((page) => page.id === id);
+  }
   async loadPage(id: string): Promise<Page> {
     const page = this.getSnapshot().pages.find((item) => item.id === id);
     if (!page) throw new Error('페이지를 찾을 수 없어요.');
@@ -111,7 +115,9 @@ export abstract class LegacyAdapter {
   updateEntry(entry: LegacyEntry): void {
     const data = this.getSnapshot();
     const authorId = noteAuthor(entry.authorId, data.members);
-    const id = entry.date + '__' + entry.childId + '__' + authorId;
+    const id = isValidPageId({ ...entry, authorId })
+      ? entry.id
+      : basePageId(entry.date, entry.childId, authorId);
     const page = data.pages.find((item) => item.id === id);
     this.savePage({
       ...page,
diff --git a/src/data/types.ts b/src/data/types.ts
index a565623..896b815 100644
--- a/src/data/types.ts
+++ b/src/data/types.ts
@@ -85,6 +85,7 @@ export type PageSummary = Pick<
   Page,
   'id' | 'date' | 'childId' | 'authorId' | 'color' | 'tagIds' | 'updatedAt'
 > & {
+  createdAt?: string;
   firstLine: string;
   hasDrawing: boolean;
   photoCount: number;
diff --git a/src/features/page/PageScreen.tsx b/src/features/page/PageScreen.tsx
index ca12a5b..239c9bd 100644
--- a/src/features/page/PageScreen.tsx
+++ b/src/features/page/PageScreen.tsx
@@ -13,6 +13,7 @@ import { addDays, dayCounter, fromKey } from '../../lib/date';
 import { usePageColorStyle } from '../../lib/usePageColorStyle';
 import { noteAuthor } from '../../data/migrate';
 import { preparePage } from '../../lib/stroke';
+import { basePageId, newSheetId, sheetsFor } from '../../lib/pageId';
 import { BadgeSheet } from './BadgeSheet';
 import { CommentsSheet } from './CommentsSheet';
 import { DiarySheet } from './DiarySheet';
@@ -33,6 +34,8 @@ export function PageScreen({
   child,
   date,
   authorId,
+  pageId,
+  onSheet,
   onAuthor,
   startEditing,
   origin,
@@ -45,6 +48,8 @@ export function PageScreen({
   child: Child;
   date: string;
   authorId?: 'dad' | 'mom';
+  pageId?: string;
+  onSheet: (pageId: string) => void;
   onAuthor: (authorId: 'dad' | 'mom') => void;
   startEditing: boolean;
   origin?: PageOrigin;
@@ -53,15 +58,17 @@ export function PageScreen({
   onSaved: (pageId: string) => void;
 }) {
   const [initial] = useState(() => {
-    const saved = store.getPage(date, child.id, authorId);
+    const author = authorId ??
+      noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members);
+    const id = pageId ?? sheetsFor(snapshot.pages, date, child.id, author).slice(-1)[0]?.id ??
+      basePageId(date, child.id, author);
+    const saved = store.getPageById(id);
     const now = new Date().toISOString();
     const blank: Page = {
-      id: `${date}__${child.id}__${authorId ?? noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members)}`,
+      id,
       childId: child.id,
       date,
-      authorId:
-        authorId ??
-        noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members),
+      authorId: author,
       drawing: [],
       photos: [],
       text: '',
@@ -71,15 +78,13 @@ export function PageScreen({
     };
     return {
       saved: !!saved || snapshot.pages.some((page) => page.id === blank.id),
+      loading: !saved && snapshot.pages.some((page) => page.id === id),
       page: structuredClone(saved ?? blank),
     };
   });
   const [page, setPage] = useState(initial.page);
   const baseline = useRef(initial.page);
-  const [loading, setLoading] = useState(
-    !store.getPage(date, child.id, authorId) &&
-      snapshot.pages.some((page) => page.id === initial.page.id),
-  );
+  const [loading, setLoading] = useState(initial.loading);
   useEffect(() => {
     if (!loading) return;
     let active = true;
@@ -109,6 +114,10 @@ export function PageScreen({
     ? undefined
     : noteAuthor(store.getCurrentMemberId(), snapshot.members);
   const ownPage = page.authorId === writer;
+  const savedSheets = sheetsFor(snapshot.pages, date, child.id, page.authorId);
+  const currentSaved = savedSheets.some((sheet) => sheet.id === page.id);
+  const sheets = currentSaved ? savedSheets : [...savedSheets, page];
+  const showSheetNumbers = savedSheets.length >= 2 || (!currentSaved && !!pageId);
   const [drawing, setDrawing] = useState(false);
   const [sheet, setSheet] = useState<'badges' | 'palette' | 'comments'>();
   const [pending, setPending] = useState<() => void>();
@@ -298,6 +307,26 @@ export function PageScreen({
             </button>
           ))}
         </div>
+        <div className="page-sheets" role="group" aria-label="이 날의 장">
+          {showSheetNumbers && sheets.map((sheet, index) => (
+            <button
+              key={sheet.id}
+              aria-label={`${index + 1}번째 장`}
+              aria-pressed={sheet.id === page.id}
+              onClick={() => navigate(() => onSheet(sheet.id))}
+            >
+              {index + 1}
+            </button>
+          ))}
+          {ownPage && !store.readOnly && currentSaved && (
+            <button
+              aria-label="한 장 더 쓰기"
+              onClick={() => navigate(() => onSheet(newSheetId(date, child.id, page.authorId)))}
+            >
+              ＋
+            </button>
+          )}
+        </div>
         <DrawingArea
           page={{ ...page, color: page.color ?? child.pageColor }}
           store={store}

        const asset = member.fontAssetId;
        if (!asset) continue;
>       const family = `${member.color}Writing`;
        void (async () => {
          const src = await (store.resolvePhotoSrc?.(asset) ?? Promise.resolve(asset));
          const font = new FontFace(family, `url(${JSON.stringify(src)})`);
          document.documentElement.style.setProperty(property, `'${family}'`);
        })().catch(() => {
>         // Keep the default handwriting if the saved asset is unavailable.
        });
      }
      return () => {
    return {
      '--page-color': displayed,
>     '--page-ink': inkFor(displayed),
    } as CSSProperties;
  }
warning: in the working copy of 'AGENTS.md', LF will be replaced by CRLF the next time Git touches it
diff --git a/AGENTS.md b/AGENTS.md
index e103b2d..2470892 100644
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -1,6 +1,6 @@
 # 육아 일기 — Codex 작업 규칙
 
-A couple (아빠/엄마) keeps a diary for their two kids: **one page per child per day per parent** (엄마의 페이지 and 아빠의 페이지 are separate), with a drawing/photo area on top and handwritten-style text below. Mobile-first web app (PWA build + claude.ai Artifact build; an app-store release via a native wrapper is planned, so keep everything web-standard and backend-agnostic), Korean UI only. The pages may become a printed book: drawings and exports must stay high-resolution.
+A couple (아빠/엄마) keeps a diary for their two kids: **one or more sheets per child per day per parent** (엄마의 페이지 and 아빠의 페이지 are separate), with a drawing/photo area on top and handwritten-style text below. Mobile-first web app (PWA build + claude.ai Artifact build; an app-store release via a native wrapper is planned, so keep everything web-standard and backend-agnostic), Korean UI only. The pages may become a printed book: drawings and exports must stay high-resolution.
 Do only the phase you are asked to do. Keep changes minimal and focused; do not refactor other phases' code.
 
 ## Kids (seed data)
@@ -22,7 +22,7 @@ Age label (`lib/date.ts#ageLabel`, already implemented):
 ## Design specs (user approved)
 1. **Home** = `docs/design/home-c1-moon.html` (night style 달) and `docs/design/home-c3-lantern.html` (night style 풍등); the user picks the night style on Home (default 달). Day (light theme): select 노을 언덕 (default, `docs/design/home-day-sunset.html`) or 민들레 (`docs/design/home-day-dandelion.html`) on Home. Sunset suns have 30 ridge wildflowers (bloom/bud), with periodic bird flocks; dandelion heads have 30 seeds (fluffy/faint), with drifting background seeds and soft meadow grass. Stems end above navigation. Night (dark theme): starfield with twinkle + shooting stars, faces as moons with a 30-star crown, or as sky-lanterns with 30 beads. The 30 marks = the last 30 days; a day counts as written if EITHER parent saved a page for that child. No names on the home; accessible labels carry name + summary. Long-press a face → "최근 30일 중 N일 기록". All four styles wander smoothly across the whole safe scene below the date and above navigation (12?20 px/s on mobile, faster on desktop), with gentle tilt/bob, soft face separation, and steering away from the scene switcher. One shared animation clock pauses when hidden. Dandelion stems stretch/bend from fixed ground roots; sunset suns float freely while their 30 flowers slide horizontally along the hill below. After long-press, moving over 6px picks up the face and its marks; release flings it within safe scene bounds above navigation, with friction and edge/circle bounces; wandering resumes where the fling settles without springing home. A fling never opens a page. Reduced motion is static and drag returns directly home. Lanterns must not overlap each other's bead strings. Scene selection lives in one artwork object placed naturally per scene, with face steering avoiding its own area: sunset has a small 30px orange-rose setting sun half-occluded by the actual far ridge toward the right (6s breathing halo, faint rim shimmer, 14s gentle sinking); dandelion keeps the ladybug on its drifting seed; moon has a quiet warm-white thin four-point glint only slightly larger than background stars (4.5s subtle twinkle, soft flare every 12s); lantern has a small dim distant lantern (8s rise/sway plus flicker). Object motion shares the paused-when-hidden scene clock; all objects are static with reduced motion. Each is an accessible button named 장면 바꾸기 with an invisible ≥44px hit area and keyboard-only focus ring, behind faces and never a collision body. First three device-local Home visits shimmer once after 1.5s (no reduced-motion animation). A frosted strip groups four SVG scene thumbnails under 낮/밤; choosing persists the corresponding HomePreferences style and explicit light/dark theme, crossfades for 400ms (instant with reduced motion), and closes. Outside tap, Esc and back also close it. 설정 › 화면 keeps only 시스템/라이트/다크 and the hint 홈의 작은 집·무당벌레·별·풍등을 누르면 장면을 바꿀 수 있어요.
 2. **App shell** (archive list, calendar, settings, sheets): `docs/design/mockup-v3.html` — Pretendard, clean cards, dark filled pills/buttons, soft navy-violet dark mode. Intuitive = on every screen the thing to choose and the most important info are obvious at a glance.
-3. **Diary page** (one child, one day, one parent): full-bleed page color, Gaegu handwriting, hand-drawn ink. NO visible borders/frames between the drawing and writing areas; the drawing area spans the full screen width edge to edge. ONLY: top bar (← back, date with ‹ ›, ONE badge icon), a small "엄마의 페이지 · 아빠의 페이지" switch (swipe or tap), drawing, writing, bottom (💬 comments, big oval 저장/수정).
+3. **Diary page** (one sheet for one child, one day, one parent): full-bleed page color, Gaegu handwriting, hand-drawn ink. NO visible borders/frames between the drawing and writing areas; the drawing area spans the full screen width edge to edge. ONLY: top bar (← back, date with ‹ ›, ONE badge icon), a small "엄마의 페이지 · 아빠의 페이지" switch (swipe or tap), a quiet fixed-height sheet-number row with ? for another saved own page, drawing, writing, bottom (💬 comments, big oval 저장/수정).
 - Flow: Home → tap a face → that child's page for today, opened on the current writer's own page → 저장 → back to Home with toast "저장했어요". Reaching Home's archive/calendar/settings: small, quiet icons at the bottom of Home (not competing with the faces).
 - **Current writer**: use store.getCurrentMemberId() (first-visit full-screen picker / settings). No per-page writer choice. The current writer's paragraph is editable, with a small author initial beside each paragraph. Save requires text, drawing, or photo.
 - Page palette: shared ColorPicker with 3 recommended colors (벚꽃 #F4B9B8, 박하 #CDEFE2, 귤 #F59157), up to 5 viewer-local recent colors, and a frozen 40-swatch pastel grid (10 rainbow hue families × 4 tones), including all 16 legacy named colors. Normalize old colors to the nearest grid color on load. Pen colors are separate: auto ink plus 8 deeper crayons, stored per Stroke.color; `ink` means auto ink. Display colors mix 90% page color + 10% #262638 in dark mode. Auto ink chooses #1E2326 or #F5F0E1 by highest WCAG contrast against the displayed color.
@@ -36,7 +36,7 @@ Child    { id; name; nickname?; birthDate?; dueDate?; color: 'kid1'|'kid2'; page
 ProfilePhoto { id; src: string /* asset url */; createdAt }       // already cropped to a 1024px circle-ready square
 Member   { id: 'dad'|'mom'; displayName; color: 'dad'|'mom'; fontAssetId?: string }   // own handwriting font later
 Tag      { id; label; emoji; tone; sortOrder; preset; hidden? }                        // "배지" in the UI
-Page     { id: `${date}__${childId}__${authorId}`; childId; date: 'YYYY-MM-DD'; authorId: 'dad'|'mom';
+Page     { id: `${date}__${childId}__${authorId}` /* first sheet; additional sheets append __ + 8 random [a-z0-9] characters */; childId; date: 'YYYY-MM-DD'; authorId: 'dad'|'mom';
            color?: string /* only when the author picked one; otherwise the child's pageColor applies */;
            drawing: Stroke[]; photos: Photo[]; text: string; tagIds: string[]; createdAt; updatedAt }
 Stroke   { color: string; width: 2|5|14 (eraser = 14 with color 'erase'); points: number[] /* x,y pairs normalized 0..1, 3 decimals */ }



 succeeded in 18326ms:

 RUN  v3.2.7 C:/Users/ajou/OneDrive/0. 개인정보/00. 주현♥/육아일기 앱

 ✓ src/features/page/drawingView.test.ts (5 tests) 5ms
 ✓ src/features/home/fling.test.ts (5 tests) 5ms
 ✓ src/features/home/crop.test.ts (3 tests) 3ms
 ✓ src/features/home/sceneChoice.test.ts (11 tests) 4ms
 ✓ src/lib/image.test.ts (2 tests) 7ms
 ✓ src/features/calendar/dayFill.test.ts (3 tests) 3ms
 ✓ src/lib/pageColors.test.ts (4 tests) 14ms
 ✓ src/features/home/preferences.test.ts (3 tests) 2ms
 ✓ src/lib/pageId.test.ts (11 tests) 19ms
 ✓ src/features/settings/colorTarget.test.ts (3 tests) 3ms
 ✓ src/features/home/switcherPosition.test.ts (2 tests) 3ms
 ✓ src/data/familyAccess.test.ts (8 tests) 13ms
 ✓ src/features/home/DayMarks.test.ts (2 tests) 22ms
 ✓ src/features/archive/archiveView.test.ts (3 tests) 5ms
 ✓ src/lib/exportFormat.test.ts (12 tests) 36ms
 ✓ src/data/photoAssets.test.ts (2 tests) 16ms
 ✓ src/data/localStore.test.ts (8 tests) 33ms
 ✓ src/lib/josa.test.ts (3 tests) 2ms
 ✓ src/data/supabaseStore.test.ts (11 tests) 1595ms
 ✓ src/features/home/wander.test.ts (12 tests) 3877ms
   ✓ whole-scene wandering > sunset stays separated inside 375 × 812  544ms
   ✓ whole-scene wandering > dandelion stays separated inside 375 × 812  445ms
   ✓ whole-scene wandering > moon stays separated inside 375 × 812  481ms
   ✓ whole-scene wandering > lantern stays separated inside 375 × 812  552ms
   ✓ whole-scene wandering > sunset stays separated inside 1280 × 800  406ms
   ✓ whole-scene wandering > dandelion stays separated inside 1280 × 800  409ms
   ✓ whole-scene wandering > moon stays separated inside 1280 × 800  500ms
   ✓ whole-scene wandering > lantern stays separated inside 1280 × 800  535ms
 ✓ src/features/calendar/calendar.test.ts (3 tests) 19ms
 ✓ src/features/home/history.test.ts (2 tests) 25ms
 ✓ src/lib/date.test.ts (8 tests) 29ms
 ✓ src/features/page/notes.test.ts (1 test) 4ms
 ✓ src/features/settings/bookLayout.test.ts (5 tests) 17ms
 ✓ src/lib/stroke.test.ts (9 tests) 11ms
 ✓ src/data/phase13.test.ts (9 tests) 53ms
 ✓ src/data/artifactStore.test.ts (12 tests) 76ms

 Test Files  28 passed (28)
      Tests  162 passed (162)
   Start at  09:35:43
   Duration  17.46s (transform 7.16s, setup 0ms, collect 136.70s, tests 5.90s, environment 5ms, prepare 19.77s)


exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Encoding UTF8 vite.config.ts; git -c core.safecrlf=false diff --check; Get-Content -Encoding UTF8 src/features/settings/useMemberFonts.ts; Get-ChildItem src/styles -File | Select-String -Pattern '\\.mom-writing|\\.dad-writing|\\.page-color|textarea' -Context 0,3" in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
 succeeded in 467ms:
import { readFileSync, writeFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { pwaPaths } from './src/lib/pwaPaths';

export default defineConfig(({ mode }) => {
  const artifact = mode === 'artifact';
  const paths = pwaPaths(!artifact && process.env.GITHUB_PAGES === 'true');
  return {
    base: artifact ? "/" : paths.base,
    define: { __ARTIFACT__: JSON.stringify(artifact) },
    plugins: [
      react(),
      ...(artifact
        ? [
            {
              name: 'artifact-font',
              transformIndexHtml(html: string) {
                const fontFaces = [
                  ['Pretendard-Regular', '400 500'],
                  ['Pretendard-SemiBold', '600'],
                  ['Pretendard-Bold', '700 900'],
                ].map(([name, weight]) => {
                  const font = readFileSync(
                    new URL(
                      `./node_modules/pretendard/dist/web/static/woff2-subset/${name}.subset.woff2`,
                      import.meta.url,
                    ),
                  ).toString('base64');
                  return `@font-face{font-family:Pretendard;font-style:normal;font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${font}) format('woff2')}`;
                }).join('');
                return html.replace(
                  /<link\b[^>]*href="https:\/\/cdn\.jsdelivr\.net[^>]*>/,
                  `<style>${fontFaces}</style>`,
                );
              },
            },
            {
              name: 'artifact-fragment',
              closeBundle() {
                const html = readFileSync('dist-artifact/index.html', 'utf8');
                const styles = [...html.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>/gi)].map(([style]) => style);
                const scripts = [...html.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(([script]) => script);
                const themeColor = html.match(/<meta\b[^>]*name=["']theme-color["'][^>]*>/i)?.[0]
                  ?? '<meta name="theme-color" content="#FAF8F5">';
                const fragment = [
                  '<title>육아 기록</title>',
                  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&display=swap">',
                  themeColor,
                  ...styles,
                  '<div id="root"></div>',
                  ...scripts,
                ].join('\n');
                writeFileSync('dist-artifact/page.html', fragment);
              },
            },
            viteSingleFile(),
          ]
        : [
            VitePWA({
              registerType: 'autoUpdate',
              includeAssets: ['icon.svg'],
              manifest: {
                start_url: paths.start_url,
                scope: paths.scope,
                name: '육아 기록',
                short_name: '육아기록',
                lang: 'ko',
                display: 'standalone',
                theme_color: '#FAF8F5',
                background_color: '#FAF8F5',
                icons: [
                  {
                    src: paths.icon,
                    sizes: 'any',
                    type: 'image/svg+xml',
                    purpose: 'any maskable',
                  },
                ],
              },
            }),
          ]),
    ],
    ...(artifact
      ? {
          publicDir: false,
          build: {
            outDir: 'dist-artifact',
            modulePreload: false,
            rollupOptions: { output: { inlineDynamicImports: true } },
          },
        }
      : {}),
  };
});
src/features/settings/bookLayout.ts:63: new blank line at EOF.
import { useEffect } from 'react';
import type { DataStore } from '../../data/DataStore';
import type { Member } from '../../data/types';

export function useMemberFonts(members: Member[], store: DataStore) {
  useEffect(() => {
    let cancelled = false;
    const fonts: FontFace[] = [];
    for (const member of members) {
      const property = `--${member.color}-font`;
      document.documentElement.style.removeProperty(property);
      const asset = member.fontAssetId;
      if (!asset) continue;
      const family = `${member.color}Writing`;
      void (async () => {
        const src = await (store.resolvePhotoSrc?.(asset) ?? Promise.resolve(asset));
        const font = new FontFace(family, `url(${JSON.stringify(src)})`);
        await font.load();
        if (cancelled) return;
        document.fonts.add(font);
        fonts.push(font);
        document.documentElement.style.setProperty(property, `'${family}'`);
      })().catch(() => {
        // Keep the default handwriting if the saved asset is unavailable.
      });
    }
    return () => {
      cancelled = true;
      fonts.forEach((font) => document.fonts.delete(font));
      members.forEach((member) =>
        document.documentElement.style.removeProperty(`--${member.color}-font`),
      );
    };
  }, [members, store]);
}

> src\styles\app.css:11:input, textarea, select { color: inherit; }
  src\styles\app.css:12:.artifact-welcome { min-height: 100dvh; display: flex; flex-direction: column; align-items: cen
ter; justify-content: center; gap: 24px; padding: calc(24px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-
inset-bottom)); background: var(--bg); }
  src\styles\app.css:13:.artifact-welcome h2 { font-size: 22px; }
  src\styles\app.css:14:.artifact-picker { display: flex; gap: 16px; width: 100%; max-width: 320px; }
> src\styles\app.css:84:.field textarea { flex: 1; resize: none; border: 0; outline: 0; background: transparent; font: 
inherit; color: var(--text); padding: 9px 0; min-height: 40px; max-height: 120px; line-height: 22px; }
> src\styles\app.css:85:.field textarea::placeholder { color: var(--sub); }
  src\styles\app.css:86:.send { width: 40px; height: 40px; border-radius: 11px; display: grid; place-items: center; bac
kground: var(--accent); color: #fff; opacity: 0; transform: scale(.85); transition: opacity .15s, transform .2s var(--e
ase); pointer-events: none; }
  src\styles\app.css:87:.send.ready { opacity: 1; transform: none; pointer-events: auto; }
  src\styles\app.css:88:.send svg { width: 20px; height: 20px; }
> src\styles\app.css:306:.page-color { background: var(--page-color); color: var(--page-ink, #1E2326); }
  src\styles\app.css:307:.search { display: flex; align-items: center; gap: 9px; min-height: 48px; margin: 16px 0; padd
ing: 0 16px; border: 1px solid var(--line); border-radius: 30px; background: var(--surface); color: var(--sub); }
  src\styles\app.css:308:.search input { width: 100%; height: 46px; border: 0; outline: 0; background: none; color: var
(--text); }
  src\styles\app.css:309:.section-head { display: flex; align-items: center; justify-content: space-between; }
> src\styles\app.css:396:.dad-writing { font-family: var(--dad-font, Gaegu), cursive; }
> src\styles\app.css:397:.mom-writing { font-family: var(--mom-font, Gaegu), cursive; }
  src\styles\app.css:398:
  src\styles\app.css:399:.sync-banner {
  src\styles\app.css:400:  position: fixed;
> src\styles\app.css:455:button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outl
ine: 2px solid currentColor; outline-offset: 3px; }
  src\styles\app.css:456:
  src\styles\app.css:457:@media (min-width: 768px) {
  src\styles\app.css:458:  .app-shell:not(.home-shell) { max-width: none; padding-bottom: 96px; }
> src\styles\page.css:34:.diary textarea:focus-visible {
  src\styles\page.css:35:  outline: 2px solid currentColor;
  src\styles\page.css:36:  outline-offset: 3px;
  src\styles\page.css:37:}
> src\styles\page.css:268:.diary textarea::placeholder,
  src\styles\page.css:269:.diary input::placeholder {
  src\styles\page.css:270:  color: inherit;
  src\styles\page.css:271:  opacity: 0.6;



exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Encoding UTF8 src/lib/usePageColorStyle.ts; Get-Content -Encoding UTF8 src/features/page/DrawingArea.tsx | Select-Object -First 110; Get-Content -Encoding UTF8 src/features/page/drawingView.test.ts,src/features/home/DayMarks.test.ts | Select-Object -First 100; Get-ChildItem node_modules -Directory -Filter '*playwright*'; Get-ChildItem -Path . -Filter 'AGENTS.md' -Recurse -File | Where-Object { "'$_.FullName -notmatch '"'node_modules' } | Select-Object -ExpandProperty FullName" in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
 succeeded in 1687ms:
import { useSyncExternalStore } from 'react';
import { pageColorStyle } from './pageColors';

function isDark() {
  const theme = document.documentElement.dataset.theme;
  return theme === 'dark' || (theme !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const media = matchMedia('(prefers-color-scheme: dark)');
  media.addEventListener('change', onChange);
  return () => {
    observer.disconnect();
    media.removeEventListener('change', onChange);
  };
}

export function useDarkMode() {
  return useSyncExternalStore(subscribe, isDark, () => false);
}

export function usePageColorStyle(color: string) {
  return pageColorStyle(color, useDarkMode());
}
import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { DataStore } from '../../data/DataStore';
import type { Page, Stroke } from '../../data/types';
import { downscalePhoto } from '../../lib/image';
import { simplifyStroke } from '../../lib/stroke';
import { penColors } from '../../lib/pageColors';
import { useDarkMode } from '../../lib/usePageColorStyle';
import { paintStroke } from './strokes';
import { PhotoFrame } from './PhotoFrame';
import {
  clampView,
  clearDrawing,
  initialView,
  normalizedPoint,
  undoDrawing,
  type View,
} from './drawingView';

export function DrawingArea({ page, store, editing, onChange, onError, onBusy, onDrawing }: {
  page: Page;
  store: DataStore;
  editing: boolean;
  onChange: (page: Page) => void;
  onError: (message: string) => void;
  onBusy: (busy: boolean) => void;
  onDrawing: (drawing: boolean) => void;
}) {
  const [drawing, setDrawing] = useState(false);
  const [stroking, setStroking] = useState(false);
  const [penWidth, setPenWidth] = useState<2 | 5>(2);
  const [eraserWidth, setEraserWidth] = useState<8 | 14 | 28>(14);
  const [eraser, setEraser] = useState(false);
  const [penColor, setPenColor] = useState('ink');
  const [popover, setPopover] = useState<'pen' | 'eraser'>();
  const [view, setView] = useState<View>(initialView);
  const viewRef = useRef(view);
  viewRef.current = view;
  const [undo, setUndo] = useState<Stroke[][]>([]);
  const box = useRef<HTMLDivElement>(null);
  const base = useRef<HTMLCanvasElement>(null);
  const live = useRef<HTMLCanvasElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const tray = useRef<HTMLDivElement>(null);
  const active = useRef<{ id: number; stroke: Stroke }>();
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ distance: number; x: number; y: number; view: View }>();
  const pan = useRef<{ id: number; x: number; y: number; view: View }>();
  const spaceHeld = useRef(false);
  const [gesturing, setGesturing] = useState(false);
  const mounted = useRef(true);
  const latestPage = useRef(page);
  latestPage.current = page;
  const dark = useDarkMode();
  useEffect(() => { onDrawing(drawing && editing); }, [drawing, editing, onDrawing]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (!popover) return;
    const outside = (event: globalThis.PointerEvent) => {
      if (!tray.current?.contains(event.target as Node)) setPopover(undefined);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [popover]);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (event.key === ' ') spaceHeld.current = true;
      if (event.key === 'Escape') setPopover(undefined);
      if (event.isComposing || !drawing || !editing) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        const next = undoDrawing({ drawing: latestPage.current.drawing, undo });
        setUndo(next.undo);
        onChange({ ...latestPage.current, drawing: next.drawing });
      }
    };
    const keyup = (event: KeyboardEvent) => {
      if (event.key === ' ') spaceHeld.current = false;
    };
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    return () => {
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
    };
  }, [drawing, editing, onChange, undo]);
  useEffect(() => {
    const canvas = base.current!;
    const overlay = live.current!;
    const redraw = () => {
      // Layout size, not getBoundingClientRect: the page opens with a scale-up animation,
      // and measuring mid-animation left the canvas at a fraction of its real resolution.
      const rect = { width: box.current!.clientWidth, height: box.current!.clientHeight };
      const clamped = clampView(viewRef.current, rect.width, rect.height);
      if (clamped.x !== viewRef.current.x || clamped.y !== viewRef.current.y) {
        viewRef.current = clamped;
        setView(clamped);
      }
      const ratio = Math.min((window.devicePixelRatio || 1) * view.zoom, 4096 / Math.max(rect.width, rect.height));
      for (const layer of [canvas, overlay]) {
        layer.width = Math.max(1, Math.round(rect.width * ratio));
        layer.height = Math.max(1, Math.round(rect.height * ratio));
        layer.getContext('2d')?.setTransform(layer.width / rect.width, 0, 0, layer.height / rect.height, 0, 0);
      }
      const context = canvas.getContext('2d');
      if (context) page.drawing.forEach(stroke => paintStroke(context, stroke, rect.width, rect.height, getComputedStyle(canvas).color, rect.width / 300));
      base.current!.style.visibility = '';
    };
import { describe, expect, it } from 'vitest';
import type { Stroke } from '../../data/types';
import { clampView, clearDrawing, initialView, normalizedPoint, undoDrawing } from './drawingView';

describe('drawing view coordinates', () => {
  it('maps box coordinates to the same surface point after zoom and pan', () => {
    expect(normalizedPoint(100, 80, 400, 320, initialView)).toEqual([.25, .25]);
    expect(normalizedPoint(100, 80, 400, 320, { zoom: 2, x: -100, y: -80 })).toEqual([.25, .25]);
    expect(normalizedPoint(120, 96, 400, 320, { zoom: 3, x: -180, y: -144 })).toEqual([.25, .25]);
    expect(normalizedPoint(-10, 900, 400, 320, initialView)).toEqual([0, 1]);
  });
  it('clamps zoom and translation so the content covers its box', () => {
    expect(clampView({ zoom: 5, x: -9999, y: 40 }, 400, 320)).toEqual({ zoom: 4, x: -1200, y: 0 });
    expect(clampView({ zoom: .5, x: -80, y: -60 }, 400, 320)).toEqual(initialView);
  });
});

describe('clear drawing history', () => {
  const stroke: Stroke = { color: 'ink', width: 2, points: [0, 0, 1, 1] };
  it('restores cleared strokes without mutating the original', () => {
    const drawing = [stroke];
    const cleared = clearDrawing({ drawing, undo: [] });
    expect(cleared.drawing).toEqual([]);
    expect(drawing).toEqual([stroke]);
    expect(undoDrawing(cleared)).toEqual({ drawing, undo: [] });
  });
  it('undoes subsequent strokes before restoring a clear, then removes the last stroke', () => {
    const cleared = clearDrawing({ drawing: [stroke], undo: [] });
    const afterStroke = { drawing: [stroke], undo: [...cleared.undo, []] };
    const undoneStroke = undoDrawing(afterStroke);
    expect(undoneStroke.drawing).toEqual([]);
    const restored = undoDrawing(undoneStroke);
    expect(restored.drawing).toEqual([stroke]);
    expect(undoDrawing(restored).drawing).toEqual([]);
    expect(undoDrawing({ drawing: [], undo: [] }).drawing).toEqual([]);
  });
  it('bounds the retained snapshots', () => {
    expect(clearDrawing({ drawing: [stroke], undo: Array(10).fill([]) }).undo).toHaveLength(10);
  });
});
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DayMarks } from './DayMarks';
describe('day history artwork', () => {
  for (const style of ['sunset', 'dandelion'] as const) {
    it(`${style} keeps 30 dated marks for empty, mixed, and full histories`, () => {
      for (const written of [0, 7, 30]) {
        const days = Array.from({
          length: 30
        }, (_, i) => i < written);
        const html = renderToStaticMarkup(createElement(DayMarks, {
          days,
          style
        }));
        expect(html.match(/class="day-mark"/g)).toHaveLength(30);
        if (style === 'sunset') {
          expect(html.match(/cy="-2.15"/g) ?? []).toHaveLength(written * 5);
          expect(html.match(/fill="#d0b5ad"/g) ?? []).toHaveLength(30 - written);
        } else {
          expect(html.match(/scale\(\.88\)/g) ?? []).toHaveLength(written);
          expect(html.match(/stroke-opacity="0.4"/g) ?? []).toHaveLength(30 - written);
        }
      }
    });
  }
});
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\AGENTS.md

codex
추가 장의 저장·재로딩과 기존 ID 호환성 테스트가 통과했습니다. 기본 Vitest 명령은 예상된 esbuild 접근 오류로 막혔지만, 설정 파일 번들링을 생략해 실행한 전체 162개 테스트는 모두 통과했고 백업 스크립트 테스트 3개도 통과했습니다. 마지막으로 코드 형식과 빈 읽기 문단 회귀 테스트를 정리하겠습니다.

apply patch
patch: completed
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\AGENTS.md
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\artifactStore.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\PageScreen.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\WritingArea.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\WritingArea.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\settings\bookExport.ts
diff --git a/AGENTS.md b/AGENTS.md
index 2470892e8da4ca7a1b74219bd99858cdefc1b51c..178fcc2726f0fbdce6531acbd9ff47250f9181a4
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -22,7 +22,7 @@
 ## Design specs (user approved)
 1. **Home** = `docs/design/home-c1-moon.html` (night style 달) and `docs/design/home-c3-lantern.html` (night style 풍등); the user picks the night style on Home (default 달). Day (light theme): select 노을 언덕 (default, `docs/design/home-day-sunset.html`) or 민들레 (`docs/design/home-day-dandelion.html`) on Home. Sunset suns have 30 ridge wildflowers (bloom/bud), with periodic bird flocks; dandelion heads have 30 seeds (fluffy/faint), with drifting background seeds and soft meadow grass. Stems end above navigation. Night (dark theme): starfield with twinkle + shooting stars, faces as moons with a 30-star crown, or as sky-lanterns with 30 beads. The 30 marks = the last 30 days; a day counts as written if EITHER parent saved a page for that child. No names on the home; accessible labels carry name + summary. Long-press a face → "최근 30일 중 N일 기록". All four styles wander smoothly across the whole safe scene below the date and above navigation (12?20 px/s on mobile, faster on desktop), with gentle tilt/bob, soft face separation, and steering away from the scene switcher. One shared animation clock pauses when hidden. Dandelion stems stretch/bend from fixed ground roots; sunset suns float freely while their 30 flowers slide horizontally along the hill below. After long-press, moving over 6px picks up the face and its marks; release flings it within safe scene bounds above navigation, with friction and edge/circle bounces; wandering resumes where the fling settles without springing home. A fling never opens a page. Reduced motion is static and drag returns directly home. Lanterns must not overlap each other's bead strings. Scene selection lives in one artwork object placed naturally per scene, with face steering avoiding its own area: sunset has a small 30px orange-rose setting sun half-occluded by the actual far ridge toward the right (6s breathing halo, faint rim shimmer, 14s gentle sinking); dandelion keeps the ladybug on its drifting seed; moon has a quiet warm-white thin four-point glint only slightly larger than background stars (4.5s subtle twinkle, soft flare every 12s); lantern has a small dim distant lantern (8s rise/sway plus flicker). Object motion shares the paused-when-hidden scene clock; all objects are static with reduced motion. Each is an accessible button named 장면 바꾸기 with an invisible ≥44px hit area and keyboard-only focus ring, behind faces and never a collision body. First three device-local Home visits shimmer once after 1.5s (no reduced-motion animation). A frosted strip groups four SVG scene thumbnails under 낮/밤; choosing persists the corresponding HomePreferences style and explicit light/dark theme, crossfades for 400ms (instant with reduced motion), and closes. Outside tap, Esc and back also close it. 설정 › 화면 keeps only 시스템/라이트/다크 and the hint 홈의 작은 집·무당벌레·별·풍등을 누르면 장면을 바꿀 수 있어요.
 2. **App shell** (archive list, calendar, settings, sheets): `docs/design/mockup-v3.html` — Pretendard, clean cards, dark filled pills/buttons, soft navy-violet dark mode. Intuitive = on every screen the thing to choose and the most important info are obvious at a glance.
-3. **Diary page** (one sheet for one child, one day, one parent): full-bleed page color, Gaegu handwriting, hand-drawn ink. NO visible borders/frames between the drawing and writing areas; the drawing area spans the full screen width edge to edge. ONLY: top bar (← back, date with ‹ ›, ONE badge icon), a small "엄마의 페이지 · 아빠의 페이지" switch (swipe or tap), a quiet fixed-height sheet-number row with ? for another saved own page, drawing, writing, bottom (💬 comments, big oval 저장/수정).
+3. **Diary page** (one sheet for one child, one day, one parent): full-bleed page color, Gaegu handwriting, hand-drawn ink. NO visible borders/frames between the drawing and writing areas; the drawing area spans the full screen width edge to edge. ONLY: top bar (← back, date with ‹ ›, ONE badge icon), a small "엄마의 페이지 · 아빠의 페이지" switch (swipe or tap), a quiet fixed-height sheet-number row with ＋ to add a sheet when the current own sheet is saved, drawing, writing, bottom (💬 comments, big oval 저장/수정).
 - Flow: Home → tap a face → that child's page for today, opened on the current writer's own page → 저장 → back to Home with toast "저장했어요". Reaching Home's archive/calendar/settings: small, quiet icons at the bottom of Home (not competing with the faces).
 - **Current writer**: use store.getCurrentMemberId() (first-visit full-screen picker / settings). No per-page writer choice. The current writer's paragraph is editable, with a small author initial beside each paragraph. Save requires text, drawing, or photo.
 - Page palette: shared ColorPicker with 3 recommended colors (벚꽃 #F4B9B8, 박하 #CDEFE2, 귤 #F59157), up to 5 viewer-local recent colors, and a frozen 40-swatch pastel grid (10 rainbow hue families × 4 tones), including all 16 legacy named colors. Normalize old colors to the nearest grid color on load. Pen colors are separate: auto ink plus 8 deeper crayons, stored per Stroke.color; `ink` means auto ink. Display colors mix 90% page color + 10% #262638 in dark mode. Auto ink chooses #1E2326 or #F5F0E1 by highest WCAG contrast against the displayed color.
diff --git a/scripts/backup/backup.check.mjs b/scripts/backup/backup.check.mjs
index 93c14b559fda0e5000ca229445592daf9bffb72c..31e898950ea6096e2c6fd0b3db73dfbfb47a64db
--- a/scripts/backup/backup.check.mjs
+++ b/scripts/backup/backup.check.mjs
@@ -19,6 +19,34 @@
   new URL('./fixtures/two-parents.json', import.meta.url),
 );
 
+test('dated archives preserve multiple sheets for one parent in creation order', async () => {
+  const snapshot = JSON.parse(await readFile(fixture, 'utf8'));
+  const first = snapshot.pages.find((page) => page.authorId === 'dad');
+  const second = {
+    ...first,
+    id: first.id + '__zzzzzzzz',
+    text: '두 번째 장',
+    createdAt: '2026-10-26T20:00:00Z',
+  };
+  const third = {
+    ...second,
+    id: first.id + '__aaaaaaaa',
+    text: '세 번째 장',
+    createdAt: '2026-10-26T21:00:00Z',
+  };
+  snapshot.pages = [third, second, ...snapshot.pages];
+  const files = toDatedArchive(snapshot);
+  assert.equal(new Set(files.map((file) => file.path)).size, files.length);
+  assert.deepEqual(
+    files.filter((file) => file.path.endsWith('.json'))
+      .map((file) => JSON.parse(file.content).id),
+    [first.id, second.id, third.id, snapshot.pages.find((page) => page.authorId === 'mom').id],
+  );
+  const markdown = files.find((file) => file.path.endsWith('.md')).content;
+  assert.ok(markdown.indexOf('아빠 기록') < markdown.indexOf('두 번째 장'));
+  assert.ok(markdown.indexOf('두 번째 장') < markdown.indexOf('세 번째 장'));
+});
+
 test('dated backup dry-run and incremental writes preserve old files and both parents', async () => {
   const directory = await mkdtemp(path.join(tmpdir(), 'diary-backup-'));
   const run = (...args) =>
diff --git a/src/App.tsx b/src/App.tsx
index 83254dd1abb764b1b15ec1e793e502bca0d244f2..da02bb99e70fa155611d5ff74b048a8abfbaa1da
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -21,6 +21,7 @@
       date: string;
       childId: string;
       authorId?: 'dad' | 'mom';
+      pageId?: string;
       editing: boolean;
       origin?: PageOrigin;
     };
@@ -54,12 +55,14 @@
     nextDate: string,
     childId: string,
     authorId?: 'dad' | 'mom',
+    pageId?: string,
   ) =>
     setScreen({
       kind: 'page',
       date: nextDate,
       childId,
       authorId,
+      pageId,
       ...source.current,
     });
   const goHome = () => setScreen({ kind: 'shell', tab: '홈' });
@@ -71,17 +74,19 @@
       <>
         <SyncBanner store={store} />
         <PageScreen
-          key={`${screen.date}__${screen.childId}__${screen.authorId ?? store.getCurrentMemberId()}`}
+          key={`${screen.date}__${screen.childId}__${screen.authorId ?? store.getCurrentMemberId()}__${screen.pageId ?? ''}`}
           store={store}
           snapshot={snapshot}
           child={child}
           date={screen.date}
           authorId={screen.authorId}
-          onAuthor={(authorId) => setScreen({ ...screen, authorId })}
+          pageId={screen.pageId}
+          onSheet={(pageId) => setScreen({ ...screen, pageId })}
+          onAuthor={(authorId) => setScreen({ ...screen, authorId, pageId: undefined })}
           startEditing={screen.editing}
           origin={screen.origin}
           onBack={goHome}
-          onDate={(nextDate) => setScreen({ ...screen, date: nextDate })}
+          onDate={(nextDate) => setScreen({ ...screen, date: nextDate, pageId: undefined })}
           onSaved={() => {
             setDate(screen.date);
             setSavedToast(true);
diff --git a/src/data/DataStore.ts b/src/data/DataStore.ts
index f971f02a5dfebfb3d80078f7b9969496a9c389f5..7a060f742f390c8bc42505056d4e66e94fd40b12
--- a/src/data/DataStore.ts
+++ b/src/data/DataStore.ts
@@ -26,6 +26,7 @@
   listMembers(): Member[];
   listTags(): Tag[];
   listPages(range?: PageRange): Page[];
+  getPageById(id: string): Page | undefined;
   getPage(
     date: string,
     childId: string,
diff --git a/src/data/artifactStore.test.ts b/src/data/artifactStore.test.ts
index b5713064c8ceb7becb8c1189d59f0918d23a179e..e460b5fda6d74d3376ab7c3bb757b3290bb86fcc
--- a/src/data/artifactStore.test.ts
+++ b/src/data/artifactStore.test.ts
@@ -4,6 +4,31 @@
 import * as images from '../lib/image';
 
 afterEach(() => vi.restoreAllMocks());
+it('preserves and lazily reloads both same-day sheets and checks every body before export', async () => {
+  const db = new FakeDb();
+  const first = page('2020-01-01');
+  const second = { ...first, id: first.id + '__abc12345', text: '두 번째 장', createdAt: '2026-10-26T04:00:00Z' };
+  const store = new ArtifactStore(db, 'viewer');
+  store.savePage(first);
+  store.savePage(second);
+  await settle();
+  store.dispose();
+  const loaded = new ArtifactStore(db, 'viewer');
+  expect(loaded.getPageById(first.id)).toBeUndefined();
+  expect(loaded.getPageById(second.id)).toBeUndefined();
+  expect(await loaded.loadPage(second.id)).toEqual(second);
+  expect(() => loaded.exportAll()).toThrow();
+  expect(await loaded.loadPage(first.id)).toEqual(first);
+  expect(loaded.exportAll().pages).toHaveLength(2);
+  loaded.savePage({ ...first, text: '첫 장 수정', updatedAt: '2026-10-26T05:00:00Z' });
+  await settle();
+  expect(loaded.getPage(first.date, first.childId, first.authorId)?.id).toBe(second.id);
+  expect(loaded.getPageById(second.id)?.text).toBe(second.text);
+  expect(db.bodies.get('index/2020-01')).toMatchObject({
+    pages: { [first.id]: { createdAt: first.createdAt }, [second.id]: { createdAt: second.createdAt } },
+  });
+  loaded.dispose();
+});
 it('writes one full body per page and small index summaries with no media bytes', async () => {
   const db = new FakeDb();
   const store = new ArtifactStore(db, 'viewer');
diff --git a/src/data/artifactStore.ts b/src/data/artifactStore.ts
index 12bc4bc34c5b1a126e4edb9ed437b89b8e321250..288f80d517b66fd732498258555e49d5b515e2c2
--- a/src/data/artifactStore.ts
+++ b/src/data/artifactStore.ts
@@ -1,5 +1,6 @@
 import { normalizePageColor } from '../lib/pageColors';
 import { todayKey } from '../lib/date';
+import { sheetsFor } from '../lib/pageId';
 import { LegacyAdapter } from './legacyAdapter';
 import { migrateMonthSnapshot, defaultChildStatus, defaultPageColor } from './migrate';
 import { preparePage } from '../lib/stroke';
@@ -55,6 +56,7 @@
     tagIds: page.tagIds,
     hasDrawing: page.drawing.length > 0,
     photoCount: page.photos.length,
+    createdAt: page.createdAt,
     updatedAt: page.updatedAt,
     deletedAt: null,
   };
@@ -100,7 +102,7 @@
             tagIds: summary.tagIds,
             drawing: [],
             photos: [],
-            createdAt: summary.updatedAt,
+            createdAt: summary.createdAt ?? summary.updatedAt,
             updatedAt: summary.updatedAt,
           },
     ),
@@ -536,14 +538,19 @@
     childId: string,
     authorId = this.getCurrentMemberId() || 'dad',
   ): Page | undefined {
-    const id = date + '__' + childId + '__' + authorId;
+    const page = sheetsFor(this.snapshot.pages, date, childId, authorId).slice(
+      -1,
+    )[0];
+    return page ? this.getPageById(page.id) : undefined;
+  }
+  getPageById(id: string): Page | undefined {
     if (
       this.cache.has(id) ||
       this.pending.some((write) => write.path === 'pages/' + id)
     ) {
       return this.snapshot.pages.find((page) => page.id === id);
     }
-    if (!this.months[date.slice(0, 7)]?.pages[id])
+    if (!this.months[id.slice(0, 7)]?.pages[id])
       return this.snapshot.pages.find((page) => page.id === id);
     return undefined;
   }
@@ -756,7 +763,7 @@
   exportAll(): StoreSnapshot {
     if (
       this.snapshot.pages.some(
-        (page) => !this.getPage(page.date, page.childId, page.authorId),
+        (page) => !this.getPageById(page.id),
       )
     )
       throw new Error('페이지를 불러온 뒤 백업해 주세요.');
diff --git a/src/data/legacyAdapter.ts b/src/data/legacyAdapter.ts
index 4d7ce7f39a0ad9354ba0eeffdc3ef38daa6b4fb9..2709be0fd351ca154fa2f3dee184eeaac556332b
--- a/src/data/legacyAdapter.ts
+++ b/src/data/legacyAdapter.ts
@@ -1,6 +1,7 @@
 import type { DataStore } from './DataStore';
 import type { Child, Page, StoreSnapshot } from './types';
 import { noteAuthor } from './migrate';
+import { basePageId, isValidPageId } from '../lib/pageId';
 
 export type LegacyEntry = {
   id: string;
@@ -34,6 +35,9 @@
   abstract updateChild(child: Child): void;
   abstract uploadPhoto(blob: Blob): Promise<{ src: string }>;
   protected async removePhotoAsset(_src: string): Promise<void> {}
+  getPageById(id: string): Page | undefined {
+    return this.getSnapshot().pages.find((page) => page.id === id);
+  }
   async loadPage(id: string): Promise<Page> {
     const page = this.getSnapshot().pages.find((item) => item.id === id);
     if (!page) throw new Error('페이지를 찾을 수 없어요.');
@@ -111,7 +115,9 @@
   updateEntry(entry: LegacyEntry): void {
     const data = this.getSnapshot();
     const authorId = noteAuthor(entry.authorId, data.members);
-    const id = entry.date + '__' + entry.childId + '__' + authorId;
+    const id = isValidPageId({ ...entry, authorId })
+      ? entry.id
+      : basePageId(entry.date, entry.childId, authorId);
     const page = data.pages.find((item) => item.id === id);
     this.savePage({
       ...page,
diff --git a/src/data/localStore.test.ts b/src/data/localStore.test.ts
index ff7912a470d2cc65be0d5a6ae6970cd167c23a28..442dbfda6b4d1aba90ddfa2dafbcf9085a144162
--- a/src/data/localStore.test.ts
+++ b/src/data/localStore.test.ts
@@ -65,6 +65,25 @@
 });
 
 describe('page migration and local persistence', () => {
+  it('saves, reloads and independently updates additional same-day sheets', async () => {
+    const store = new LocalStore();
+    const first = migrateSnapshot(legacy()).pages[0];
+    const second = { ...first, id: first.id + '__abc12345', text: '두 번째 장', createdAt: '2026-10-26T05:00:00Z' };
+    store.savePage(first);
+    store.savePage(second);
+    const loaded = new LocalStore();
+    expect(await loaded.loadPage(first.id)).toEqual(first);
+    expect(await loaded.loadPage(second.id)).toEqual(second);
+    loaded.savePage({ ...second, text: '두 번째 장 수정' });
+    expect(new LocalStore().getPageById(first.id)).toEqual(first);
+    expect(new LocalStore().getPageById(second.id)?.text).toBe('두 번째 장 수정');
+    expect(loaded.getPage(first.date, first.childId, first.authorId)?.id).toBe(second.id);
+    loaded.updateEntry({
+      ...second, content: '호환 경로 수정',
+    });
+    expect(loaded.getPageById(second.id)?.text).toBe('호환 경로 수정');
+    expect(loaded.getPageById(first.id)).toEqual(first);
+  });
   it('normalizes stored page and default child colors on load', () => {
     const data = migrateSnapshot(legacy());
     data.pages[0].color = '#0F4D3A';
diff --git a/src/data/localStore.ts b/src/data/localStore.ts
index 12680619118dcfaea6acc91957a09ed6514c27ba..eb37c8d5740b98661822f2666c16c3dbc28a1cf4
--- a/src/data/localStore.ts
+++ b/src/data/localStore.ts
@@ -3,6 +3,7 @@
 import { LegacyAdapter } from './legacyAdapter';
 import { defaultChildStatus, migrateSnapshot, type LegacySnapshot } from './migrate';
 import { preparePage } from '../lib/stroke';
+import { sheetsFor } from '../lib/pageId';
 import { downscalePhoto, blobToDataUrl } from '../lib/image';
 import type { DataStore } from './DataStore';
 import { seedChildren, seedMembers, seedTags } from './seed';
@@ -164,9 +165,7 @@
     childId: string,
     authorId = this.getCurrentMemberId() || 'dad',
   ): Page | undefined {
-    return this.snapshot.pages.find(
-      (page) => page.id === date + '__' + childId + '__' + authorId,
-    );
+    return sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
   }
 
   savePage(page: Page): void {
diff --git a/src/data/migrate.ts b/src/data/migrate.ts
index 85c598394abec3735d904cf7234107ba2124cdd8..f9fcd44cb1693aac5585d753846bf5b007d7f001
--- a/src/data/migrate.ts
+++ b/src/data/migrate.ts
@@ -1,4 +1,5 @@
 import { normalizePageColor } from '../lib/pageColors';
+import { basePageId } from '../lib/pageId';
 import type { LegacyEntry } from './legacyAdapter';
 import type {
   Child,
@@ -164,11 +165,11 @@
         a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
     );
     const owner = notes[0]?.authorId ?? 'dad';
-    owners.set(source.id, source.date + '__' + source.childId + '__' + owner);
+    owners.set(source.id, basePageId(source.date, source.childId, owner));
     for (const authorId of [
       ...new Set([owner, ...notes.map((note) => note.authorId)]),
     ]) {
-      const id = source.date + '__' + source.childId + '__' + authorId;
+      const id = basePageId(source.date, source.childId, authorId);
       const { notes: _, ...rest } = source;
       const value: Page = {
         ...rest,
diff --git a/src/data/supabaseStore.test.ts b/src/data/supabaseStore.test.ts
index 8d3a728323a7fc1e20faa3e6f6b2e7654c02f7ef..1bfb0421cebbff3358a29390c6a625b8099d9cd7
--- a/src/data/supabaseStore.test.ts
+++ b/src/data/supabaseStore.test.ts
@@ -103,6 +103,28 @@
 });
 afterEach(() => { stores.forEach((store) => store.dispose()); stores = []; vi.unstubAllGlobals(); });
 describe('family SupabaseStore', () => {
+  it('persists, reloads and updates same-day sheets independently by ID', async () => {
+    const server = fakeServer();
+    const store = create(server);
+    await ready(store);
+    const second = { ...page, id: page.id + '__abc12345', text: '두 번째 장', createdAt: '2026-10-26T01:00:00Z' };
+    store.savePage(page);
+    store.savePage(second);
+    vi.stubGlobal('navigator', { onLine: true });
+    store.retry();
+    await vi.waitFor(() => expect(store.getStatus().pending).toBe(0));
+    store.dispose();
+    const loaded = create(server);
+    await ready(loaded);
+    expect(await loaded.loadPage(page.id)).toEqual(page);
+    expect(await loaded.loadPage(second.id)).toEqual(second);
+    expect(loaded.getPage(page.date, page.childId, page.authorId)?.id).toBe(second.id);
+    loaded.savePage({ ...second, text: '두 번째 장 수정' });
+    await vi.waitFor(() => expect(loaded.getStatus().pending).toBe(0));
+    expect(server.rows.pages).toHaveLength(2);
+    expect(loaded.getPageById(page.id)).toEqual(page);
+    expect(loaded.getPageById(second.id)?.text).toBe('두 번째 장 수정');
+  });
   it('queues only the current member font and sends its storage path, including reset', async () => {
     const server = fakeServer();
     const store = create(server);
diff --git a/src/data/supabaseStore.ts b/src/data/supabaseStore.ts
index 8e7946188600aa4ea4e61091c345cefb1e259a94..3f1a707e942ff04b9d521a686e47a5a06e68ee06
--- a/src/data/supabaseStore.ts
+++ b/src/data/supabaseStore.ts
@@ -3,6 +3,7 @@
 import { externalizeSnapshot, hasInlinePhotos } from './importPhotos';
 import { LegacyAdapter } from './legacyAdapter';
 import { preparePage } from '../lib/stroke';
+import { sheetsFor } from '../lib/pageId';
 import { downscalePhoto } from '../lib/image';
 import { enterFamily, loadMembership, makeInvite, inviteRequired, inviteFailure, type FamilyMembership } from './familyAccess';
 import {
@@ -595,9 +596,7 @@
     childId: string,
     authorId = this.membership?.member_id === 'mom' ? 'mom' : 'dad',
   ): Page | undefined {
-    return this.snapshot.pages.find(
-      (page) => page.id === date + '__' + childId + '__' + authorId,
-    );
+    return sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
   }
   savePage(page: Page): void {
     if (page.photos.some((photo) => photo.src.startsWith('data:')))
diff --git a/src/data/types.ts b/src/data/types.ts
index a565623240c4c75b5494dac7f23863356708bebe..896b815d2be90a47dea69f388e141a7902d88765
--- a/src/data/types.ts
+++ b/src/data/types.ts
@@ -85,6 +85,7 @@
   Page,
   'id' | 'date' | 'childId' | 'authorId' | 'color' | 'tagIds' | 'updatedAt'
 > & {
+  createdAt?: string;
   firstLine: string;
   hasDrawing: boolean;
   photoCount: number;
diff --git a/src/features/page/PageScreen.tsx b/src/features/page/PageScreen.tsx
index ca12a5b57216a2324e49cfcc7497dac71bc0268f..8bd13c5acb580f6ccdbeae43468999303651ca8f
--- a/src/features/page/PageScreen.tsx
+++ b/src/features/page/PageScreen.tsx
@@ -13,6 +13,7 @@
 import { usePageColorStyle } from '../../lib/usePageColorStyle';
 import { noteAuthor } from '../../data/migrate';
 import { preparePage } from '../../lib/stroke';
+import { basePageId, newSheetId, sheetsFor } from '../../lib/pageId';
 import { BadgeSheet } from './BadgeSheet';
 import { CommentsSheet } from './CommentsSheet';
 import { DiarySheet } from './DiarySheet';
@@ -33,6 +34,8 @@
   child,
   date,
   authorId,
+  pageId,
+  onSheet,
   onAuthor,
   startEditing,
   origin,
@@ -45,6 +48,8 @@
   child: Child;
   date: string;
   authorId?: 'dad' | 'mom';
+  pageId?: string;
+  onSheet: (pageId: string) => void;
   onAuthor: (authorId: 'dad' | 'mom') => void;
   startEditing: boolean;
   origin?: PageOrigin;
@@ -53,15 +58,20 @@
   onSaved: (pageId: string) => void;
 }) {
   const [initial] = useState(() => {
-    const saved = store.getPage(date, child.id, authorId);
+    const author =
+      authorId ??
+      noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members);
+    const id =
+      pageId ??
+      sheetsFor(snapshot.pages, date, child.id, author).slice(-1)[0]?.id ??
+      basePageId(date, child.id, author);
+    const saved = store.getPageById(id);
     const now = new Date().toISOString();
     const blank: Page = {
-      id: `${date}__${child.id}__${authorId ?? noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members)}`,
+      id,
       childId: child.id,
       date,
-      authorId:
-        authorId ??
-        noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members),
+      authorId: author,
       drawing: [],
       photos: [],
       text: '',
@@ -71,15 +81,13 @@
     };
     return {
       saved: !!saved || snapshot.pages.some((page) => page.id === blank.id),
+      loading: !saved && snapshot.pages.some((page) => page.id === id),
       page: structuredClone(saved ?? blank),
     };
   });
   const [page, setPage] = useState(initial.page);
   const baseline = useRef(initial.page);
-  const [loading, setLoading] = useState(
-    !store.getPage(date, child.id, authorId) &&
-      snapshot.pages.some((page) => page.id === initial.page.id),
-  );
+  const [loading, setLoading] = useState(initial.loading);
   useEffect(() => {
     if (!loading) return;
     let active = true;
@@ -109,6 +117,11 @@
     ? undefined
     : noteAuthor(store.getCurrentMemberId(), snapshot.members);
   const ownPage = page.authorId === writer;
+  const savedSheets = sheetsFor(snapshot.pages, date, child.id, page.authorId);
+  const currentSaved = savedSheets.some((sheet) => sheet.id === page.id);
+  const sheets = currentSaved ? savedSheets : [...savedSheets, page];
+  const showSheetNumbers =
+    savedSheets.length >= 2 || (!currentSaved && !!pageId);
   const [drawing, setDrawing] = useState(false);
   const [sheet, setSheet] = useState<'badges' | 'palette' | 'comments'>();
   const [pending, setPending] = useState<() => void>();
@@ -298,6 +311,29 @@
             </button>
           ))}
         </div>
+        <div className="page-sheets" role="group" aria-label="이 날의 장">
+          {showSheetNumbers &&
+            sheets.map((sheet, index) => (
+              <button
+                key={sheet.id}
+                aria-label={`${index + 1}번째 장`}
+                aria-pressed={sheet.id === page.id}
+                onClick={() => navigate(() => onSheet(sheet.id))}
+              >
+                {index + 1}
+              </button>
+            ))}
+          {ownPage && !store.readOnly && currentSaved && (
+            <button
+              aria-label="한 장 더 쓰기"
+              onClick={() =>
+                navigate(() => onSheet(newSheetId(date, child.id, page.authorId)))
+              }
+            >
+              ＋
+            </button>
+          )}
+        </div>
         <DrawingArea
           page={{ ...page, color: page.color ?? child.pageColor }}
           store={store}
diff --git a/src/features/page/WritingArea.test.ts b/src/features/page/WritingArea.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..cb24684bee9ebabb274ff972ef73bcd31d589b6c
--- /dev/null
+++ b/src/features/page/WritingArea.test.ts
@@ -0,0 +1,38 @@
+import { createElement } from 'react';
+import { renderToStaticMarkup } from 'react-dom/server';
+import { expect, it } from 'vitest';
+import type { Note } from '../../data/types';
+import { WritingArea } from './WritingArea';
+
+const note: Note = {
+  id: 'sheet',
+  authorId: 'mom',
+  text: '',
+  createdAt: '2026-11-02T00:00:00Z',
+  updatedAt: '2026-11-02T00:00:00Z',
+};
+
+it.each(['', ' \n '])('omits blank read-only paragraphs: %j', (text) => {
+  const html = renderToStaticMarkup(createElement(WritingArea, {
+    name: '조이', notes: [{ ...note, text }], editing: false,
+    writer: 'dad', onText: () => undefined,
+  }));
+  expect(html).not.toContain('<p');
+  expect(html).not.toContain('class="initial"');
+});
+
+it('renders saved writing with the author initial and keeps an empty own editor available', () => {
+  const html = renderToStaticMarkup(createElement(WritingArea, {
+    name: '조이', notes: [{ ...note, text: '오늘도 사랑해' }], editing: false,
+    writer: 'dad', onText: () => undefined,
+  }));
+  expect(html).toContain('class="note mom-writing"');
+  expect(html).toContain('오늘도 사랑해');
+  expect(html).toContain('class="initial">엄</span>');
+  const editor = renderToStaticMarkup(createElement(WritingArea, {
+    name: '조이', notes: [{ ...note, authorId: 'dad' }], editing: true,
+    writer: 'dad', onText: () => undefined,
+  }));
+  expect(editor).toContain('<textarea');
+  expect(editor).not.toContain('<p');
+});
diff --git a/src/features/page/WritingArea.tsx b/src/features/page/WritingArea.tsx
index ef273ae1617da347d1bc699fdc7b2e5bb8501f58..b2973236d4e292af8458feb9d94316cce8bb66ee
--- a/src/features/page/WritingArea.tsx
+++ b/src/features/page/WritingArea.tsx
@@ -15,12 +15,19 @@
   return (
     <section className="writing" aria-label={`${name}의 일기`}>
       <div className="notes">
-        {notes.filter((note) => !editing || note.id !== current?.id).map((note) => (
-          <p key={note.id} className={`note ${note.authorId}-writing`}>
-            {note.text}
-            <span className="initial">{note.authorId === 'dad' ? '아' : '엄'}</span>
-          </p>
-        ))}
+        {notes
+          .filter(
+            (note) =>
+              note.text.trim() && (!editing || note.id !== current?.id),
+          )
+          .map((note) => (
+            <p key={note.id} className={`note ${note.authorId}-writing`}>
+              {note.text}
+              <span className="initial">
+                {note.authorId === 'dad' ? '아' : '엄'}
+              </span>
+            </p>
+          ))}
         {editing && writer && (
           <div className="editable-note">
             <span className="initial">{writer === 'dad' ? '아' : '엄'}</span>
diff --git a/src/features/settings/bookExport.ts b/src/features/settings/bookExport.ts
index 18d005769dac657806ed49beb4341262f4ad212f..044dd9f237cfe1563c0d8b1b1dafef88168ef2ea
--- a/src/features/settings/bookExport.ts
+++ b/src/features/settings/bookExport.ts
@@ -1,9 +1,16 @@
 import type { DataStore } from '../../data/DataStore';
 import type { Page, StoreSnapshot } from '../../data/types';
 import { inkFor } from '../../lib/pageColors';
+import { sheetsFor } from '../../lib/pageId';
 import { downloadFile } from '../../lib/download';
 import { paintStroke } from '../page/strokes';
-import { BOOK, bookFilename, fitTextPages, wrapText } from './bookLayout';
+import {
+  BOOK,
+  bookFilename,
+  compareBookSheets,
+  fitTextPages,
+  wrapText,
+} from './bookLayout';
 import { loadPdf, loadZip } from '../../lib/loadExportLibs';
 
 export type BookOptions = {
@@ -167,7 +174,7 @@
         (!options.childId || page.childId === options.childId) &&
         (!options.authorId || page.authorId === options.authorId),
     )
-    .sort((a, b) => a.id.localeCompare(b.id));
+    .sort(compareBookSheets);
   if (!pages.length) throw new Error('선택한 기간에 기록이 없어요.');
   progress(0, pages.length);
   const fonts: FontFace[] = [];
@@ -253,6 +260,9 @@
             all.children.find((child) => child.id === page.childId)?.name ??
               page.childId,
             page.authorId === 'mom' ? '엄마' : '아빠',
+            sheetsFor(pages, page.date, page.childId, page.authorId).findIndex(
+              (sheet) => sheet.id === page.id,
+            ) + 1,
           );
           zip.file(
             pageIndex ? name.replace(/\.png$/, `_${pageIndex + 1}.png`) : name,
diff --git a/src/features/settings/bookLayout.test.ts b/src/features/settings/bookLayout.test.ts
index eb122956ac6cddebccf2fb463aac45f6ebe64562..31815cf8136f1c456a73a9340b6edc7a9a093d1d
--- a/src/features/settings/bookLayout.test.ts
+++ b/src/features/settings/bookLayout.test.ts
@@ -1,7 +1,19 @@
 import { describe, expect, it } from 'vitest';
-import { BOOK, bookFilename, fitTextPages, mmToPx, wrapText } from './bookLayout';
+import { BOOK, bookFilename, compareBookSheets, fitTextPages, mmToPx, wrapText } from './bookLayout';
+import { page } from '../../data/testDb';
 
 describe('book layout', () => {
+  it('keeps same-day sheets in creation order and gives each image and continuation its own name', () => {
+    const first = page();
+    const second = { ...first, id: first.id + '__zzzzzzzz', createdAt: '2026-10-26T04:00:00Z' };
+    const third = { ...second, id: first.id + '__aaaaaaaa', createdAt: '2026-10-26T05:00:00Z' };
+    expect([third, second, first].sort(compareBookSheets)).toEqual([first, second, third]);
+    const names = [1, 2, 3].flatMap((number) => {
+      const name = bookFilename(first.date, '조비안', '아빠', number);
+      return [name, name.replace(/\.png$/, '_2.png')];
+    });
+    expect(new Set(names).size).toBe(6);
+  });
   it('rounds A5 millimetres to 300 dpi pixels', () => {
     expect(BOOK).toEqual({ width: 1748, height: 2480 });
     expect(mmToPx(25.4)).toBe(300);
diff --git a/src/features/settings/bookLayout.ts b/src/features/settings/bookLayout.ts
index 1d73521acbd3e3e9326c361384ced1e2b928c310..e73b8254cfd1c77e6789f97ded07ff7ea3f2eefe
--- a/src/features/settings/bookLayout.ts
+++ b/src/features/settings/bookLayout.ts
@@ -1,3 +1,5 @@
+import type { Page } from '../../data/types';
+
 export const mmToPx = (mm: number, dpi = 300) => Math.round((mm / 25.4) * dpi);
 export const BOOK = { width: mmToPx(148), height: mmToPx(210) };
 
@@ -5,11 +7,12 @@
   date: string,
   child: string,
   author: string,
+  sheetNumber = 1,
 ): string {
   const safe = (value: string) =>
     value.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '') ||
     '이름없음';
-  return `${date}_${safe(child)}_${safe(author)}.png`;
+  return `${date}_${safe(child)}_${safe(author)}${sheetNumber > 1 ? `__장${sheetNumber}` : ''}.png`;
 }
 
 export function wrapText(
@@ -48,3 +51,13 @@
   }
   return { size, pages: pages.length ? pages : [[]] };
 }
+export function compareBookSheets(a: Page, b: Page): number {
+  return (
+    a.date.localeCompare(b.date) ||
+    a.childId.localeCompare(b.childId) ||
+    a.authorId.localeCompare(b.authorId) ||
+    a.createdAt.localeCompare(b.createdAt) ||
+    a.id.localeCompare(b.id)
+  );
+}
+
diff --git a/src/lib/datedArchive.mjs b/src/lib/datedArchive.mjs
index d6dd32321d4f90ea119a30b25981521b76a25a66..ab875f0569d6ad27155cd22f6945ef97986e9eec
--- a/src/lib/datedArchive.mjs
+++ b/src/lib/datedArchive.mjs
@@ -1,10 +1,17 @@
+function comparePages(a, b) {
+  return (
+    a.date.localeCompare(b.date) ||
+    a.childId.localeCompare(b.childId) ||
+    a.authorId.localeCompare(b.authorId) ||
+    a.createdAt.localeCompare(b.createdAt) ||
+    a.id.localeCompare(b.id)
+  );
+}
+
 export function toMarkdown(all, month) {
   const pages = all.pages
     .filter((page) => !month || page.date.startsWith(month))
-    .sort(
-      (a, b) =>
-        a.date.localeCompare(b.date) || a.childId.localeCompare(b.childId),
-    );
+    .sort(comparePages);
   const children = new Map(all.children.map((child) => [child.id, child.name]));
   const members = new Map(
     all.members.map((member) => [member.id, member.displayName]),
@@ -71,7 +78,7 @@
     const directory = 'diary/' + date.split('-').join('/');
     const pages = snapshot.pages
       .filter((page) => page.date === date)
-      .sort((a, b) => a.id.localeCompare(b.id));
+      .sort(comparePages);
     for (const page of pages)
       files.push({
         path:
@@ -80,6 +87,9 @@
           encodeURIComponent(page.childId) +
           '-' +
           page.authorId +
+          (page.id === `${page.date}__${page.childId}__${page.authorId}`
+            ? ''
+            : '--' + encodeURIComponent(page.id)) +
           '.json',
         content: JSON.stringify(page, null, 2),
       });
diff --git a/src/lib/exportFormat.test.ts b/src/lib/exportFormat.test.ts
index 784cf902cd7bc3b95314a2e919091f489be90d1e..b570cb06d564c32674c113c21da3590998830e40
--- a/src/lib/exportFormat.test.ts
+++ b/src/lib/exportFormat.test.ts
@@ -1,5 +1,5 @@
 import { describe, expect, it } from 'vitest';
-import { fromBackupJson, toBackupJson, toMarkdown } from './exportFormat';
+import { fromBackupJson, toBackupJson, toMarkdown, toDatedArchive } from './exportFormat';
 import { migrateSnapshot, type LegacySnapshot } from '../data/migrate';
 import { seedChildren, seedMembers, seedTags } from '../data/seed';
 
@@ -38,6 +38,41 @@
 ];
 
 describe('page exports', () => {
+  it('round-trips all same-day sheets with their own media, comments and reactions', () => {
+    const second = {
+      ...all.pages[0],
+      id: all.pages[0].id + '__abc12345',
+      text: '두 번째 장',
+      createdAt: '2026-10-26T01:00:00Z',
+    };
+    const data = {
+      ...all,
+      pages: [second, all.pages[0]],
+      comments: [...all.comments, { ...all.comments[0], id: 'second-comment', pageId: second.id }],
+      reactions: [...all.reactions, { ...all.reactions[0], pageId: second.id }],
+    };
+    expect(fromBackupJson(toBackupJson(data))).toEqual(data);
+    expect(migrateSnapshot(data)).toEqual(data);
+    const files = toDatedArchive(data);
+    const json = files.filter((file) => file.path.endsWith('.json'));
+    expect(new Set(files.map((file) => file.path)).size).toBe(files.length);
+    expect(json.map((file) => JSON.parse(file.content))).toEqual([all.pages[0], second]);
+    const markdown = files.find((file) => file.path.endsWith('.md'))!.content;
+    expect(markdown.indexOf('첫 걸음')).toBeLessThan(markdown.indexOf('두 번째 장'));
+  });
+  it.each([
+    '2026-10-26__kid1__mom',
+    '2026-10-27__kid1__dad',
+    '2026-10-26__kid2__dad',
+    '2026-10-26__kid1__dad__1234567',
+    '2026-10-26__kid1__dad__123456789',
+    '2026-10-26__kid1__dad__ABC12345',
+    '2026-10-26__kid1__dad__abc12345__extra',
+  ])('rejects malformed or mismatched v3 sheet ID %s', (id) => {
+    expect(() => fromBackupJson({
+      ...toBackupJson(all), pages: [{ ...all.pages[0], id }],
+    })).toThrow();
+  });
   it('round-trips v3 including drawings, photos and activity', () => {
     const backup = toBackupJson(all);
     expect(backup.version).toBe(3);
diff --git a/src/lib/exportFormat.ts b/src/lib/exportFormat.ts
index 580b521cd97b9d598c2ba3343e908b435c7d6d18..310d396f34f82a3714de28d1724f30f26f633646
--- a/src/lib/exportFormat.ts
+++ b/src/lib/exportFormat.ts
@@ -1,5 +1,6 @@
 import { migrateSnapshot, type LegacySnapshot } from '../data/migrate';
 import type { StoreSnapshot } from '../data/types';
+import { isValidPageId } from './pageId';
 
 export type BackupJson = StoreSnapshot & { version: 3; exportedAt: string };
 
@@ -71,8 +72,7 @@
     data.version === 3 &&
     snapshot.pages.some(
       (page) =>
-        !['dad', 'mom'].includes(page.authorId) ||
-        page.id !== page.date + '__' + page.childId + '__' + page.authorId ||
+        !isValidPageId(page) ||
         typeof page.text !== 'string',
     )
   )
diff --git a/src/lib/pageId.test.ts b/src/lib/pageId.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..7e00d921642c16354cfa41d1560896aee26b918d
--- /dev/null
+++ b/src/lib/pageId.test.ts
@@ -0,0 +1,77 @@
+import { describe, expect, it } from 'vitest';
+import { basePageId, isValidPageId, newSheetId, sheetsFor } from './pageId';
+import { preparePage } from './stroke';
+import type { Page } from '../data/types';
+
+const page: Page = {
+  id: '2026-11-02__kid1__dad',
+  date: '2026-11-02',
+  childId: 'kid1',
+  authorId: 'dad',
+  text: '첫 장',
+  drawing: [],
+  photos: [],
+  tagIds: [],
+  createdAt: '2026-11-02T00:00:00Z',
+  updatedAt: '2026-11-02T00:00:00Z',
+};
+
+describe('page IDs and sheet order', () => {
+  it('keeps first IDs and generates independent eight-character sheet suffixes', () => {
+    expect(basePageId(page.date, page.childId, page.authorId)).toBe(page.id);
+    const ids = new Set(
+      Array.from({ length: 100 }, () =>
+        newSheetId(page.date, page.childId, page.authorId),
+      ),
+    );
+    expect(ids.size).toBe(100);
+    for (const id of ids) {
+      expect(id).toMatch(/^2026-11-02__kid1__dad__[a-z0-9]{8}$/);
+      expect(isValidPageId({ ...page, id })).toBe(true);
+      expect(preparePage({ ...page, id }).id).toBe(id);
+    }
+    expect(isValidPageId(page)).toBe(true);
+  });
+
+  it.each([
+    '__abc1234',
+    '__abc123456',
+    '__ABC12345',
+    '__abc_1234',
+    '__abc-1234',
+    '__abc12345__extra',
+    '__abc12345\n',
+    '__',
+  ])('rejects malformed suffix %j', (suffix) => {
+    const invalid = { ...page, id: page.id + suffix };
+    expect(isValidPageId(invalid)).toBe(false);
+    expect(() => preparePage(invalid)).toThrow();
+  });
+
+  it('rejects IDs mismatching any identity field', () => {
+    expect(isValidPageId({ ...page, date: '2026-11-03' })).toBe(false);
+    expect(isValidPageId({ ...page, childId: 'kid2' })).toBe(false);
+    expect(isValidPageId({ ...page, authorId: 'mom' })).toBe(false);
+    expect(isValidPageId({ ...page, childId: '' })).toBe(false);
+  });
+
+  it('filters the exact day, child and parent and sorts by creation then ID without mutation', () => {
+    const second = { ...page, id: page.id + '__zzzzzzzz', createdAt: '2026-11-02T01:00:00Z' };
+    const third = { ...second, id: page.id + '__aaaaaaaa', createdAt: '2026-11-02T02:00:00Z' };
+    const tied = { ...third, id: page.id + '__bbbbbbbb' };
+    const pages = [
+      tied,
+      third,
+      second,
+      { ...page, updatedAt: '2026-11-03T00:00:00Z' },
+      { ...page, date: '2026-11-01' },
+      { ...page, childId: 'kid2' },
+      { ...page, authorId: 'mom' as const },
+    ];
+    const before = structuredClone(pages);
+    expect(sheetsFor(pages, page.date, page.childId, page.authorId).map((p) => p.id)).toEqual([
+      page.id, second.id, third.id, tied.id,
+    ]);
+    expect(pages).toEqual(before);
+  });
+});
diff --git a/src/lib/pageId.ts b/src/lib/pageId.ts
new file mode 100644
index 0000000000000000000000000000000000000000..3d44116710f40c1752a86239aba3d758e6702c6a
--- /dev/null
+++ b/src/lib/pageId.ts
@@ -0,0 +1,66 @@
+import type { Page } from '../data/types';
+
+export function basePageId(
+  date: string,
+  childId: string,
+  authorId: Page['authorId'],
+): string {
+  return `${date}__${childId}__${authorId}`;
+}
+
+export function newSheetId(
+  date: string,
+  childId: string,
+  authorId: Page['authorId'],
+): string {
+  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
+  let suffix = '';
+  // Rejection sampling keeps all 36 characters equally likely.
+  while (suffix.length < 8) {
+    for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
+      if (byte < 252 && suffix.length < 8) suffix += alphabet[byte % 36];
+    }
+  }
+  return `${basePageId(date, childId, authorId)}__${suffix}`;
+}
+
+export function isValidPageId(
+  page: Pick<Page, 'id' | 'date' | 'childId' | 'authorId'>,
+): boolean {
+  if (
+    typeof page.id !== 'string' ||
+    typeof page.date !== 'string' ||
+    page.date.length !== 10 ||
+    !/^\d{4}-\d{2}-\d{2}$/.test(page.date) ||
+    typeof page.childId !== 'string' ||
+    !page.childId ||
+    !['dad', 'mom'].includes(page.authorId)
+  )
+    return false;
+  const base = basePageId(page.date, page.childId, page.authorId);
+  return (
+    page.id === base ||
+    (page.id.length === base.length + 10 &&
+      page.id.startsWith(base + '__') &&
+      /^[a-z0-9]{8}$/.test(page.id.slice(base.length + 2)))
+  );
+}
+
+export function sheetsFor(
+  pages: Page[],
+  date: string,
+  childId: string,
+  authorId: string,
+): Page[] {
+  return pages
+    .filter(
+      (page) =>
+        page.date === date &&
+        page.childId === childId &&
+        page.authorId === authorId,
+    )
+    .sort(
+      (a, b) =>
+        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
+    );
+}
diff --git a/src/lib/stroke.ts b/src/lib/stroke.ts
index eeb2602ccc92f797967bab59b66c64def8c1bafd..253c1de265e46f07018c76f5291876f44732f73c
--- a/src/lib/stroke.ts
+++ b/src/lib/stroke.ts
@@ -1,4 +1,5 @@
 import type { Page, Stroke } from '../data/types';
+import { isValidPageId } from './pageId';
 
 export function isStrokeWidth(width: unknown): width is Stroke['width'] {
   return [2, 5, 8, 14, 28].includes(width as number);
@@ -29,13 +30,11 @@
 }
 
 export function preparePage(page: Page): Page {
-  const id = page.date + '__' + page.childId + '__' + page.authorId;
-  if (!['dad', 'mom'].includes(page.authorId) || page.id !== id) {
+  if (!isValidPageId(page)) {
     throw new Error('페이지의 날짜, 아이와 작성자는 바꿀 수 없어요.');
   }
   const result = {
     ...page,
-    id,
     drawing: page.drawing.map((stroke) => {
       if (!isStrokeWidth(stroke.width)) {
         throw new Error('그림 도구의 굵기를 확인해 주세요.');
diff --git a/src/styles/app.css b/src/styles/app.css
index 04aa18bd154ce5eccb83359658fa4914663081a7..9654cc22dda57720d60b97215fc5893e5d6113cd
--- a/src/styles/app.css
+++ b/src/styles/app.css
@@ -8,6 +8,7 @@
 }
 body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg); }
 button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
+input, textarea, select { color: inherit; }
 .artifact-welcome { min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; padding: calc(24px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-inset-bottom)); background: var(--bg); }
 .artifact-welcome h2 { font-size: 22px; }
 .artifact-picker { display: flex; gap: 16px; width: 100%; max-width: 320px; }
@@ -187,10 +188,6 @@
 .action-sheet button:last-child { border-bottom: 0; color: var(--sub); }
 .action-sheet .danger { color: var(--kid1); }
 
-.notes { max-width: 1240px; margin: 40px auto 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
-.note { background: var(--card); border-radius: var(--r-card); padding: 18px; box-shadow: var(--shadow); font-size: 14px; }
-.note h4 { font-size: 15px; margin-bottom: 6px; }
-.note ul { padding-left: 18px; color: var(--sub); }
 .swatches { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
 .sw { width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--line); }
 
diff --git a/src/styles/page.css b/src/styles/page.css
index f30f5abb2d2e20133f2b3b3bf2a7d5b4d5f421a7..2ffdbe722bf73e4276370ba567b709820c2030ca
--- a/src/styles/page.css
+++ b/src/styles/page.css
@@ -227,11 +227,18 @@
   min-height: 176px;
 }
 
-.notes {
+.diary .notes {
+  display: block;
+  margin: 0;
   min-height: 140px;
 }
 
-.note {
+.diary .note {
+  background: none;
+  box-shadow: none;
+  border-radius: 0;
+  padding: 0;
+  font-size: 20px;
   margin-bottom: 14px;
   line-height: 35px;
   white-space: pre-wrap;
@@ -240,7 +247,7 @@
 
 .initial {
   margin-left: 7px;
-  opacity: 0.5;
+  opacity: 0.7;
   font-size: 13px;
 }
 
@@ -545,6 +552,23 @@
   gap: 8px;
   word-break: keep-all;
 }
+.diary .page-sheets {
+  display: flex;
+  justify-content: center;
+  flex: none;
+  height: 44px;
+  overflow-x: auto;
+  color: var(--page-ink);
+}
+.page-sheets button {
+  flex: 0 0 44px;
+  opacity: 0.7;
+}
+.page-sheets button[aria-pressed='true'] {
+  opacity: 1;
+  text-decoration: underline;
+  text-underline-offset: 4px;
+}
 .parent-pages button {
   min-height: 44px;
   padding: 2px 5px;
diff --git a/src/styles/tokens.css b/src/styles/tokens.css
index ef78879c69b0ec08ac3018f3aa658a2b2b9b7347..8524e9344622284da57edbccc696862aca9c36e8
--- a/src/styles/tokens.css
+++ b/src/styles/tokens.css
@@ -1,6 +1,7 @@
 
 /* ===== Design tokens ===== */
 :root {
+  color-scheme: light;
   --bg: #F6F5F2;
   --card: #FFFFFF;
   --surface: #FFFFFF;
@@ -35,6 +36,7 @@
 }
 @media (prefers-color-scheme: dark) {
   :root:not([data-theme="light"]) {
+    color-scheme: dark;
     --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
     --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
     --dad: #8AA6E3; --mom: #E39BB3;
@@ -47,6 +49,7 @@
   }
 }
 :root[data-theme="dark"] {
+  color-scheme: dark;
   --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
   --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
   --dad: #8AA6E3; --mom: #E39BB3;
diff --git a/supabase/migrations/20261102000000_multi_page_sheets.sql b/supabase/migrations/20261102000000_multi_page_sheets.sql
new file mode 100644
index 0000000000000000000000000000000000000000..fedcc73ae4d3a6fbfb7bbbd028c889418b3471a2
--- /dev/null
+++ b/supabase/migrations/20261102000000_multi_page_sheets.sql
@@ -0,0 +1,35 @@
+begin;
+
+do $$
+declare
+  id_check text;
+  matches integer;
+begin
+  -- Locate the original unnamed ID check by its definition, not its generated name.
+  select count(*), min(conname::text)
+    into matches, id_check
+  from pg_constraint
+  where conrelid = 'public.pages'::regclass
+    and contype = 'c'
+    and regexp_replace(pg_get_constraintdef(oid), '[[:space:]()]', '', 'g') =
+      'CHECKid=date::text||''__''::text||child_id||''__''::text||author_id';
+
+  if matches <> 1 then
+    raise exception 'Expected exactly one original pages ID check, found %', matches;
+  end if;
+  execute format('alter table public.pages drop constraint %I', id_check);
+end $$;
+
+alter table public.pages add constraint pages_sheet_id_check check (
+  id = date::text || '__' || child_id || '__' || author_id
+  or (
+    length(id) = length(date::text || '__' || child_id || '__' || author_id) + 10
+    and
+    left(id, length(date::text || '__' || child_id || '__' || author_id) + 2) =
+      date::text || '__' || child_id || '__' || author_id || '__'
+    and substring(id from length(date::text || '__' || child_id || '__' || author_id) + 3)
+      ~ '^[a-z0-9]{8}$'
+  )
+);
+
+commit;

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-Content -Encoding UTF8 src/lib/pageId.test.ts,src/lib/exportFormat.test.ts,src/features/page/WritingArea.test.ts; Get-Content -Encoding UTF8 src/features/settings/bookLayout.ts; Get-ChildItem . -Force -Name | Select-String -Pattern 'prettier|editorconfig'; Get-Command psql -ErrorAction SilentlyContinue | Select-Object Source" in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
 exited 1 in 1577ms:
import { describe, expect, it } from 'vitest';
import { basePageId, isValidPageId, newSheetId, sheetsFor } from './pageId';
import { preparePage } from './stroke';
import type { Page } from '../data/types';

const page: Page = {
  id: '2026-11-02__kid1__dad',
  date: '2026-11-02',
  childId: 'kid1',
  authorId: 'dad',
  text: '첫 장',
  drawing: [],
  photos: [],
  tagIds: [],
  createdAt: '2026-11-02T00:00:00Z',
  updatedAt: '2026-11-02T00:00:00Z',
};

describe('page IDs and sheet order', () => {
  it('keeps first IDs and generates independent eight-character sheet suffixes', () => {
    expect(basePageId(page.date, page.childId, page.authorId)).toBe(page.id);
    const ids = new Set(
      Array.from({ length: 100 }, () =>
        newSheetId(page.date, page.childId, page.authorId),
      ),
    );
    expect(ids.size).toBe(100);
    for (const id of ids) {
      expect(id).toMatch(/^2026-11-02__kid1__dad__[a-z0-9]{8}$/);
      expect(isValidPageId({ ...page, id })).toBe(true);
      expect(preparePage({ ...page, id }).id).toBe(id);
    }
    expect(isValidPageId(page)).toBe(true);
  });

  it.each([
    '__abc1234',
    '__abc123456',
    '__ABC12345',
    '__abc_1234',
    '__abc-1234',
    '__abc12345__extra',
    '__abc12345\n',
    '__',
  ])('rejects malformed suffix %j', (suffix) => {
    const invalid = { ...page, id: page.id + suffix };
    expect(isValidPageId(invalid)).toBe(false);
    expect(() => preparePage(invalid)).toThrow();
  });

  it('rejects IDs mismatching any identity field', () => {
    expect(isValidPageId({ ...page, date: '2026-11-03' })).toBe(false);
    expect(isValidPageId({ ...page, childId: 'kid2' })).toBe(false);
    expect(isValidPageId({ ...page, authorId: 'mom' })).toBe(false);
    expect(isValidPageId({ ...page, childId: '' })).toBe(false);
  });

  it('filters the exact day, child and parent and sorts by creation then ID without mutation', () => {
    const second = { ...page, id: page.id + '__zzzzzzzz', createdAt: '2026-11-02T01:00:00Z' };
    const third = { ...second, id: page.id + '__aaaaaaaa', createdAt: '2026-11-02T02:00:00Z' };
    const tied = { ...third, id: page.id + '__bbbbbbbb' };
    const pages = [
      tied,
      third,
      second,
      { ...page, updatedAt: '2026-11-03T00:00:00Z' },
      { ...page, date: '2026-11-01' },
      { ...page, childId: 'kid2' },
      { ...page, authorId: 'mom' as const },
    ];
    const before = structuredClone(pages);
    expect(sheetsFor(pages, page.date, page.childId, page.authorId).map((p) => p.id)).toEqual([
      page.id, second.id, third.id, tied.id,
    ]);
    expect(pages).toEqual(before);
  });
});
import { describe, expect, it } from 'vitest';
import { fromBackupJson, toBackupJson, toMarkdown, toDatedArchive } from './exportFormat';
import { migrateSnapshot, type LegacySnapshot } from '../data/migrate';
import { seedChildren, seedMembers, seedTags } from '../data/seed';

const old: LegacySnapshot = {
  children: seedChildren,
  members: seedMembers,
  tags: seedTags,
  entries: [
    {
      id: 'entry1',
      childId: 'kid1',
      date: '2026-10-26',
      content: '첫 걸음',
      tagIds: ['first'],
      authorId: 'dad',
      createdAt: '2026-10-26T00:00:00Z',
      updatedAt: '2026-10-26T00:00:00Z',
    },
  ],
  comments: [
    {
      id: 'comment1',
      entryId: 'entry1',
      content: '멋지다',
      authorId: 'dad',
      createdAt: '2026-10-26T00:00:00Z',
      updatedAt: '2026-10-26T00:00:00Z',
    },
  ],
  reactions: [{ entryId: 'entry1', memberId: 'dad', emoji: '❤️' }],
};
const all = migrateSnapshot(old);
all.pages[0].drawing = [{ color: '#000', width: 2, points: [0, 0, 1, 1] }];
all.pages[0].photos = [
  { id: 'photo', src: '/photo.jpg', x: 0, y: 0, w: 1, rotation: 0 },
];

describe('page exports', () => {
  it('round-trips all same-day sheets with their own media, comments and reactions', () => {
    const second = {
      ...all.pages[0],
      id: all.pages[0].id + '__abc12345',
      text: '두 번째 장',
      createdAt: '2026-10-26T01:00:00Z',
    };
    const data = {
      ...all,
      pages: [second, all.pages[0]],
      comments: [...all.comments, { ...all.comments[0], id: 'second-comment', pageId: second.id }],
      reactions: [...all.reactions, { ...all.reactions[0], pageId: second.id }],
    };
    expect(fromBackupJson(toBackupJson(data))).toEqual(data);
    expect(migrateSnapshot(data)).toEqual(data);
    const files = toDatedArchive(data);
    const json = files.filter((file) => file.path.endsWith('.json'));
    expect(new Set(files.map((file) => file.path)).size).toBe(files.length);
    expect(json.map((file) => JSON.parse(file.content))).toEqual([all.pages[0], second]);
    const markdown = files.find((file) => file.path.endsWith('.md'))!.content;
    expect(markdown.indexOf('첫 걸음')).toBeLessThan(markdown.indexOf('두 번째 장'));
  });
  it.each([
    '2026-10-26__kid1__mom',
    '2026-10-27__kid1__dad',
    '2026-10-26__kid2__dad',
    '2026-10-26__kid1__dad__1234567',
    '2026-10-26__kid1__dad__123456789',
    '2026-10-26__kid1__dad__ABC12345',
    '2026-10-26__kid1__dad__abc12345__extra',
  ])('rejects malformed or mismatched v3 sheet ID %s', (id) => {
    expect(() => fromBackupJson({
      ...toBackupJson(all), pages: [{ ...all.pages[0], id }],
    })).toThrow();
  });
  it('round-trips v3 including drawings, photos and activity', () => {
    const backup = toBackupJson(all);
    expect(backup.version).toBe(3);
    expect(backup).not.toHaveProperty('entries');
    expect(fromBackupJson(JSON.parse(JSON.stringify(backup)))).toEqual(all);
  });
  it('converts a v1 backup to pages and rekeys activity', () => {
    const imported = fromBackupJson({ ...old, version: 1 });
    expect(imported.pages[0]).toMatchObject({
      text: '첫 걸음',
      authorId: 'dad',
    });
    expect(imported.comments[0].pageId).toBe('2026-10-26__kid1__dad');
    expect(imported.reactions[0].pageId).toBe('2026-10-26__kid1__dad');
  });
  it('writes Korean page headings, notes, badges and media counts', () => {
    const markdown = toMarkdown(all, '2026-10');
    expect(markdown).toContain('## 10월 26일 (월) · 조비안');
    expect(markdown).toContain('- 첫 걸음 — 아빠');
    expect(markdown).toContain('배지: 🌟처음');
    expect(markdown).toContain('(그림 있음, 사진 1장)');
    expect(markdown).toContain('💬 멋지다 — 아빠');
    expect(markdown).toContain('❤️ 아빠');
    expect(toMarkdown(all, '2026-11')).toBe('');
  });
  it('rejects unsupported or malformed backups', () => {
    expect(() => fromBackupJson({ ...old, version: 7 })).toThrow();
    expect(() =>
      fromBackupJson({ ...toBackupJson(all), pages: [{}] }),
    ).toThrow();
  });
});
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import type { Note } from '../../data/types';
import { WritingArea } from './WritingArea';

const note: Note = {
  id: 'sheet',
  authorId: 'mom',
  text: '',
  createdAt: '2026-11-02T00:00:00Z',
  updatedAt: '2026-11-02T00:00:00Z',
};

it.each(['', ' \n '])('omits blank read-only paragraphs: %j', (text) => {
  const html = renderToStaticMarkup(createElement(WritingArea, {
    name: '조이', notes: [{ ...note, text }], editing: false,
    writer: 'dad', onText: () => undefined,
  }));
  expect(html).not.toContain('<p');
  expect(html).not.toContain('class="initial"');
});

it('renders saved writing with the author initial and keeps an empty own editor available', () => {
  const html = renderToStaticMarkup(createElement(WritingArea, {
    name: '조이', notes: [{ ...note, text: '오늘도 사랑해' }], editing: false,
    writer: 'dad', onText: () => undefined,
  }));
  expect(html).toContain('class="note mom-writing"');
  expect(html).toContain('오늘도 사랑해');
  expect(html).toContain('class="initial">엄</span>');
  const editor = renderToStaticMarkup(createElement(WritingArea, {
    name: '조이', notes: [{ ...note, authorId: 'dad' }], editing: true,
    writer: 'dad', onText: () => undefined,
  }));
  expect(editor).toContain('<textarea');
  expect(editor).not.toContain('<p');
});
import type { Page } from '../../data/types';

export const mmToPx = (mm: number, dpi = 300) => Math.round((mm / 25.4) * dpi);
export const BOOK = { width: mmToPx(148), height: mmToPx(210) };

export function bookFilename(
  date: string,
  child: string,
  author: string,
  sheetNumber = 1,
): string {
  const safe = (value: string) =>
    value.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '') ||
    '이름없음';
  return `${date}_${safe(child)}_${safe(author)}${sheetNumber > 1 ? `__장${sheetNumber}` : ''}.png`;
}

export function wrapText(
  context: Pick<CanvasRenderingContext2D, 'measureText'>,
  text: string,
  width: number,
): string[] {
  return text.split('\n').flatMap((paragraph) => {
    const lines: string[] = [];
    let line = '';
    for (const char of paragraph) {
      if (line && context.measureText(line + char).width > width) {
        lines.push(line);
        line = '';
      }
      line += char;
    }
    lines.push(line);
    return lines;
  });
}

export function fitTextPages(
  lines: string[],
  baseSize: number,
  maxHeight: number,
): { size: number; pages: string[][] } {
  let size = baseSize;
  while (size > baseSize * 0.8 && lines.length * size * 1.35 > maxHeight) {
    size -= 1;
  }
  const linesPerPage = Math.max(1, Math.floor(maxHeight / (size * 1.35)));
  const pages: string[][] = [];
  for (let index = 0; index < lines.length; index += linesPerPage) {
    pages.push(lines.slice(index, index + linesPerPage));
  }
  return { size, pages: pages.length ? pages : [[]] };
}
export function compareBookSheets(a: Page, b: Page): number {
  return (
    a.date.localeCompare(b.date) ||
    a.childId.localeCompare(b.childId) ||
    a.authorId.localeCompare(b.authorId) ||
    a.createdAt.localeCompare(b.createdAt) ||
    a.id.localeCompare(b.id)
  );
}


apply patch
patch: completed
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\artifactStore.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\localStore.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\data\supabaseStore.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\page\WritingArea.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\settings\bookLayout.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\exportFormat.test.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\lib\pageId.test.ts
diff --git a/AGENTS.md b/AGENTS.md
index 2470892e8da4ca7a1b74219bd99858cdefc1b51c..178fcc2726f0fbdce6531acbd9ff47250f9181a4
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -22,7 +22,7 @@
 ## Design specs (user approved)
 1. **Home** = `docs/design/home-c1-moon.html` (night style 달) and `docs/design/home-c3-lantern.html` (night style 풍등); the user picks the night style on Home (default 달). Day (light theme): select 노을 언덕 (default, `docs/design/home-day-sunset.html`) or 민들레 (`docs/design/home-day-dandelion.html`) on Home. Sunset suns have 30 ridge wildflowers (bloom/bud), with periodic bird flocks; dandelion heads have 30 seeds (fluffy/faint), with drifting background seeds and soft meadow grass. Stems end above navigation. Night (dark theme): starfield with twinkle + shooting stars, faces as moons with a 30-star crown, or as sky-lanterns with 30 beads. The 30 marks = the last 30 days; a day counts as written if EITHER parent saved a page for that child. No names on the home; accessible labels carry name + summary. Long-press a face → "최근 30일 중 N일 기록". All four styles wander smoothly across the whole safe scene below the date and above navigation (12?20 px/s on mobile, faster on desktop), with gentle tilt/bob, soft face separation, and steering away from the scene switcher. One shared animation clock pauses when hidden. Dandelion stems stretch/bend from fixed ground roots; sunset suns float freely while their 30 flowers slide horizontally along the hill below. After long-press, moving over 6px picks up the face and its marks; release flings it within safe scene bounds above navigation, with friction and edge/circle bounces; wandering resumes where the fling settles without springing home. A fling never opens a page. Reduced motion is static and drag returns directly home. Lanterns must not overlap each other's bead strings. Scene selection lives in one artwork object placed naturally per scene, with face steering avoiding its own area: sunset has a small 30px orange-rose setting sun half-occluded by the actual far ridge toward the right (6s breathing halo, faint rim shimmer, 14s gentle sinking); dandelion keeps the ladybug on its drifting seed; moon has a quiet warm-white thin four-point glint only slightly larger than background stars (4.5s subtle twinkle, soft flare every 12s); lantern has a small dim distant lantern (8s rise/sway plus flicker). Object motion shares the paused-when-hidden scene clock; all objects are static with reduced motion. Each is an accessible button named 장면 바꾸기 with an invisible ≥44px hit area and keyboard-only focus ring, behind faces and never a collision body. First three device-local Home visits shimmer once after 1.5s (no reduced-motion animation). A frosted strip groups four SVG scene thumbnails under 낮/밤; choosing persists the corresponding HomePreferences style and explicit light/dark theme, crossfades for 400ms (instant with reduced motion), and closes. Outside tap, Esc and back also close it. 설정 › 화면 keeps only 시스템/라이트/다크 and the hint 홈의 작은 집·무당벌레·별·풍등을 누르면 장면을 바꿀 수 있어요.
 2. **App shell** (archive list, calendar, settings, sheets): `docs/design/mockup-v3.html` — Pretendard, clean cards, dark filled pills/buttons, soft navy-violet dark mode. Intuitive = on every screen the thing to choose and the most important info are obvious at a glance.
-3. **Diary page** (one sheet for one child, one day, one parent): full-bleed page color, Gaegu handwriting, hand-drawn ink. NO visible borders/frames between the drawing and writing areas; the drawing area spans the full screen width edge to edge. ONLY: top bar (← back, date with ‹ ›, ONE badge icon), a small "엄마의 페이지 · 아빠의 페이지" switch (swipe or tap), a quiet fixed-height sheet-number row with ? for another saved own page, drawing, writing, bottom (💬 comments, big oval 저장/수정).
+3. **Diary page** (one sheet for one child, one day, one parent): full-bleed page color, Gaegu handwriting, hand-drawn ink. NO visible borders/frames between the drawing and writing areas; the drawing area spans the full screen width edge to edge. ONLY: top bar (← back, date with ‹ ›, ONE badge icon), a small "엄마의 페이지 · 아빠의 페이지" switch (swipe or tap), a quiet fixed-height sheet-number row with ＋ to add a sheet when the current own sheet is saved, drawing, writing, bottom (💬 comments, big oval 저장/수정).
 - Flow: Home → tap a face → that child's page for today, opened on the current writer's own page → 저장 → back to Home with toast "저장했어요". Reaching Home's archive/calendar/settings: small, quiet icons at the bottom of Home (not competing with the faces).
 - **Current writer**: use store.getCurrentMemberId() (first-visit full-screen picker / settings). No per-page writer choice. The current writer's paragraph is editable, with a small author initial beside each paragraph. Save requires text, drawing, or photo.
 - Page palette: shared ColorPicker with 3 recommended colors (벚꽃 #F4B9B8, 박하 #CDEFE2, 귤 #F59157), up to 5 viewer-local recent colors, and a frozen 40-swatch pastel grid (10 rainbow hue families × 4 tones), including all 16 legacy named colors. Normalize old colors to the nearest grid color on load. Pen colors are separate: auto ink plus 8 deeper crayons, stored per Stroke.color; `ink` means auto ink. Display colors mix 90% page color + 10% #262638 in dark mode. Auto ink chooses #1E2326 or #F5F0E1 by highest WCAG contrast against the displayed color.
diff --git a/scripts/backup/backup.check.mjs b/scripts/backup/backup.check.mjs
index 93c14b559fda0e5000ca229445592daf9bffb72c..31e898950ea6096e2c6fd0b3db73dfbfb47a64db
--- a/scripts/backup/backup.check.mjs
+++ b/scripts/backup/backup.check.mjs
@@ -19,6 +19,34 @@
   new URL('./fixtures/two-parents.json', import.meta.url),
 );
 
+test('dated archives preserve multiple sheets for one parent in creation order', async () => {
+  const snapshot = JSON.parse(await readFile(fixture, 'utf8'));
+  const first = snapshot.pages.find((page) => page.authorId === 'dad');
+  const second = {
+    ...first,
+    id: first.id + '__zzzzzzzz',
+    text: '두 번째 장',
+    createdAt: '2026-10-26T20:00:00Z',
+  };
+  const third = {
+    ...second,
+    id: first.id + '__aaaaaaaa',
+    text: '세 번째 장',
+    createdAt: '2026-10-26T21:00:00Z',
+  };
+  snapshot.pages = [third, second, ...snapshot.pages];
+  const files = toDatedArchive(snapshot);
+  assert.equal(new Set(files.map((file) => file.path)).size, files.length);
+  assert.deepEqual(
+    files.filter((file) => file.path.endsWith('.json'))
+      .map((file) => JSON.parse(file.content).id),
+    [first.id, second.id, third.id, snapshot.pages.find((page) => page.authorId === 'mom').id],
+  );
+  const markdown = files.find((file) => file.path.endsWith('.md')).content;
+  assert.ok(markdown.indexOf('아빠 기록') < markdown.indexOf('두 번째 장'));
+  assert.ok(markdown.indexOf('두 번째 장') < markdown.indexOf('세 번째 장'));
+});
+
 test('dated backup dry-run and incremental writes preserve old files and both parents', async () => {
   const directory = await mkdtemp(path.join(tmpdir(), 'diary-backup-'));
   const run = (...args) =>
diff --git a/src/App.tsx b/src/App.tsx
index 83254dd1abb764b1b15ec1e793e502bca0d244f2..da02bb99e70fa155611d5ff74b048a8abfbaa1da
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -21,6 +21,7 @@
       date: string;
       childId: string;
       authorId?: 'dad' | 'mom';
+      pageId?: string;
       editing: boolean;
       origin?: PageOrigin;
     };
@@ -54,12 +55,14 @@
     nextDate: string,
     childId: string,
     authorId?: 'dad' | 'mom',
+    pageId?: string,
   ) =>
     setScreen({
       kind: 'page',
       date: nextDate,
       childId,
       authorId,
+      pageId,
       ...source.current,
     });
   const goHome = () => setScreen({ kind: 'shell', tab: '홈' });
@@ -71,17 +74,19 @@
       <>
         <SyncBanner store={store} />
         <PageScreen
-          key={`${screen.date}__${screen.childId}__${screen.authorId ?? store.getCurrentMemberId()}`}
+          key={`${screen.date}__${screen.childId}__${screen.authorId ?? store.getCurrentMemberId()}__${screen.pageId ?? ''}`}
           store={store}
           snapshot={snapshot}
           child={child}
           date={screen.date}
           authorId={screen.authorId}
-          onAuthor={(authorId) => setScreen({ ...screen, authorId })}
+          pageId={screen.pageId}
+          onSheet={(pageId) => setScreen({ ...screen, pageId })}
+          onAuthor={(authorId) => setScreen({ ...screen, authorId, pageId: undefined })}
           startEditing={screen.editing}
           origin={screen.origin}
           onBack={goHome}
-          onDate={(nextDate) => setScreen({ ...screen, date: nextDate })}
+          onDate={(nextDate) => setScreen({ ...screen, date: nextDate, pageId: undefined })}
           onSaved={() => {
             setDate(screen.date);
             setSavedToast(true);
diff --git a/src/data/DataStore.ts b/src/data/DataStore.ts
index f971f02a5dfebfb3d80078f7b9969496a9c389f5..7a060f742f390c8bc42505056d4e66e94fd40b12
--- a/src/data/DataStore.ts
+++ b/src/data/DataStore.ts
@@ -26,6 +26,7 @@
   listMembers(): Member[];
   listTags(): Tag[];
   listPages(range?: PageRange): Page[];
+  getPageById(id: string): Page | undefined;
   getPage(
     date: string,
     childId: string,
diff --git a/src/data/artifactStore.test.ts b/src/data/artifactStore.test.ts
index b5713064c8ceb7becb8c1189d59f0918d23a179e..fd8d32d9fa2e5205bb63b6c04c6cb1c337ec4a40
--- a/src/data/artifactStore.test.ts
+++ b/src/data/artifactStore.test.ts
@@ -4,6 +4,45 @@
 import * as images from '../lib/image';
 
 afterEach(() => vi.restoreAllMocks());
+it('preserves and lazily reloads both same-day sheets and checks every body before export', async () => {
+  const db = new FakeDb();
+  const first = page('2020-01-01');
+  const second = {
+    ...first,
+    id: first.id + '__abc12345',
+    text: '두 번째 장',
+    createdAt: '2026-10-26T04:00:00Z',
+  };
+  const store = new ArtifactStore(db, 'viewer');
+  store.savePage(first);
+  store.savePage(second);
+  await settle();
+  store.dispose();
+  const loaded = new ArtifactStore(db, 'viewer');
+  expect(loaded.getPageById(first.id)).toBeUndefined();
+  expect(loaded.getPageById(second.id)).toBeUndefined();
+  expect(await loaded.loadPage(second.id)).toEqual(second);
+  expect(() => loaded.exportAll()).toThrow();
+  expect(await loaded.loadPage(first.id)).toEqual(first);
+  expect(loaded.exportAll().pages).toHaveLength(2);
+  loaded.savePage({
+    ...first,
+    text: '첫 장 수정',
+    updatedAt: '2026-10-26T05:00:00Z',
+  });
+  await settle();
+  expect(loaded.getPage(first.date, first.childId, first.authorId)?.id).toBe(
+    second.id,
+  );
+  expect(loaded.getPageById(second.id)?.text).toBe(second.text);
+  expect(db.bodies.get('index/2020-01')).toMatchObject({
+    pages: {
+      [first.id]: { createdAt: first.createdAt },
+      [second.id]: { createdAt: second.createdAt },
+    },
+  });
+  loaded.dispose();
+});
 it('writes one full body per page and small index summaries with no media bytes', async () => {
   const db = new FakeDb();
   const store = new ArtifactStore(db, 'viewer');
diff --git a/src/data/artifactStore.ts b/src/data/artifactStore.ts
index 12bc4bc34c5b1a126e4edb9ed437b89b8e321250..288f80d517b66fd732498258555e49d5b515e2c2
--- a/src/data/artifactStore.ts
+++ b/src/data/artifactStore.ts
@@ -1,5 +1,6 @@
 import { normalizePageColor } from '../lib/pageColors';
 import { todayKey } from '../lib/date';
+import { sheetsFor } from '../lib/pageId';
 import { LegacyAdapter } from './legacyAdapter';
 import { migrateMonthSnapshot, defaultChildStatus, defaultPageColor } from './migrate';
 import { preparePage } from '../lib/stroke';
@@ -55,6 +56,7 @@
     tagIds: page.tagIds,
     hasDrawing: page.drawing.length > 0,
     photoCount: page.photos.length,
+    createdAt: page.createdAt,
     updatedAt: page.updatedAt,
     deletedAt: null,
   };
@@ -100,7 +102,7 @@
             tagIds: summary.tagIds,
             drawing: [],
             photos: [],
-            createdAt: summary.updatedAt,
+            createdAt: summary.createdAt ?? summary.updatedAt,
             updatedAt: summary.updatedAt,
           },
     ),
@@ -536,14 +538,19 @@
     childId: string,
     authorId = this.getCurrentMemberId() || 'dad',
   ): Page | undefined {
-    const id = date + '__' + childId + '__' + authorId;
+    const page = sheetsFor(this.snapshot.pages, date, childId, authorId).slice(
+      -1,
+    )[0];
+    return page ? this.getPageById(page.id) : undefined;
+  }
+  getPageById(id: string): Page | undefined {
     if (
       this.cache.has(id) ||
       this.pending.some((write) => write.path === 'pages/' + id)
     ) {
       return this.snapshot.pages.find((page) => page.id === id);
     }
-    if (!this.months[date.slice(0, 7)]?.pages[id])
+    if (!this.months[id.slice(0, 7)]?.pages[id])
       return this.snapshot.pages.find((page) => page.id === id);
     return undefined;
   }
@@ -756,7 +763,7 @@
   exportAll(): StoreSnapshot {
     if (
       this.snapshot.pages.some(
-        (page) => !this.getPage(page.date, page.childId, page.authorId),
+        (page) => !this.getPageById(page.id),
       )
     )
       throw new Error('페이지를 불러온 뒤 백업해 주세요.');
diff --git a/src/data/legacyAdapter.ts b/src/data/legacyAdapter.ts
index 4d7ce7f39a0ad9354ba0eeffdc3ef38daa6b4fb9..2709be0fd351ca154fa2f3dee184eeaac556332b
--- a/src/data/legacyAdapter.ts
+++ b/src/data/legacyAdapter.ts
@@ -1,6 +1,7 @@
 import type { DataStore } from './DataStore';
 import type { Child, Page, StoreSnapshot } from './types';
 import { noteAuthor } from './migrate';
+import { basePageId, isValidPageId } from '../lib/pageId';
 
 export type LegacyEntry = {
   id: string;
@@ -34,6 +35,9 @@
   abstract updateChild(child: Child): void;
   abstract uploadPhoto(blob: Blob): Promise<{ src: string }>;
   protected async removePhotoAsset(_src: string): Promise<void> {}
+  getPageById(id: string): Page | undefined {
+    return this.getSnapshot().pages.find((page) => page.id === id);
+  }
   async loadPage(id: string): Promise<Page> {
     const page = this.getSnapshot().pages.find((item) => item.id === id);
     if (!page) throw new Error('페이지를 찾을 수 없어요.');
@@ -111,7 +115,9 @@
   updateEntry(entry: LegacyEntry): void {
     const data = this.getSnapshot();
     const authorId = noteAuthor(entry.authorId, data.members);
-    const id = entry.date + '__' + entry.childId + '__' + authorId;
+    const id = isValidPageId({ ...entry, authorId })
+      ? entry.id
+      : basePageId(entry.date, entry.childId, authorId);
     const page = data.pages.find((item) => item.id === id);
     this.savePage({
       ...page,
diff --git a/src/data/localStore.test.ts b/src/data/localStore.test.ts
index ff7912a470d2cc65be0d5a6ae6970cd167c23a28..ba7ac30e4f65b5e2dd70f668d8d45ea0e4d77526
--- a/src/data/localStore.test.ts
+++ b/src/data/localStore.test.ts
@@ -65,6 +65,35 @@
 });
 
 describe('page migration and local persistence', () => {
+  it('saves, reloads and independently updates additional same-day sheets', async () => {
+    const store = new LocalStore();
+    const first = migrateSnapshot(legacy()).pages[0];
+    const second = {
+      ...first,
+      id: first.id + '__abc12345',
+      text: '두 번째 장',
+      createdAt: '2026-10-26T05:00:00Z',
+    };
+    store.savePage(first);
+    store.savePage(second);
+    const loaded = new LocalStore();
+    expect(await loaded.loadPage(first.id)).toEqual(first);
+    expect(await loaded.loadPage(second.id)).toEqual(second);
+    loaded.savePage({ ...second, text: '두 번째 장 수정' });
+    expect(new LocalStore().getPageById(first.id)).toEqual(first);
+    expect(new LocalStore().getPageById(second.id)?.text).toBe(
+      '두 번째 장 수정',
+    );
+    expect(loaded.getPage(first.date, first.childId, first.authorId)?.id).toBe(
+      second.id,
+    );
+    loaded.updateEntry({
+      ...second,
+      content: '호환 경로 수정',
+    });
+    expect(loaded.getPageById(second.id)?.text).toBe('호환 경로 수정');
+    expect(loaded.getPageById(first.id)).toEqual(first);
+  });
   it('normalizes stored page and default child colors on load', () => {
     const data = migrateSnapshot(legacy());
     data.pages[0].color = '#0F4D3A';
diff --git a/src/data/localStore.ts b/src/data/localStore.ts
index 12680619118dcfaea6acc91957a09ed6514c27ba..eb37c8d5740b98661822f2666c16c3dbc28a1cf4
--- a/src/data/localStore.ts
+++ b/src/data/localStore.ts
@@ -3,6 +3,7 @@
 import { LegacyAdapter } from './legacyAdapter';
 import { defaultChildStatus, migrateSnapshot, type LegacySnapshot } from './migrate';
 import { preparePage } from '../lib/stroke';
+import { sheetsFor } from '../lib/pageId';
 import { downscalePhoto, blobToDataUrl } from '../lib/image';
 import type { DataStore } from './DataStore';
 import { seedChildren, seedMembers, seedTags } from './seed';
@@ -164,9 +165,7 @@
     childId: string,
     authorId = this.getCurrentMemberId() || 'dad',
   ): Page | undefined {
-    return this.snapshot.pages.find(
-      (page) => page.id === date + '__' + childId + '__' + authorId,
-    );
+    return sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
   }
 
   savePage(page: Page): void {
diff --git a/src/data/migrate.ts b/src/data/migrate.ts
index 85c598394abec3735d904cf7234107ba2124cdd8..f9fcd44cb1693aac5585d753846bf5b007d7f001
--- a/src/data/migrate.ts
+++ b/src/data/migrate.ts
@@ -1,4 +1,5 @@
 import { normalizePageColor } from '../lib/pageColors';
+import { basePageId } from '../lib/pageId';
 import type { LegacyEntry } from './legacyAdapter';
 import type {
   Child,
@@ -164,11 +165,11 @@
         a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
     );
     const owner = notes[0]?.authorId ?? 'dad';
-    owners.set(source.id, source.date + '__' + source.childId + '__' + owner);
+    owners.set(source.id, basePageId(source.date, source.childId, owner));
     for (const authorId of [
       ...new Set([owner, ...notes.map((note) => note.authorId)]),
     ]) {
-      const id = source.date + '__' + source.childId + '__' + authorId;
+      const id = basePageId(source.date, source.childId, authorId);
       const { notes: _, ...rest } = source;
       const value: Page = {
         ...rest,
diff --git a/src/data/supabaseStore.test.ts b/src/data/supabaseStore.test.ts
index 8d3a728323a7fc1e20faa3e6f6b2e7654c02f7ef..f213eb1ee70018b4adfa23c80647b6b27818009f
--- a/src/data/supabaseStore.test.ts
+++ b/src/data/supabaseStore.test.ts
@@ -103,6 +103,35 @@
 });
 afterEach(() => { stores.forEach((store) => store.dispose()); stores = []; vi.unstubAllGlobals(); });
 describe('family SupabaseStore', () => {
+  it('persists, reloads and updates same-day sheets independently by ID', async () => {
+    const server = fakeServer();
+    const store = create(server);
+    await ready(store);
+    const second = {
+      ...page,
+      id: page.id + '__abc12345',
+      text: '두 번째 장',
+      createdAt: '2026-10-26T01:00:00Z',
+    };
+    store.savePage(page);
+    store.savePage(second);
+    vi.stubGlobal('navigator', { onLine: true });
+    store.retry();
+    await vi.waitFor(() => expect(store.getStatus().pending).toBe(0));
+    store.dispose();
+    const loaded = create(server);
+    await ready(loaded);
+    expect(await loaded.loadPage(page.id)).toEqual(page);
+    expect(await loaded.loadPage(second.id)).toEqual(second);
+    expect(loaded.getPage(page.date, page.childId, page.authorId)?.id).toBe(
+      second.id,
+    );
+    loaded.savePage({ ...second, text: '두 번째 장 수정' });
+    await vi.waitFor(() => expect(loaded.getStatus().pending).toBe(0));
+    expect(server.rows.pages).toHaveLength(2);
+    expect(loaded.getPageById(page.id)).toEqual(page);
+    expect(loaded.getPageById(second.id)?.text).toBe('두 번째 장 수정');
+  });
   it('queues only the current member font and sends its storage path, including reset', async () => {
     const server = fakeServer();
     const store = create(server);
diff --git a/src/data/supabaseStore.ts b/src/data/supabaseStore.ts
index 8e7946188600aa4ea4e61091c345cefb1e259a94..3f1a707e942ff04b9d521a686e47a5a06e68ee06
--- a/src/data/supabaseStore.ts
+++ b/src/data/supabaseStore.ts
@@ -3,6 +3,7 @@
 import { externalizeSnapshot, hasInlinePhotos } from './importPhotos';
 import { LegacyAdapter } from './legacyAdapter';
 import { preparePage } from '../lib/stroke';
+import { sheetsFor } from '../lib/pageId';
 import { downscalePhoto } from '../lib/image';
 import { enterFamily, loadMembership, makeInvite, inviteRequired, inviteFailure, type FamilyMembership } from './familyAccess';
 import {
@@ -595,9 +596,7 @@
     childId: string,
     authorId = this.membership?.member_id === 'mom' ? 'mom' : 'dad',
   ): Page | undefined {
-    return this.snapshot.pages.find(
-      (page) => page.id === date + '__' + childId + '__' + authorId,
-    );
+    return sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
   }
   savePage(page: Page): void {
     if (page.photos.some((photo) => photo.src.startsWith('data:')))
diff --git a/src/data/types.ts b/src/data/types.ts
index a565623240c4c75b5494dac7f23863356708bebe..896b815d2be90a47dea69f388e141a7902d88765
--- a/src/data/types.ts
+++ b/src/data/types.ts
@@ -85,6 +85,7 @@
   Page,
   'id' | 'date' | 'childId' | 'authorId' | 'color' | 'tagIds' | 'updatedAt'
 > & {
+  createdAt?: string;
   firstLine: string;
   hasDrawing: boolean;
   photoCount: number;
diff --git a/src/features/page/PageScreen.tsx b/src/features/page/PageScreen.tsx
index ca12a5b57216a2324e49cfcc7497dac71bc0268f..8bd13c5acb580f6ccdbeae43468999303651ca8f
--- a/src/features/page/PageScreen.tsx
+++ b/src/features/page/PageScreen.tsx
@@ -13,6 +13,7 @@
 import { usePageColorStyle } from '../../lib/usePageColorStyle';
 import { noteAuthor } from '../../data/migrate';
 import { preparePage } from '../../lib/stroke';
+import { basePageId, newSheetId, sheetsFor } from '../../lib/pageId';
 import { BadgeSheet } from './BadgeSheet';
 import { CommentsSheet } from './CommentsSheet';
 import { DiarySheet } from './DiarySheet';
@@ -33,6 +34,8 @@
   child,
   date,
   authorId,
+  pageId,
+  onSheet,
   onAuthor,
   startEditing,
   origin,
@@ -45,6 +48,8 @@
   child: Child;
   date: string;
   authorId?: 'dad' | 'mom';
+  pageId?: string;
+  onSheet: (pageId: string) => void;
   onAuthor: (authorId: 'dad' | 'mom') => void;
   startEditing: boolean;
   origin?: PageOrigin;
@@ -53,15 +58,20 @@
   onSaved: (pageId: string) => void;
 }) {
   const [initial] = useState(() => {
-    const saved = store.getPage(date, child.id, authorId);
+    const author =
+      authorId ??
+      noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members);
+    const id =
+      pageId ??
+      sheetsFor(snapshot.pages, date, child.id, author).slice(-1)[0]?.id ??
+      basePageId(date, child.id, author);
+    const saved = store.getPageById(id);
     const now = new Date().toISOString();
     const blank: Page = {
-      id: `${date}__${child.id}__${authorId ?? noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members)}`,
+      id,
       childId: child.id,
       date,
-      authorId:
-        authorId ??
-        noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members),
+      authorId: author,
       drawing: [],
       photos: [],
       text: '',
@@ -71,15 +81,13 @@
     };
     return {
       saved: !!saved || snapshot.pages.some((page) => page.id === blank.id),
+      loading: !saved && snapshot.pages.some((page) => page.id === id),
       page: structuredClone(saved ?? blank),
     };
   });
   const [page, setPage] = useState(initial.page);
   const baseline = useRef(initial.page);
-  const [loading, setLoading] = useState(
-    !store.getPage(date, child.id, authorId) &&
-      snapshot.pages.some((page) => page.id === initial.page.id),
-  );
+  const [loading, setLoading] = useState(initial.loading);
   useEffect(() => {
     if (!loading) return;
     let active = true;
@@ -109,6 +117,11 @@
     ? undefined
     : noteAuthor(store.getCurrentMemberId(), snapshot.members);
   const ownPage = page.authorId === writer;
+  const savedSheets = sheetsFor(snapshot.pages, date, child.id, page.authorId);
+  const currentSaved = savedSheets.some((sheet) => sheet.id === page.id);
+  const sheets = currentSaved ? savedSheets : [...savedSheets, page];
+  const showSheetNumbers =
+    savedSheets.length >= 2 || (!currentSaved && !!pageId);
   const [drawing, setDrawing] = useState(false);
   const [sheet, setSheet] = useState<'badges' | 'palette' | 'comments'>();
   const [pending, setPending] = useState<() => void>();
@@ -298,6 +311,29 @@
             </button>
           ))}
         </div>
+        <div className="page-sheets" role="group" aria-label="이 날의 장">
+          {showSheetNumbers &&
+            sheets.map((sheet, index) => (
+              <button
+                key={sheet.id}
+                aria-label={`${index + 1}번째 장`}
+                aria-pressed={sheet.id === page.id}
+                onClick={() => navigate(() => onSheet(sheet.id))}
+              >
+                {index + 1}
+              </button>
+            ))}
+          {ownPage && !store.readOnly && currentSaved && (
+            <button
+              aria-label="한 장 더 쓰기"
+              onClick={() =>
+                navigate(() => onSheet(newSheetId(date, child.id, page.authorId)))
+              }
+            >
+              ＋
+            </button>
+          )}
+        </div>
         <DrawingArea
           page={{ ...page, color: page.color ?? child.pageColor }}
           store={store}
diff --git a/src/features/page/WritingArea.test.ts b/src/features/page/WritingArea.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..7629c239f60129b3e47aaeaa78dd5df75c13a981
--- /dev/null
+++ b/src/features/page/WritingArea.test.ts
@@ -0,0 +1,53 @@
+import { createElement } from 'react';
+import { renderToStaticMarkup } from 'react-dom/server';
+import { expect, it } from 'vitest';
+import type { Note } from '../../data/types';
+import { WritingArea } from './WritingArea';
+
+const note: Note = {
+  id: 'sheet',
+  authorId: 'mom',
+  text: '',
+  createdAt: '2026-11-02T00:00:00Z',
+  updatedAt: '2026-11-02T00:00:00Z',
+};
+
+it.each(['', ' \n '])('omits blank read-only paragraphs: %j', (text) => {
+  const html = renderToStaticMarkup(
+    createElement(WritingArea, {
+      name: '조이',
+      notes: [{ ...note, text }],
+      editing: false,
+      writer: 'dad',
+      onText: () => undefined,
+    }),
+  );
+  expect(html).not.toContain('<p');
+  expect(html).not.toContain('class="initial"');
+});
+
+it('renders saved writing with the author initial and keeps an empty own editor available', () => {
+  const html = renderToStaticMarkup(
+    createElement(WritingArea, {
+      name: '조이',
+      notes: [{ ...note, text: '오늘도 사랑해' }],
+      editing: false,
+      writer: 'dad',
+      onText: () => undefined,
+    }),
+  );
+  expect(html).toContain('class="note mom-writing"');
+  expect(html).toContain('오늘도 사랑해');
+  expect(html).toContain('class="initial">엄</span>');
+  const editor = renderToStaticMarkup(
+    createElement(WritingArea, {
+      name: '조이',
+      notes: [{ ...note, authorId: 'dad' }],
+      editing: true,
+      writer: 'dad',
+      onText: () => undefined,
+    }),
+  );
+  expect(editor).toContain('<textarea');
+  expect(editor).not.toContain('<p');
+});
diff --git a/src/features/page/WritingArea.tsx b/src/features/page/WritingArea.tsx
index ef273ae1617da347d1bc699fdc7b2e5bb8501f58..b2973236d4e292af8458feb9d94316cce8bb66ee
--- a/src/features/page/WritingArea.tsx
+++ b/src/features/page/WritingArea.tsx
@@ -15,12 +15,19 @@
   return (
     <section className="writing" aria-label={`${name}의 일기`}>
       <div className="notes">
-        {notes.filter((note) => !editing || note.id !== current?.id).map((note) => (
-          <p key={note.id} className={`note ${note.authorId}-writing`}>
-            {note.text}
-            <span className="initial">{note.authorId === 'dad' ? '아' : '엄'}</span>
-          </p>
-        ))}
+        {notes
+          .filter(
+            (note) =>
+              note.text.trim() && (!editing || note.id !== current?.id),
+          )
+          .map((note) => (
+            <p key={note.id} className={`note ${note.authorId}-writing`}>
+              {note.text}
+              <span className="initial">
+                {note.authorId === 'dad' ? '아' : '엄'}
+              </span>
+            </p>
+          ))}
         {editing && writer && (
           <div className="editable-note">
             <span className="initial">{writer === 'dad' ? '아' : '엄'}</span>
diff --git a/src/features/settings/bookExport.ts b/src/features/settings/bookExport.ts
index 18d005769dac657806ed49beb4341262f4ad212f..044dd9f237cfe1563c0d8b1b1dafef88168ef2ea
--- a/src/features/settings/bookExport.ts
+++ b/src/features/settings/bookExport.ts
@@ -1,9 +1,16 @@
 import type { DataStore } from '../../data/DataStore';
 import type { Page, StoreSnapshot } from '../../data/types';
 import { inkFor } from '../../lib/pageColors';
+import { sheetsFor } from '../../lib/pageId';
 import { downloadFile } from '../../lib/download';
 import { paintStroke } from '../page/strokes';
-import { BOOK, bookFilename, fitTextPages, wrapText } from './bookLayout';
+import {
+  BOOK,
+  bookFilename,
+  compareBookSheets,
+  fitTextPages,
+  wrapText,
+} from './bookLayout';
 import { loadPdf, loadZip } from '../../lib/loadExportLibs';
 
 export type BookOptions = {
@@ -167,7 +174,7 @@
         (!options.childId || page.childId === options.childId) &&
         (!options.authorId || page.authorId === options.authorId),
     )
-    .sort((a, b) => a.id.localeCompare(b.id));
+    .sort(compareBookSheets);
   if (!pages.length) throw new Error('선택한 기간에 기록이 없어요.');
   progress(0, pages.length);
   const fonts: FontFace[] = [];
@@ -253,6 +260,9 @@
             all.children.find((child) => child.id === page.childId)?.name ??
               page.childId,
             page.authorId === 'mom' ? '엄마' : '아빠',
+            sheetsFor(pages, page.date, page.childId, page.authorId).findIndex(
+              (sheet) => sheet.id === page.id,
+            ) + 1,
           );
           zip.file(
             pageIndex ? name.replace(/\.png$/, `_${pageIndex + 1}.png`) : name,
diff --git a/src/features/settings/bookLayout.test.ts b/src/features/settings/bookLayout.test.ts
index eb122956ac6cddebccf2fb463aac45f6ebe64562..afc7110044c3bb56e92ccd06c66c230539983672
--- a/src/features/settings/bookLayout.test.ts
+++ b/src/features/settings/bookLayout.test.ts
@@ -1,7 +1,36 @@
 import { describe, expect, it } from 'vitest';
-import { BOOK, bookFilename, fitTextPages, mmToPx, wrapText } from './bookLayout';
+import {
+  BOOK,
+  bookFilename,
+  compareBookSheets,
+  fitTextPages,
+  mmToPx,
+  wrapText,
+} from './bookLayout';
+import { page } from '../../data/testDb';
 
 describe('book layout', () => {
+  it('keeps same-day sheets in creation order and gives each image and continuation its own name', () => {
+    const first = page();
+    const second = {
+      ...first,
+      id: first.id + '__zzzzzzzz',
+      createdAt: '2026-10-26T04:00:00Z',
+    };
+    const third = {
+      ...second,
+      id: first.id + '__aaaaaaaa',
+      createdAt: '2026-10-26T05:00:00Z',
+    };
+    expect([third, second, first].sort(compareBookSheets)).toEqual([
+      first, second, third,
+    ]);
+    const names = [1, 2, 3].flatMap((number) => {
+      const name = bookFilename(first.date, '조비안', '아빠', number);
+      return [name, name.replace(/\.png$/, '_2.png')];
+    });
+    expect(new Set(names).size).toBe(6);
+  });
   it('rounds A5 millimetres to 300 dpi pixels', () => {
     expect(BOOK).toEqual({ width: 1748, height: 2480 });
     expect(mmToPx(25.4)).toBe(300);
diff --git a/src/features/settings/bookLayout.ts b/src/features/settings/bookLayout.ts
index 1d73521acbd3e3e9326c361384ced1e2b928c310..e73b8254cfd1c77e6789f97ded07ff7ea3f2eefe
--- a/src/features/settings/bookLayout.ts
+++ b/src/features/settings/bookLayout.ts
@@ -1,3 +1,5 @@
+import type { Page } from '../../data/types';
+
 export const mmToPx = (mm: number, dpi = 300) => Math.round((mm / 25.4) * dpi);
 export const BOOK = { width: mmToPx(148), height: mmToPx(210) };
 
@@ -5,11 +7,12 @@
   date: string,
   child: string,
   author: string,
+  sheetNumber = 1,
 ): string {
   const safe = (value: string) =>
     value.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '') ||
     '이름없음';
-  return `${date}_${safe(child)}_${safe(author)}.png`;
+  return `${date}_${safe(child)}_${safe(author)}${sheetNumber > 1 ? `__장${sheetNumber}` : ''}.png`;
 }
 
 export function wrapText(
@@ -48,3 +51,13 @@
   }
   return { size, pages: pages.length ? pages : [[]] };
 }
+export function compareBookSheets(a: Page, b: Page): number {
+  return (
+    a.date.localeCompare(b.date) ||
+    a.childId.localeCompare(b.childId) ||
+    a.authorId.localeCompare(b.authorId) ||
+    a.createdAt.localeCompare(b.createdAt) ||
+    a.id.localeCompare(b.id)
+  );
+}
+
diff --git a/src/lib/datedArchive.mjs b/src/lib/datedArchive.mjs
index d6dd32321d4f90ea119a30b25981521b76a25a66..ab875f0569d6ad27155cd22f6945ef97986e9eec
--- a/src/lib/datedArchive.mjs
+++ b/src/lib/datedArchive.mjs
@@ -1,10 +1,17 @@
+function comparePages(a, b) {
+  return (
+    a.date.localeCompare(b.date) ||
+    a.childId.localeCompare(b.childId) ||
+    a.authorId.localeCompare(b.authorId) ||
+    a.createdAt.localeCompare(b.createdAt) ||
+    a.id.localeCompare(b.id)
+  );
+}
+
 export function toMarkdown(all, month) {
   const pages = all.pages
     .filter((page) => !month || page.date.startsWith(month))
-    .sort(
-      (a, b) =>
-        a.date.localeCompare(b.date) || a.childId.localeCompare(b.childId),
-    );
+    .sort(comparePages);
   const children = new Map(all.children.map((child) => [child.id, child.name]));
   const members = new Map(
     all.members.map((member) => [member.id, member.displayName]),
@@ -71,7 +78,7 @@
     const directory = 'diary/' + date.split('-').join('/');
     const pages = snapshot.pages
       .filter((page) => page.date === date)
-      .sort((a, b) => a.id.localeCompare(b.id));
+      .sort(comparePages);
     for (const page of pages)
       files.push({
         path:
@@ -80,6 +87,9 @@
           encodeURIComponent(page.childId) +
           '-' +
           page.authorId +
+          (page.id === `${page.date}__${page.childId}__${page.authorId}`
+            ? ''
+            : '--' + encodeURIComponent(page.id)) +
           '.json',
         content: JSON.stringify(page, null, 2),
       });
diff --git a/src/lib/exportFormat.test.ts b/src/lib/exportFormat.test.ts
index 784cf902cd7bc3b95314a2e919091f489be90d1e..fc24d4757df55e3b8896317b1264aea2f57da815
--- a/src/lib/exportFormat.test.ts
+++ b/src/lib/exportFormat.test.ts
@@ -1,5 +1,10 @@
 import { describe, expect, it } from 'vitest';
-import { fromBackupJson, toBackupJson, toMarkdown } from './exportFormat';
+import {
+  fromBackupJson,
+  toBackupJson,
+  toMarkdown,
+  toDatedArchive,
+} from './exportFormat';
 import { migrateSnapshot, type LegacySnapshot } from '../data/migrate';
 import { seedChildren, seedMembers, seedTags } from '../data/seed';
 
@@ -38,6 +43,49 @@
 ];
 
 describe('page exports', () => {
+  it('round-trips all same-day sheets with their own media, comments and reactions', () => {
+    const second = {
+      ...all.pages[0],
+      id: all.pages[0].id + '__abc12345',
+      text: '두 번째 장',
+      createdAt: '2026-10-26T01:00:00Z',
+    };
+    const data = {
+      ...all,
+      pages: [second, all.pages[0]],
+      comments: [
+        ...all.comments,
+        { ...all.comments[0], id: 'second-comment', pageId: second.id },
+      ],
+      reactions: [...all.reactions, { ...all.reactions[0], pageId: second.id }],
+    };
+    expect(fromBackupJson(toBackupJson(data))).toEqual(data);
+    expect(migrateSnapshot(data)).toEqual(data);
+    const files = toDatedArchive(data);
+    const json = files.filter((file) => file.path.endsWith('.json'));
+    expect(new Set(files.map((file) => file.path)).size).toBe(files.length);
+    expect(json.map((file) => JSON.parse(file.content))).toEqual([
+      all.pages[0], second,
+    ]);
+    const markdown = files.find((file) => file.path.endsWith('.md'))!.content;
+    expect(markdown.indexOf('첫 걸음')).toBeLessThan(markdown.indexOf('두 번째 장'));
+  });
+  it.each([
+    '2026-10-26__kid1__mom',
+    '2026-10-27__kid1__dad',
+    '2026-10-26__kid2__dad',
+    '2026-10-26__kid1__dad__1234567',
+    '2026-10-26__kid1__dad__123456789',
+    '2026-10-26__kid1__dad__ABC12345',
+    '2026-10-26__kid1__dad__abc12345__extra',
+  ])('rejects malformed or mismatched v3 sheet ID %s', (id) => {
+    expect(() =>
+      fromBackupJson({
+        ...toBackupJson(all),
+        pages: [{ ...all.pages[0], id }],
+      }),
+    ).toThrow();
+  });
   it('round-trips v3 including drawings, photos and activity', () => {
     const backup = toBackupJson(all);
     expect(backup.version).toBe(3);
diff --git a/src/lib/exportFormat.ts b/src/lib/exportFormat.ts
index 580b521cd97b9d598c2ba3343e908b435c7d6d18..310d396f34f82a3714de28d1724f30f26f633646
--- a/src/lib/exportFormat.ts
+++ b/src/lib/exportFormat.ts
@@ -1,5 +1,6 @@
 import { migrateSnapshot, type LegacySnapshot } from '../data/migrate';
 import type { StoreSnapshot } from '../data/types';
+import { isValidPageId } from './pageId';
 
 export type BackupJson = StoreSnapshot & { version: 3; exportedAt: string };
 
@@ -71,8 +72,7 @@
     data.version === 3 &&
     snapshot.pages.some(
       (page) =>
-        !['dad', 'mom'].includes(page.authorId) ||
-        page.id !== page.date + '__' + page.childId + '__' + page.authorId ||
+        !isValidPageId(page) ||
         typeof page.text !== 'string',
     )
   )
diff --git a/src/lib/pageId.test.ts b/src/lib/pageId.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..41fdd195c3ca42dad1c1f15fe95b3e82f2bb483f
--- /dev/null
+++ b/src/lib/pageId.test.ts
@@ -0,0 +1,85 @@
+import { describe, expect, it } from 'vitest';
+import { basePageId, isValidPageId, newSheetId, sheetsFor } from './pageId';
+import { preparePage } from './stroke';
+import type { Page } from '../data/types';
+
+const page: Page = {
+  id: '2026-11-02__kid1__dad',
+  date: '2026-11-02',
+  childId: 'kid1',
+  authorId: 'dad',
+  text: '첫 장',
+  drawing: [],
+  photos: [],
+  tagIds: [],
+  createdAt: '2026-11-02T00:00:00Z',
+  updatedAt: '2026-11-02T00:00:00Z',
+};
+
+describe('page IDs and sheet order', () => {
+  it('keeps first IDs and generates independent eight-character sheet suffixes', () => {
+    expect(basePageId(page.date, page.childId, page.authorId)).toBe(page.id);
+    const ids = new Set(
+      Array.from({ length: 100 }, () =>
+        newSheetId(page.date, page.childId, page.authorId),
+      ),
+    );
+    expect(ids.size).toBe(100);
+    for (const id of ids) {
+      expect(id).toMatch(/^2026-11-02__kid1__dad__[a-z0-9]{8}$/);
+      expect(isValidPageId({ ...page, id })).toBe(true);
+      expect(preparePage({ ...page, id }).id).toBe(id);
+    }
+    expect(isValidPageId(page)).toBe(true);
+  });
+
+  it.each([
+    '__abc1234',
+    '__abc123456',
+    '__ABC12345',
+    '__abc_1234',
+    '__abc-1234',
+    '__abc12345__extra',
+    '__abc12345\n',
+    '__',
+  ])('rejects malformed suffix %j', (suffix) => {
+    const invalid = { ...page, id: page.id + suffix };
+    expect(isValidPageId(invalid)).toBe(false);
+    expect(() => preparePage(invalid)).toThrow();
+  });
+
+  it('rejects IDs mismatching any identity field', () => {
+    expect(isValidPageId({ ...page, date: '2026-11-03' })).toBe(false);
+    expect(isValidPageId({ ...page, childId: 'kid2' })).toBe(false);
+    expect(isValidPageId({ ...page, authorId: 'mom' })).toBe(false);
+    expect(isValidPageId({ ...page, childId: '' })).toBe(false);
+  });
+
+  it('filters the exact day, child and parent and sorts by creation then ID without mutation', () => {
+    const second = {
+      ...page,
+      id: page.id + '__zzzzzzzz',
+      createdAt: '2026-11-02T01:00:00Z',
+    };
+    const third = {
+      ...second,
+      id: page.id + '__aaaaaaaa',
+      createdAt: '2026-11-02T02:00:00Z',
+    };
+    const tied = { ...third, id: page.id + '__bbbbbbbb' };
+    const pages = [
+      tied,
+      third,
+      second,
+      { ...page, updatedAt: '2026-11-03T00:00:00Z' },
+      { ...page, date: '2026-11-01' },
+      { ...page, childId: 'kid2' },
+      { ...page, authorId: 'mom' as const },
+    ];
+    const before = structuredClone(pages);
+    expect(
+      sheetsFor(pages, page.date, page.childId, page.authorId).map((p) => p.id),
+    ).toEqual([page.id, second.id, third.id, tied.id]);
+    expect(pages).toEqual(before);
+  });
+});
diff --git a/src/lib/pageId.ts b/src/lib/pageId.ts
new file mode 100644
index 0000000000000000000000000000000000000000..3d44116710f40c1752a86239aba3d758e6702c6a
--- /dev/null
+++ b/src/lib/pageId.ts
@@ -0,0 +1,66 @@
+import type { Page } from '../data/types';
+
+export function basePageId(
+  date: string,
+  childId: string,
+  authorId: Page['authorId'],
+): string {
+  return `${date}__${childId}__${authorId}`;
+}
+
+export function newSheetId(
+  date: string,
+  childId: string,
+  authorId: Page['authorId'],
+): string {
+  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
+  let suffix = '';
+  // Rejection sampling keeps all 36 characters equally likely.
+  while (suffix.length < 8) {
+    for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
+      if (byte < 252 && suffix.length < 8) suffix += alphabet[byte % 36];
+    }
+  }
+  return `${basePageId(date, childId, authorId)}__${suffix}`;
+}
+
+export function isValidPageId(
+  page: Pick<Page, 'id' | 'date' | 'childId' | 'authorId'>,
+): boolean {
+  if (
+    typeof page.id !== 'string' ||
+    typeof page.date !== 'string' ||
+    page.date.length !== 10 ||
+    !/^\d{4}-\d{2}-\d{2}$/.test(page.date) ||
+    typeof page.childId !== 'string' ||
+    !page.childId ||
+    !['dad', 'mom'].includes(page.authorId)
+  )
+    return false;
+  const base = basePageId(page.date, page.childId, page.authorId);
+  return (
+    page.id === base ||
+    (page.id.length === base.length + 10 &&
+      page.id.startsWith(base + '__') &&
+      /^[a-z0-9]{8}$/.test(page.id.slice(base.length + 2)))
+  );
+}
+
+export function sheetsFor(
+  pages: Page[],
+  date: string,
+  childId: string,
+  authorId: string,
+): Page[] {
+  return pages
+    .filter(
+      (page) =>
+        page.date === date &&
+        page.childId === childId &&
+        page.authorId === authorId,
+    )
+    .sort(
+      (a, b) =>
+        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
+    );
+}
diff --git a/src/lib/stroke.ts b/src/lib/stroke.ts
index eeb2602ccc92f797967bab59b66c64def8c1bafd..253c1de265e46f07018c76f5291876f44732f73c
--- a/src/lib/stroke.ts
+++ b/src/lib/stroke.ts
@@ -1,4 +1,5 @@
 import type { Page, Stroke } from '../data/types';
+import { isValidPageId } from './pageId';
 
 export function isStrokeWidth(width: unknown): width is Stroke['width'] {
   return [2, 5, 8, 14, 28].includes(width as number);
@@ -29,13 +30,11 @@
 }
 
 export function preparePage(page: Page): Page {
-  const id = page.date + '__' + page.childId + '__' + page.authorId;
-  if (!['dad', 'mom'].includes(page.authorId) || page.id !== id) {
+  if (!isValidPageId(page)) {
     throw new Error('페이지의 날짜, 아이와 작성자는 바꿀 수 없어요.');
   }
   const result = {
     ...page,
-    id,
     drawing: page.drawing.map((stroke) => {
       if (!isStrokeWidth(stroke.width)) {
         throw new Error('그림 도구의 굵기를 확인해 주세요.');
diff --git a/src/styles/app.css b/src/styles/app.css
index 04aa18bd154ce5eccb83359658fa4914663081a7..9654cc22dda57720d60b97215fc5893e5d6113cd
--- a/src/styles/app.css
+++ b/src/styles/app.css
@@ -8,6 +8,7 @@
 }
 body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg); }
 button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
+input, textarea, select { color: inherit; }
 .artifact-welcome { min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; padding: calc(24px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-inset-bottom)); background: var(--bg); }
 .artifact-welcome h2 { font-size: 22px; }
 .artifact-picker { display: flex; gap: 16px; width: 100%; max-width: 320px; }
@@ -187,10 +188,6 @@
 .action-sheet button:last-child { border-bottom: 0; color: var(--sub); }
 .action-sheet .danger { color: var(--kid1); }
 
-.notes { max-width: 1240px; margin: 40px auto 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
-.note { background: var(--card); border-radius: var(--r-card); padding: 18px; box-shadow: var(--shadow); font-size: 14px; }
-.note h4 { font-size: 15px; margin-bottom: 6px; }
-.note ul { padding-left: 18px; color: var(--sub); }
 .swatches { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
 .sw { width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--line); }
 
diff --git a/src/styles/page.css b/src/styles/page.css
index f30f5abb2d2e20133f2b3b3bf2a7d5b4d5f421a7..2ffdbe722bf73e4276370ba567b709820c2030ca
--- a/src/styles/page.css
+++ b/src/styles/page.css
@@ -227,11 +227,18 @@
   min-height: 176px;
 }
 
-.notes {
+.diary .notes {
+  display: block;
+  margin: 0;
   min-height: 140px;
 }
 
-.note {
+.diary .note {
+  background: none;
+  box-shadow: none;
+  border-radius: 0;
+  padding: 0;
+  font-size: 20px;
   margin-bottom: 14px;
   line-height: 35px;
   white-space: pre-wrap;
@@ -240,7 +247,7 @@
 
 .initial {
   margin-left: 7px;
-  opacity: 0.5;
+  opacity: 0.7;
   font-size: 13px;
 }
 
@@ -545,6 +552,23 @@
   gap: 8px;
   word-break: keep-all;
 }
+.diary .page-sheets {
+  display: flex;
+  justify-content: center;
+  flex: none;
+  height: 44px;
+  overflow-x: auto;
+  color: var(--page-ink);
+}
+.page-sheets button {
+  flex: 0 0 44px;
+  opacity: 0.7;
+}
+.page-sheets button[aria-pressed='true'] {
+  opacity: 1;
+  text-decoration: underline;
+  text-underline-offset: 4px;
+}
 .parent-pages button {
   min-height: 44px;
   padding: 2px 5px;
diff --git a/src/styles/tokens.css b/src/styles/tokens.css
index ef78879c69b0ec08ac3018f3aa658a2b2b9b7347..8524e9344622284da57edbccc696862aca9c36e8
--- a/src/styles/tokens.css
+++ b/src/styles/tokens.css
@@ -1,6 +1,7 @@
 
 /* ===== Design tokens ===== */
 :root {
+  color-scheme: light;
   --bg: #F6F5F2;
   --card: #FFFFFF;
   --surface: #FFFFFF;
@@ -35,6 +36,7 @@
 }
 @media (prefers-color-scheme: dark) {
   :root:not([data-theme="light"]) {
+    color-scheme: dark;
     --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
     --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
     --dad: #8AA6E3; --mom: #E39BB3;
@@ -47,6 +49,7 @@
   }
 }
 :root[data-theme="dark"] {
+  color-scheme: dark;
   --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
   --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
   --dad: #8AA6E3; --mom: #E39BB3;
diff --git a/supabase/migrations/20261102000000_multi_page_sheets.sql b/supabase/migrations/20261102000000_multi_page_sheets.sql
new file mode 100644
index 0000000000000000000000000000000000000000..fedcc73ae4d3a6fbfb7bbbd028c889418b3471a2
--- /dev/null
+++ b/supabase/migrations/20261102000000_multi_page_sheets.sql
@@ -0,0 +1,35 @@
+begin;
+
+do $$
+declare
+  id_check text;
+  matches integer;
+begin
+  -- Locate the original unnamed ID check by its definition, not its generated name.
+  select count(*), min(conname::text)
+    into matches, id_check
+  from pg_constraint
+  where conrelid = 'public.pages'::regclass
+    and contype = 'c'
+    and regexp_replace(pg_get_constraintdef(oid), '[[:space:]()]', '', 'g') =
+      'CHECKid=date::text||''__''::text||child_id||''__''::text||author_id';
+
+  if matches <> 1 then
+    raise exception 'Expected exactly one original pages ID check, found %', matches;
+  end if;
+  execute format('alter table public.pages drop constraint %I', id_check);
+end $$;
+
+alter table public.pages add constraint pages_sheet_id_check check (
+  id = date::text || '__' || child_id || '__' || author_id
+  or (
+    length(id) = length(date::text || '__' || child_id || '__' || author_id) + 10
+    and
+    left(id, length(date::text || '__' || child_id || '__' || author_id) + 2) =
+      date::text || '__' || child_id || '__' || author_id || '__'
+    and substring(id from length(date::text || '__' || child_id || '__' || author_id) + 3)
+      ~ '^[a-z0-9]{8}$'
+  )
+);
+
+commit;

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "@'
const fs = require('node:fs');
const file = 'src/features/settings/bookLayout.ts';
fs.writeFileSync(file, fs.readFileSync(file, 'utf8').trimEnd() + '\\n');
'@ | node
npx.cmd tsc -b
node --input-type=module -e \"import { startVitest } from 'vitest/node'; const ctx = await startVitest('test', ['src/features/page/WritingArea.test.ts', 'src/lib/pageId.test.ts', 'src/lib/exportFormat.test.ts', 'src/data/localStore.test.ts', 'src/data/artifactStore.test.ts', 'src/data/supabaseStore.test.ts', 'src/features/settings/bookLayout.test.ts'], { config: false }); await ctx?.close();\"
npx.cmd vite build" in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
 exited 1 in 12053ms:

 RUN  v3.2.7 C:/Users/ajou/OneDrive/0. 개인정보/00. 주현♥/육아일기 앱

 ✓ src/lib/pageId.test.ts (11 tests) 19ms
 ✓ src/features/page/WritingArea.test.ts (3 tests) 6ms
 ✓ src/lib/exportFormat.test.ts (12 tests) 24ms
 ✓ src/data/localStore.test.ts (8 tests) 24ms
 ✓ src/data/supabaseStore.test.ts (11 tests) 1600ms
 ✓ src/features/settings/bookLayout.test.ts (5 tests) 19ms
 ✓ src/data/artifactStore.test.ts (12 tests) 81ms

 Test Files  7 passed (7)
      Tests  62 passed (62)
   Start at  09:38:30
   Duration  4.72s (transform 1.34s, setup 0ms, collect 8.44s, tests 1.77s, environment 1ms, prepare 3.09s)

X [ERROR] Cannot read directory "../../../..": Access is denied.

X [ERROR] Could not resolve "C:\\Users\\ajou\\OneDrive\\0. 개인정보\\00. 주현♥\\육아일기 앱\\vite.config.ts"

failed to load config from C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\vite.config.ts
error during build:
Error: Build failed with 2 errors:
error: Cannot read directory "../../../..": Access is denied.
error: Could not resolve "C:\\Users\\ajou\\OneDrive\\0. 개인정보\\00. 주현♥\\육아일기 앱\\vite.config.ts"
    at failureErrorWithLog (C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\node_modules\esbuild\lib\main.js:1467:15)
    at C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\node_modules\esbuild\lib\main.js:926:25
    at runOnEndCallbacks (C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\node_modules\esbuild\lib\main.js:1307:45)
    at buildResponseToResult (C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\node_modules\esbuild\lib\main.js:924:7)
    at C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\node_modules\esbuild\lib\main.js:951:16
    at responseCallbacks.<computed> (C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\node_modules\esbuild\lib\main.js:603:9)
    at handleIncomingPacket (C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\node_modules\esbuild\lib\main.js:658:12)
    at Socket.readFromStdout (C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\node_modules\esbuild\lib\main.js:581:7)
    at Socket.emit (node:events:509:28)
    at addChunk (node:internal/streams/readable:563:12)

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'git -c core.safecrlf=false diff --check; git -c core.safecrlf=false diff -- src/styles/app.css src/styles/page.css src/styles/tokens.css src/data/migrate.ts src/lib/stroke.ts src/features/settings/bookLayout.ts src/features/settings/bookExport.ts src/lib/datedArchive.mjs src/features/archive/ArchiveScreen.tsx src/features/calendar/DayPreview.tsx; Get-Content -Encoding UTF8 supabase/migrations/20261102000000_multi_page_sheets.sql; git -c core.quotepath=false status --short' in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
 succeeded in 557ms:
diff --git a/src/data/migrate.ts b/src/data/migrate.ts
index 85c5983..f9fcd44 100644
--- a/src/data/migrate.ts
+++ b/src/data/migrate.ts
@@ -1,4 +1,5 @@
 import { normalizePageColor } from '../lib/pageColors';
+import { basePageId } from '../lib/pageId';
 import type { LegacyEntry } from './legacyAdapter';
 import type {
   Child,
@@ -164,11 +165,11 @@ export function migrateSnapshot(
         a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
     );
     const owner = notes[0]?.authorId ?? 'dad';
-    owners.set(source.id, source.date + '__' + source.childId + '__' + owner);
+    owners.set(source.id, basePageId(source.date, source.childId, owner));
     for (const authorId of [
       ...new Set([owner, ...notes.map((note) => note.authorId)]),
     ]) {
-      const id = source.date + '__' + source.childId + '__' + authorId;
+      const id = basePageId(source.date, source.childId, authorId);
       const { notes: _, ...rest } = source;
       const value: Page = {
         ...rest,
diff --git a/src/features/archive/ArchiveScreen.tsx b/src/features/archive/ArchiveScreen.tsx
index 64cb540..e39d2b4 100644
--- a/src/features/archive/ArchiveScreen.tsx
+++ b/src/features/archive/ArchiveScreen.tsx
@@ -14,7 +14,7 @@ export function ArchiveScreen({
 }: {
   store: DataStore;
   snapshot: StoreSnapshot;
-  openPage: (date: string, childId: string, authorId?: 'dad' | 'mom') => void;
+  openPage: (date: string, childId: string, authorId?: 'dad' | 'mom', pageId?: string) => void;
   onBack: () => void;
 }) {
   const [query, setQuery] = useState('');
@@ -86,7 +86,7 @@ export function ArchiveScreen({
                   key={page.id}
                   page={page}
                   child={child}
-                  onClick={() => openPage(page.date, page.childId, page.authorId)}
+                  onClick={() => openPage(page.date, page.childId, page.authorId, page.id)}
                 />
               ) : (
                 <PageCard
@@ -95,7 +95,7 @@ export function ArchiveScreen({
                   page={page}
                   child={child}
                   onClick={() =>
-                    openPage(page.date, page.childId, page.authorId)
+                    openPage(page.date, page.childId, page.authorId, page.id)
                   }
                 />
               ) : null;
diff --git a/src/features/calendar/DayPreview.tsx b/src/features/calendar/DayPreview.tsx
index 3fab7e5..d513915 100644
--- a/src/features/calendar/DayPreview.tsx
+++ b/src/features/calendar/DayPreview.tsx
@@ -9,7 +9,7 @@ type Props = {
   store: DataStore;
   snapshot: StoreSnapshot;
   date: string;
-  openPage: (date: string, childId: string, authorId?: 'dad' | 'mom') => void;
+  openPage: (date: string, childId: string, authorId?: 'dad' | 'mom', pageId?: string) => void;
 };
 
 export function DayPreview({ store, snapshot, date, openPage }: Props) {
@@ -39,7 +39,7 @@ export function DayPreview({ store, snapshot, date, openPage }: Props) {
                   key={page?.id ?? child.id}
                   child={child}
                   page={page}
-                  onClick={() => openPage(date, child.id, page?.authorId)}
+                  onClick={() => openPage(date, child.id, page?.authorId, page?.id)}
                 />
               );
             }
@@ -49,7 +49,7 @@ export function DayPreview({ store, snapshot, date, openPage }: Props) {
                 page={page}
                 child={child}
                 showDate={false}
-                onClick={() => openPage(date, child.id, page.authorId)}
+                onClick={() => openPage(date, child.id, page.authorId, page.id)}
               />
             ) : (
               <button
diff --git a/src/features/settings/bookExport.ts b/src/features/settings/bookExport.ts
index 18d0057..044dd9f 100644
--- a/src/features/settings/bookExport.ts
+++ b/src/features/settings/bookExport.ts
@@ -1,9 +1,16 @@
 import type { DataStore } from '../../data/DataStore';
 import type { Page, StoreSnapshot } from '../../data/types';
 import { inkFor } from '../../lib/pageColors';
+import { sheetsFor } from '../../lib/pageId';
 import { downloadFile } from '../../lib/download';
 import { paintStroke } from '../page/strokes';
-import { BOOK, bookFilename, fitTextPages, wrapText } from './bookLayout';
+import {
+  BOOK,
+  bookFilename,
+  compareBookSheets,
+  fitTextPages,
+  wrapText,
+} from './bookLayout';
 import { loadPdf, loadZip } from '../../lib/loadExportLibs';
 
 export type BookOptions = {
@@ -167,7 +174,7 @@ export async function exportBook(
         (!options.childId || page.childId === options.childId) &&
         (!options.authorId || page.authorId === options.authorId),
     )
-    .sort((a, b) => a.id.localeCompare(b.id));
+    .sort(compareBookSheets);
   if (!pages.length) throw new Error('선택한 기간에 기록이 없어요.');
   progress(0, pages.length);
   const fonts: FontFace[] = [];
@@ -253,6 +260,9 @@ export async function exportBook(
             all.children.find((child) => child.id === page.childId)?.name ??
               page.childId,
             page.authorId === 'mom' ? '엄마' : '아빠',
+            sheetsFor(pages, page.date, page.childId, page.authorId).findIndex(
+              (sheet) => sheet.id === page.id,
+            ) + 1,
           );
           zip.file(
             pageIndex ? name.replace(/\.png$/, `_${pageIndex + 1}.png`) : name,
diff --git a/src/features/settings/bookLayout.ts b/src/features/settings/bookLayout.ts
index 1d73521..d35bcff 100644
--- a/src/features/settings/bookLayout.ts
+++ b/src/features/settings/bookLayout.ts
@@ -1,3 +1,5 @@
+import type { Page } from '../../data/types';
+
 export const mmToPx = (mm: number, dpi = 300) => Math.round((mm / 25.4) * dpi);
 export const BOOK = { width: mmToPx(148), height: mmToPx(210) };
 
@@ -5,11 +7,12 @@ export function bookFilename(
   date: string,
   child: string,
   author: string,
+  sheetNumber = 1,
 ): string {
   const safe = (value: string) =>
     value.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '') ||
     '이름없음';
-  return `${date}_${safe(child)}_${safe(author)}.png`;
+  return `${date}_${safe(child)}_${safe(author)}${sheetNumber > 1 ? `__장${sheetNumber}` : ''}.png`;
 }
 
 export function wrapText(
@@ -48,3 +51,12 @@ export function fitTextPages(
   }
   return { size, pages: pages.length ? pages : [[]] };
 }
+export function compareBookSheets(a: Page, b: Page): number {
+  return (
+    a.date.localeCompare(b.date) ||
+    a.childId.localeCompare(b.childId) ||
+    a.authorId.localeCompare(b.authorId) ||
+    a.createdAt.localeCompare(b.createdAt) ||
+    a.id.localeCompare(b.id)
+  );
+}
diff --git a/src/lib/datedArchive.mjs b/src/lib/datedArchive.mjs
index d6dd323..ab875f0 100644
--- a/src/lib/datedArchive.mjs
+++ b/src/lib/datedArchive.mjs
@@ -1,10 +1,17 @@
+function comparePages(a, b) {
+  return (
+    a.date.localeCompare(b.date) ||
+    a.childId.localeCompare(b.childId) ||
+    a.authorId.localeCompare(b.authorId) ||
+    a.createdAt.localeCompare(b.createdAt) ||
+    a.id.localeCompare(b.id)
+  );
+}
+
 export function toMarkdown(all, month) {
   const pages = all.pages
     .filter((page) => !month || page.date.startsWith(month))
-    .sort(
-      (a, b) =>
-        a.date.localeCompare(b.date) || a.childId.localeCompare(b.childId),
-    );
+    .sort(comparePages);
   const children = new Map(all.children.map((child) => [child.id, child.name]));
   const members = new Map(
     all.members.map((member) => [member.id, member.displayName]),
@@ -71,7 +78,7 @@ export function toDatedArchive(snapshot) {
     const directory = 'diary/' + date.split('-').join('/');
     const pages = snapshot.pages
       .filter((page) => page.date === date)
-      .sort((a, b) => a.id.localeCompare(b.id));
+      .sort(comparePages);
     for (const page of pages)
       files.push({
         path:
@@ -80,6 +87,9 @@ export function toDatedArchive(snapshot) {
           encodeURIComponent(page.childId) +
           '-' +
           page.authorId +
+          (page.id === `${page.date}__${page.childId}__${page.authorId}`
+            ? ''
+            : '--' + encodeURIComponent(page.id)) +
           '.json',
         content: JSON.stringify(page, null, 2),
       });
diff --git a/src/lib/stroke.ts b/src/lib/stroke.ts
index eeb2602..253c1de 100644
--- a/src/lib/stroke.ts
+++ b/src/lib/stroke.ts
@@ -1,4 +1,5 @@
 import type { Page, Stroke } from '../data/types';
+import { isValidPageId } from './pageId';
 
 export function isStrokeWidth(width: unknown): width is Stroke['width'] {
   return [2, 5, 8, 14, 28].includes(width as number);
@@ -29,13 +30,11 @@ export function simplifyStroke(
 }
 
 export function preparePage(page: Page): Page {
-  const id = page.date + '__' + page.childId + '__' + page.authorId;
-  if (!['dad', 'mom'].includes(page.authorId) || page.id !== id) {
+  if (!isValidPageId(page)) {
     throw new Error('페이지의 날짜, 아이와 작성자는 바꿀 수 없어요.');
   }
   const result = {
     ...page,
-    id,
     drawing: page.drawing.map((stroke) => {
       if (!isStrokeWidth(stroke.width)) {
         throw new Error('그림 도구의 굵기를 확인해 주세요.');
diff --git a/src/styles/app.css b/src/styles/app.css
index 033c1c9..342f666 100644
--- a/src/styles/app.css
+++ b/src/styles/app.css
@@ -8,6 +8,7 @@ body {
 }
 body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg); }
 button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
+input, textarea, select { color: inherit; }
 .artifact-welcome { min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; padding: calc(24px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-inset-bottom)); background: var(--bg); }
 .artifact-welcome h2 { font-size: 22px; }
 .artifact-picker { display: flex; gap: 16px; width: 100%; max-width: 320px; }
@@ -187,10 +188,6 @@ button { font: inherit; color: inherit; background: none; border: 0; cursor: poi
 .action-sheet button:last-child { border-bottom: 0; color: var(--sub); }
 .action-sheet .danger { color: var(--kid1); }
 
-.notes { max-width: 1240px; margin: 40px auto 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
-.note { background: var(--card); border-radius: var(--r-card); padding: 18px; box-shadow: var(--shadow); font-size: 14px; }
-.note h4 { font-size: 15px; margin-bottom: 6px; }
-.note ul { padding-left: 18px; color: var(--sub); }
 .swatches { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
 .sw { width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--line); }
 
diff --git a/src/styles/page.css b/src/styles/page.css
index f30f5ab..2ffdbe7 100644
--- a/src/styles/page.css
+++ b/src/styles/page.css
@@ -227,11 +227,18 @@
   min-height: 176px;
 }
 
-.notes {
+.diary .notes {
+  display: block;
+  margin: 0;
   min-height: 140px;
 }
 
-.note {
+.diary .note {
+  background: none;
+  box-shadow: none;
+  border-radius: 0;
+  padding: 0;
+  font-size: 20px;
   margin-bottom: 14px;
   line-height: 35px;
   white-space: pre-wrap;
@@ -240,7 +247,7 @@
 
 .initial {
   margin-left: 7px;
-  opacity: 0.5;
+  opacity: 0.7;
   font-size: 13px;
 }
 
@@ -545,6 +552,23 @@
   gap: 8px;
   word-break: keep-all;
 }
+.diary .page-sheets {
+  display: flex;
+  justify-content: center;
+  flex: none;
+  height: 44px;
+  overflow-x: auto;
+  color: var(--page-ink);
+}
+.page-sheets button {
+  flex: 0 0 44px;
+  opacity: 0.7;
+}
+.page-sheets button[aria-pressed='true'] {
+  opacity: 1;
+  text-decoration: underline;
+  text-underline-offset: 4px;
+}
 .parent-pages button {
   min-height: 44px;
   padding: 2px 5px;
diff --git a/src/styles/tokens.css b/src/styles/tokens.css
index ef78879..8524e93 100644
--- a/src/styles/tokens.css
+++ b/src/styles/tokens.css
@@ -1,6 +1,7 @@
 
 /* ===== Design tokens ===== */
 :root {
+  color-scheme: light;
   --bg: #F6F5F2;
   --card: #FFFFFF;
   --surface: #FFFFFF;
@@ -35,6 +36,7 @@
 }
 @media (prefers-color-scheme: dark) {
   :root:not([data-theme="light"]) {
+    color-scheme: dark;
     --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
     --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
     --dad: #8AA6E3; --mom: #E39BB3;
@@ -47,6 +49,7 @@
   }
 }
 :root[data-theme="dark"] {
+  color-scheme: dark;
   --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
   --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
   --dad: #8AA6E3; --mom: #E39BB3;
begin;

do $$
declare
  id_check text;
  matches integer;
begin
  -- Locate the original unnamed ID check by its definition, not its generated name.
  select count(*), min(conname::text)
    into matches, id_check
  from pg_constraint
  where conrelid = 'public.pages'::regclass
    and contype = 'c'
    and regexp_replace(pg_get_constraintdef(oid), '[[:space:]()]', '', 'g') =
      'CHECKid=date::text||''__''::text||child_id||''__''::text||author_id';

  if matches <> 1 then
    raise exception 'Expected exactly one original pages ID check, found %', matches;
  end if;
  execute format('alter table public.pages drop constraint %I', id_check);
end $$;

alter table public.pages add constraint pages_sheet_id_check check (
  id = date::text || '__' || child_id || '__' || author_id
  or (
    length(id) = length(date::text || '__' || child_id || '__' || author_id) + 10
    and
    left(id, length(date::text || '__' || child_id || '__' || author_id) + 2) =
      date::text || '__' || child_id || '__' || author_id || '__'
    and substring(id from length(date::text || '__' || child_id || '__' || author_id) + 3)
      ~ '^[a-z0-9]{8}$'
  )
);

commit;
 M AGENTS.md
 M scripts/backup/backup.check.mjs
 M src/App.tsx
 M src/data/DataStore.ts
 M src/data/artifactStore.test.ts
 M src/data/artifactStore.ts
 M src/data/legacyAdapter.ts
 M src/data/localStore.test.ts
 M src/data/localStore.ts
 M src/data/migrate.ts
 M src/data/supabaseStore.test.ts
 M src/data/supabaseStore.ts
 M src/data/types.ts
 M src/features/archive/ArchiveScreen.tsx
 M src/features/calendar/CalendarScreen.tsx
 M src/features/calendar/DayPreview.tsx
 M src/features/page/PageScreen.tsx
 M src/features/page/WritingArea.tsx
 M src/features/settings/bookExport.ts
 M src/features/settings/bookLayout.test.ts
 M src/features/settings/bookLayout.ts
 M src/lib/datedArchive.mjs
 M src/lib/exportFormat.test.ts
 M src/lib/exportFormat.ts
 M src/lib/stroke.ts
 M src/styles/app.css
 M src/styles/page.css
 M src/styles/tokens.css
?? docs/codex-prompts/phase-23.md
?? docs/codex-prompts/phase-23.out.md
?? src/features/page/WritingArea.test.ts
?? src/lib/pageId.test.ts
?? src/lib/pageId.ts
?? supabase/migrations/20261102000000_multi_page_sheets.sql

apply patch
patch: completed
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\App.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\archive\ArchiveScreen.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\calendar\CalendarScreen.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\calendar\DayPreview.tsx
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\features\settings\bookLayout.ts
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\src\styles\page.css
C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱\supabase\migrations\20261102000000_multi_page_sheets.sql
diff --git a/AGENTS.md b/AGENTS.md
index 2470892e8da4ca7a1b74219bd99858cdefc1b51c..178fcc2726f0fbdce6531acbd9ff47250f9181a4
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -22,7 +22,7 @@
 ## Design specs (user approved)
 1. **Home** = `docs/design/home-c1-moon.html` (night style 달) and `docs/design/home-c3-lantern.html` (night style 풍등); the user picks the night style on Home (default 달). Day (light theme): select 노을 언덕 (default, `docs/design/home-day-sunset.html`) or 민들레 (`docs/design/home-day-dandelion.html`) on Home. Sunset suns have 30 ridge wildflowers (bloom/bud), with periodic bird flocks; dandelion heads have 30 seeds (fluffy/faint), with drifting background seeds and soft meadow grass. Stems end above navigation. Night (dark theme): starfield with twinkle + shooting stars, faces as moons with a 30-star crown, or as sky-lanterns with 30 beads. The 30 marks = the last 30 days; a day counts as written if EITHER parent saved a page for that child. No names on the home; accessible labels carry name + summary. Long-press a face → "최근 30일 중 N일 기록". All four styles wander smoothly across the whole safe scene below the date and above navigation (12?20 px/s on mobile, faster on desktop), with gentle tilt/bob, soft face separation, and steering away from the scene switcher. One shared animation clock pauses when hidden. Dandelion stems stretch/bend from fixed ground roots; sunset suns float freely while their 30 flowers slide horizontally along the hill below. After long-press, moving over 6px picks up the face and its marks; release flings it within safe scene bounds above navigation, with friction and edge/circle bounces; wandering resumes where the fling settles without springing home. A fling never opens a page. Reduced motion is static and drag returns directly home. Lanterns must not overlap each other's bead strings. Scene selection lives in one artwork object placed naturally per scene, with face steering avoiding its own area: sunset has a small 30px orange-rose setting sun half-occluded by the actual far ridge toward the right (6s breathing halo, faint rim shimmer, 14s gentle sinking); dandelion keeps the ladybug on its drifting seed; moon has a quiet warm-white thin four-point glint only slightly larger than background stars (4.5s subtle twinkle, soft flare every 12s); lantern has a small dim distant lantern (8s rise/sway plus flicker). Object motion shares the paused-when-hidden scene clock; all objects are static with reduced motion. Each is an accessible button named 장면 바꾸기 with an invisible ≥44px hit area and keyboard-only focus ring, behind faces and never a collision body. First three device-local Home visits shimmer once after 1.5s (no reduced-motion animation). A frosted strip groups four SVG scene thumbnails under 낮/밤; choosing persists the corresponding HomePreferences style and explicit light/dark theme, crossfades for 400ms (instant with reduced motion), and closes. Outside tap, Esc and back also close it. 설정 › 화면 keeps only 시스템/라이트/다크 and the hint 홈의 작은 집·무당벌레·별·풍등을 누르면 장면을 바꿀 수 있어요.
 2. **App shell** (archive list, calendar, settings, sheets): `docs/design/mockup-v3.html` — Pretendard, clean cards, dark filled pills/buttons, soft navy-violet dark mode. Intuitive = on every screen the thing to choose and the most important info are obvious at a glance.
-3. **Diary page** (one sheet for one child, one day, one parent): full-bleed page color, Gaegu handwriting, hand-drawn ink. NO visible borders/frames between the drawing and writing areas; the drawing area spans the full screen width edge to edge. ONLY: top bar (← back, date with ‹ ›, ONE badge icon), a small "엄마의 페이지 · 아빠의 페이지" switch (swipe or tap), a quiet fixed-height sheet-number row with ? for another saved own page, drawing, writing, bottom (💬 comments, big oval 저장/수정).
+3. **Diary page** (one sheet for one child, one day, one parent): full-bleed page color, Gaegu handwriting, hand-drawn ink. NO visible borders/frames between the drawing and writing areas; the drawing area spans the full screen width edge to edge. ONLY: top bar (← back, date with ‹ ›, ONE badge icon), a small "엄마의 페이지 · 아빠의 페이지" switch (swipe or tap), a quiet fixed-height sheet-number row with ＋ to add a sheet when the current own sheet is saved, drawing, writing, bottom (💬 comments, big oval 저장/수정).
 - Flow: Home → tap a face → that child's page for today, opened on the current writer's own page → 저장 → back to Home with toast "저장했어요". Reaching Home's archive/calendar/settings: small, quiet icons at the bottom of Home (not competing with the faces).
 - **Current writer**: use store.getCurrentMemberId() (first-visit full-screen picker / settings). No per-page writer choice. The current writer's paragraph is editable, with a small author initial beside each paragraph. Save requires text, drawing, or photo.
 - Page palette: shared ColorPicker with 3 recommended colors (벚꽃 #F4B9B8, 박하 #CDEFE2, 귤 #F59157), up to 5 viewer-local recent colors, and a frozen 40-swatch pastel grid (10 rainbow hue families × 4 tones), including all 16 legacy named colors. Normalize old colors to the nearest grid color on load. Pen colors are separate: auto ink plus 8 deeper crayons, stored per Stroke.color; `ink` means auto ink. Display colors mix 90% page color + 10% #262638 in dark mode. Auto ink chooses #1E2326 or #F5F0E1 by highest WCAG contrast against the displayed color.
diff --git a/scripts/backup/backup.check.mjs b/scripts/backup/backup.check.mjs
index 93c14b559fda0e5000ca229445592daf9bffb72c..31e898950ea6096e2c6fd0b3db73dfbfb47a64db
--- a/scripts/backup/backup.check.mjs
+++ b/scripts/backup/backup.check.mjs
@@ -19,6 +19,34 @@
   new URL('./fixtures/two-parents.json', import.meta.url),
 );
 
+test('dated archives preserve multiple sheets for one parent in creation order', async () => {
+  const snapshot = JSON.parse(await readFile(fixture, 'utf8'));
+  const first = snapshot.pages.find((page) => page.authorId === 'dad');
+  const second = {
+    ...first,
+    id: first.id + '__zzzzzzzz',
+    text: '두 번째 장',
+    createdAt: '2026-10-26T20:00:00Z',
+  };
+  const third = {
+    ...second,
+    id: first.id + '__aaaaaaaa',
+    text: '세 번째 장',
+    createdAt: '2026-10-26T21:00:00Z',
+  };
+  snapshot.pages = [third, second, ...snapshot.pages];
+  const files = toDatedArchive(snapshot);
+  assert.equal(new Set(files.map((file) => file.path)).size, files.length);
+  assert.deepEqual(
+    files.filter((file) => file.path.endsWith('.json'))
+      .map((file) => JSON.parse(file.content).id),
+    [first.id, second.id, third.id, snapshot.pages.find((page) => page.authorId === 'mom').id],
+  );
+  const markdown = files.find((file) => file.path.endsWith('.md')).content;
+  assert.ok(markdown.indexOf('아빠 기록') < markdown.indexOf('두 번째 장'));
+  assert.ok(markdown.indexOf('두 번째 장') < markdown.indexOf('세 번째 장'));
+});
+
 test('dated backup dry-run and incremental writes preserve old files and both parents', async () => {
   const directory = await mkdtemp(path.join(tmpdir(), 'diary-backup-'));
   const run = (...args) =>
diff --git a/src/App.tsx b/src/App.tsx
index 83254dd1abb764b1b15ec1e793e502bca0d244f2..eec428bd0b786c60ea9971c98a488c94381484c7
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -21,6 +21,7 @@
       date: string;
       childId: string;
       authorId?: 'dad' | 'mom';
+      pageId?: string;
       editing: boolean;
       origin?: PageOrigin;
     };
@@ -54,12 +55,14 @@
     nextDate: string,
     childId: string,
     authorId?: 'dad' | 'mom',
+    pageId?: string,
   ) =>
     setScreen({
       kind: 'page',
       date: nextDate,
       childId,
       authorId,
+      pageId,
       ...source.current,
     });
   const goHome = () => setScreen({ kind: 'shell', tab: '홈' });
@@ -71,17 +74,23 @@
       <>
         <SyncBanner store={store} />
         <PageScreen
-          key={`${screen.date}__${screen.childId}__${screen.authorId ?? store.getCurrentMemberId()}`}
+          key={`${screen.date}__${screen.childId}__${screen.authorId ?? store.getCurrentMemberId()}__${screen.pageId ?? ''}`}
           store={store}
           snapshot={snapshot}
           child={child}
           date={screen.date}
           authorId={screen.authorId}
-          onAuthor={(authorId) => setScreen({ ...screen, authorId })}
+          pageId={screen.pageId}
+          onSheet={(pageId) => setScreen({ ...screen, pageId })}
+          onAuthor={(authorId) =>
+            setScreen({ ...screen, authorId, pageId: undefined })
+          }
           startEditing={screen.editing}
           origin={screen.origin}
           onBack={goHome}
-          onDate={(nextDate) => setScreen({ ...screen, date: nextDate })}
+          onDate={(nextDate) =>
+            setScreen({ ...screen, date: nextDate, pageId: undefined })
+          }
           onSaved={() => {
             setDate(screen.date);
             setSavedToast(true);
diff --git a/src/data/DataStore.ts b/src/data/DataStore.ts
index f971f02a5dfebfb3d80078f7b9969496a9c389f5..7a060f742f390c8bc42505056d4e66e94fd40b12
--- a/src/data/DataStore.ts
+++ b/src/data/DataStore.ts
@@ -26,6 +26,7 @@
   listMembers(): Member[];
   listTags(): Tag[];
   listPages(range?: PageRange): Page[];
+  getPageById(id: string): Page | undefined;
   getPage(
     date: string,
     childId: string,
diff --git a/src/data/artifactStore.test.ts b/src/data/artifactStore.test.ts
index b5713064c8ceb7becb8c1189d59f0918d23a179e..fd8d32d9fa2e5205bb63b6c04c6cb1c337ec4a40
--- a/src/data/artifactStore.test.ts
+++ b/src/data/artifactStore.test.ts
@@ -4,6 +4,45 @@
 import * as images from '../lib/image';
 
 afterEach(() => vi.restoreAllMocks());
+it('preserves and lazily reloads both same-day sheets and checks every body before export', async () => {
+  const db = new FakeDb();
+  const first = page('2020-01-01');
+  const second = {
+    ...first,
+    id: first.id + '__abc12345',
+    text: '두 번째 장',
+    createdAt: '2026-10-26T04:00:00Z',
+  };
+  const store = new ArtifactStore(db, 'viewer');
+  store.savePage(first);
+  store.savePage(second);
+  await settle();
+  store.dispose();
+  const loaded = new ArtifactStore(db, 'viewer');
+  expect(loaded.getPageById(first.id)).toBeUndefined();
+  expect(loaded.getPageById(second.id)).toBeUndefined();
+  expect(await loaded.loadPage(second.id)).toEqual(second);
+  expect(() => loaded.exportAll()).toThrow();
+  expect(await loaded.loadPage(first.id)).toEqual(first);
+  expect(loaded.exportAll().pages).toHaveLength(2);
+  loaded.savePage({
+    ...first,
+    text: '첫 장 수정',
+    updatedAt: '2026-10-26T05:00:00Z',
+  });
+  await settle();
+  expect(loaded.getPage(first.date, first.childId, first.authorId)?.id).toBe(
+    second.id,
+  );
+  expect(loaded.getPageById(second.id)?.text).toBe(second.text);
+  expect(db.bodies.get('index/2020-01')).toMatchObject({
+    pages: {
+      [first.id]: { createdAt: first.createdAt },
+      [second.id]: { createdAt: second.createdAt },
+    },
+  });
+  loaded.dispose();
+});
 it('writes one full body per page and small index summaries with no media bytes', async () => {
   const db = new FakeDb();
   const store = new ArtifactStore(db, 'viewer');
diff --git a/src/data/artifactStore.ts b/src/data/artifactStore.ts
index 12bc4bc34c5b1a126e4edb9ed437b89b8e321250..288f80d517b66fd732498258555e49d5b515e2c2
--- a/src/data/artifactStore.ts
+++ b/src/data/artifactStore.ts
@@ -1,5 +1,6 @@
 import { normalizePageColor } from '../lib/pageColors';
 import { todayKey } from '../lib/date';
+import { sheetsFor } from '../lib/pageId';
 import { LegacyAdapter } from './legacyAdapter';
 import { migrateMonthSnapshot, defaultChildStatus, defaultPageColor } from './migrate';
 import { preparePage } from '../lib/stroke';
@@ -55,6 +56,7 @@
     tagIds: page.tagIds,
     hasDrawing: page.drawing.length > 0,
     photoCount: page.photos.length,
+    createdAt: page.createdAt,
     updatedAt: page.updatedAt,
     deletedAt: null,
   };
@@ -100,7 +102,7 @@
             tagIds: summary.tagIds,
             drawing: [],
             photos: [],
-            createdAt: summary.updatedAt,
+            createdAt: summary.createdAt ?? summary.updatedAt,
             updatedAt: summary.updatedAt,
           },
     ),
@@ -536,14 +538,19 @@
     childId: string,
     authorId = this.getCurrentMemberId() || 'dad',
   ): Page | undefined {
-    const id = date + '__' + childId + '__' + authorId;
+    const page = sheetsFor(this.snapshot.pages, date, childId, authorId).slice(
+      -1,
+    )[0];
+    return page ? this.getPageById(page.id) : undefined;
+  }
+  getPageById(id: string): Page | undefined {
     if (
       this.cache.has(id) ||
       this.pending.some((write) => write.path === 'pages/' + id)
     ) {
       return this.snapshot.pages.find((page) => page.id === id);
     }
-    if (!this.months[date.slice(0, 7)]?.pages[id])
+    if (!this.months[id.slice(0, 7)]?.pages[id])
       return this.snapshot.pages.find((page) => page.id === id);
     return undefined;
   }
@@ -756,7 +763,7 @@
   exportAll(): StoreSnapshot {
     if (
       this.snapshot.pages.some(
-        (page) => !this.getPage(page.date, page.childId, page.authorId),
+        (page) => !this.getPageById(page.id),
       )
     )
       throw new Error('페이지를 불러온 뒤 백업해 주세요.');
diff --git a/src/data/legacyAdapter.ts b/src/data/legacyAdapter.ts
index 4d7ce7f39a0ad9354ba0eeffdc3ef38daa6b4fb9..2709be0fd351ca154fa2f3dee184eeaac556332b
--- a/src/data/legacyAdapter.ts
+++ b/src/data/legacyAdapter.ts
@@ -1,6 +1,7 @@
 import type { DataStore } from './DataStore';
 import type { Child, Page, StoreSnapshot } from './types';
 import { noteAuthor } from './migrate';
+import { basePageId, isValidPageId } from '../lib/pageId';
 
 export type LegacyEntry = {
   id: string;
@@ -34,6 +35,9 @@
   abstract updateChild(child: Child): void;
   abstract uploadPhoto(blob: Blob): Promise<{ src: string }>;
   protected async removePhotoAsset(_src: string): Promise<void> {}
+  getPageById(id: string): Page | undefined {
+    return this.getSnapshot().pages.find((page) => page.id === id);
+  }
   async loadPage(id: string): Promise<Page> {
     const page = this.getSnapshot().pages.find((item) => item.id === id);
     if (!page) throw new Error('페이지를 찾을 수 없어요.');
@@ -111,7 +115,9 @@
   updateEntry(entry: LegacyEntry): void {
     const data = this.getSnapshot();
     const authorId = noteAuthor(entry.authorId, data.members);
-    const id = entry.date + '__' + entry.childId + '__' + authorId;
+    const id = isValidPageId({ ...entry, authorId })
+      ? entry.id
+      : basePageId(entry.date, entry.childId, authorId);
     const page = data.pages.find((item) => item.id === id);
     this.savePage({
       ...page,
diff --git a/src/data/localStore.test.ts b/src/data/localStore.test.ts
index ff7912a470d2cc65be0d5a6ae6970cd167c23a28..ba7ac30e4f65b5e2dd70f668d8d45ea0e4d77526
--- a/src/data/localStore.test.ts
+++ b/src/data/localStore.test.ts
@@ -65,6 +65,35 @@
 });
 
 describe('page migration and local persistence', () => {
+  it('saves, reloads and independently updates additional same-day sheets', async () => {
+    const store = new LocalStore();
+    const first = migrateSnapshot(legacy()).pages[0];
+    const second = {
+      ...first,
+      id: first.id + '__abc12345',
+      text: '두 번째 장',
+      createdAt: '2026-10-26T05:00:00Z',
+    };
+    store.savePage(first);
+    store.savePage(second);
+    const loaded = new LocalStore();
+    expect(await loaded.loadPage(first.id)).toEqual(first);
+    expect(await loaded.loadPage(second.id)).toEqual(second);
+    loaded.savePage({ ...second, text: '두 번째 장 수정' });
+    expect(new LocalStore().getPageById(first.id)).toEqual(first);
+    expect(new LocalStore().getPageById(second.id)?.text).toBe(
+      '두 번째 장 수정',
+    );
+    expect(loaded.getPage(first.date, first.childId, first.authorId)?.id).toBe(
+      second.id,
+    );
+    loaded.updateEntry({
+      ...second,
+      content: '호환 경로 수정',
+    });
+    expect(loaded.getPageById(second.id)?.text).toBe('호환 경로 수정');
+    expect(loaded.getPageById(first.id)).toEqual(first);
+  });
   it('normalizes stored page and default child colors on load', () => {
     const data = migrateSnapshot(legacy());
     data.pages[0].color = '#0F4D3A';
diff --git a/src/data/localStore.ts b/src/data/localStore.ts
index 12680619118dcfaea6acc91957a09ed6514c27ba..eb37c8d5740b98661822f2666c16c3dbc28a1cf4
--- a/src/data/localStore.ts
+++ b/src/data/localStore.ts
@@ -3,6 +3,7 @@
 import { LegacyAdapter } from './legacyAdapter';
 import { defaultChildStatus, migrateSnapshot, type LegacySnapshot } from './migrate';
 import { preparePage } from '../lib/stroke';
+import { sheetsFor } from '../lib/pageId';
 import { downscalePhoto, blobToDataUrl } from '../lib/image';
 import type { DataStore } from './DataStore';
 import { seedChildren, seedMembers, seedTags } from './seed';
@@ -164,9 +165,7 @@
     childId: string,
     authorId = this.getCurrentMemberId() || 'dad',
   ): Page | undefined {
-    return this.snapshot.pages.find(
-      (page) => page.id === date + '__' + childId + '__' + authorId,
-    );
+    return sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
   }
 
   savePage(page: Page): void {
diff --git a/src/data/migrate.ts b/src/data/migrate.ts
index 85c598394abec3735d904cf7234107ba2124cdd8..f9fcd44cb1693aac5585d753846bf5b007d7f001
--- a/src/data/migrate.ts
+++ b/src/data/migrate.ts
@@ -1,4 +1,5 @@
 import { normalizePageColor } from '../lib/pageColors';
+import { basePageId } from '../lib/pageId';
 import type { LegacyEntry } from './legacyAdapter';
 import type {
   Child,
@@ -164,11 +165,11 @@
         a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
     );
     const owner = notes[0]?.authorId ?? 'dad';
-    owners.set(source.id, source.date + '__' + source.childId + '__' + owner);
+    owners.set(source.id, basePageId(source.date, source.childId, owner));
     for (const authorId of [
       ...new Set([owner, ...notes.map((note) => note.authorId)]),
     ]) {
-      const id = source.date + '__' + source.childId + '__' + authorId;
+      const id = basePageId(source.date, source.childId, authorId);
       const { notes: _, ...rest } = source;
       const value: Page = {
         ...rest,
diff --git a/src/data/supabaseStore.test.ts b/src/data/supabaseStore.test.ts
index 8d3a728323a7fc1e20faa3e6f6b2e7654c02f7ef..f213eb1ee70018b4adfa23c80647b6b27818009f
--- a/src/data/supabaseStore.test.ts
+++ b/src/data/supabaseStore.test.ts
@@ -103,6 +103,35 @@
 });
 afterEach(() => { stores.forEach((store) => store.dispose()); stores = []; vi.unstubAllGlobals(); });
 describe('family SupabaseStore', () => {
+  it('persists, reloads and updates same-day sheets independently by ID', async () => {
+    const server = fakeServer();
+    const store = create(server);
+    await ready(store);
+    const second = {
+      ...page,
+      id: page.id + '__abc12345',
+      text: '두 번째 장',
+      createdAt: '2026-10-26T01:00:00Z',
+    };
+    store.savePage(page);
+    store.savePage(second);
+    vi.stubGlobal('navigator', { onLine: true });
+    store.retry();
+    await vi.waitFor(() => expect(store.getStatus().pending).toBe(0));
+    store.dispose();
+    const loaded = create(server);
+    await ready(loaded);
+    expect(await loaded.loadPage(page.id)).toEqual(page);
+    expect(await loaded.loadPage(second.id)).toEqual(second);
+    expect(loaded.getPage(page.date, page.childId, page.authorId)?.id).toBe(
+      second.id,
+    );
+    loaded.savePage({ ...second, text: '두 번째 장 수정' });
+    await vi.waitFor(() => expect(loaded.getStatus().pending).toBe(0));
+    expect(server.rows.pages).toHaveLength(2);
+    expect(loaded.getPageById(page.id)).toEqual(page);
+    expect(loaded.getPageById(second.id)?.text).toBe('두 번째 장 수정');
+  });
   it('queues only the current member font and sends its storage path, including reset', async () => {
     const server = fakeServer();
     const store = create(server);
diff --git a/src/data/supabaseStore.ts b/src/data/supabaseStore.ts
index 8e7946188600aa4ea4e61091c345cefb1e259a94..3f1a707e942ff04b9d521a686e47a5a06e68ee06
--- a/src/data/supabaseStore.ts
+++ b/src/data/supabaseStore.ts
@@ -3,6 +3,7 @@
 import { externalizeSnapshot, hasInlinePhotos } from './importPhotos';
 import { LegacyAdapter } from './legacyAdapter';
 import { preparePage } from '../lib/stroke';
+import { sheetsFor } from '../lib/pageId';
 import { downscalePhoto } from '../lib/image';
 import { enterFamily, loadMembership, makeInvite, inviteRequired, inviteFailure, type FamilyMembership } from './familyAccess';
 import {
@@ -595,9 +596,7 @@
     childId: string,
     authorId = this.membership?.member_id === 'mom' ? 'mom' : 'dad',
   ): Page | undefined {
-    return this.snapshot.pages.find(
-      (page) => page.id === date + '__' + childId + '__' + authorId,
-    );
+    return sheetsFor(this.snapshot.pages, date, childId, authorId).slice(-1)[0];
   }
   savePage(page: Page): void {
     if (page.photos.some((photo) => photo.src.startsWith('data:')))
diff --git a/src/data/types.ts b/src/data/types.ts
index a565623240c4c75b5494dac7f23863356708bebe..896b815d2be90a47dea69f388e141a7902d88765
--- a/src/data/types.ts
+++ b/src/data/types.ts
@@ -85,6 +85,7 @@
   Page,
   'id' | 'date' | 'childId' | 'authorId' | 'color' | 'tagIds' | 'updatedAt'
 > & {
+  createdAt?: string;
   firstLine: string;
   hasDrawing: boolean;
   photoCount: number;
diff --git a/src/features/archive/ArchiveScreen.tsx b/src/features/archive/ArchiveScreen.tsx
index e39d2b46620c1ad951daa39d3ccc9e391033970f..69d2121e1459211fbfaf467ac4bf460162d45309
--- a/src/features/archive/ArchiveScreen.tsx
+++ b/src/features/archive/ArchiveScreen.tsx
@@ -14,7 +14,12 @@
 }: {
   store: DataStore;
   snapshot: StoreSnapshot;
-  openPage: (date: string, childId: string, authorId?: 'dad' | 'mom', pageId?: string) => void;
+  openPage: (
+    date: string,
+    childId: string,
+    authorId?: 'dad' | 'mom',
+    pageId?: string,
+  ) => void;
   onBack: () => void;
 }) {
   const [query, setQuery] = useState('');
@@ -86,7 +91,9 @@
                   key={page.id}
                   page={page}
                   child={child}
-                  onClick={() => openPage(page.date, page.childId, page.authorId, page.id)}
+                  onClick={() =>
+                    openPage(page.date, page.childId, page.authorId, page.id)
+                  }
                 />
               ) : (
                 <PageCard
diff --git a/src/features/calendar/CalendarScreen.tsx b/src/features/calendar/CalendarScreen.tsx
index a298e886e0c8f74a08ab3b455ac4ca0262141ebe..7281f7d98e5fc94f9e9895c09464b30602eafc49
--- a/src/features/calendar/CalendarScreen.tsx
+++ b/src/features/calendar/CalendarScreen.tsx
@@ -11,7 +11,12 @@
 type Props = {
   store: DataStore;
   snapshot: StoreSnapshot;
-  openPage: (date: string, childId: string, authorId?: 'dad' | 'mom', pageId?: string) => void;
+  openPage: (
+    date: string,
+    childId: string,
+    authorId?: 'dad' | 'mom',
+    pageId?: string,
+  ) => void;
   date: string;
   setDate: (date: string) => void;
 };
diff --git a/src/features/calendar/DayPreview.tsx b/src/features/calendar/DayPreview.tsx
index d513915a63454ba8e58922b3d3f7920ae909d160..f0d970b065c170ecbe3b5a06f67351aedbeb5382
--- a/src/features/calendar/DayPreview.tsx
+++ b/src/features/calendar/DayPreview.tsx
@@ -9,7 +9,12 @@
   store: DataStore;
   snapshot: StoreSnapshot;
   date: string;
-  openPage: (date: string, childId: string, authorId?: 'dad' | 'mom', pageId?: string) => void;
+  openPage: (
+    date: string,
+    childId: string,
+    authorId?: 'dad' | 'mom',
+    pageId?: string,
+  ) => void;
 };
 
 export function DayPreview({ store, snapshot, date, openPage }: Props) {
@@ -39,7 +44,9 @@
                   key={page?.id ?? child.id}
                   child={child}
                   page={page}
-                  onClick={() => openPage(date, child.id, page?.authorId, page?.id)}
+                  onClick={() =>
+                    openPage(date, child.id, page?.authorId, page?.id)
+                  }
                 />
               );
             }
diff --git a/src/features/page/PageScreen.tsx b/src/features/page/PageScreen.tsx
index ca12a5b57216a2324e49cfcc7497dac71bc0268f..8bd13c5acb580f6ccdbeae43468999303651ca8f
--- a/src/features/page/PageScreen.tsx
+++ b/src/features/page/PageScreen.tsx
@@ -13,6 +13,7 @@
 import { usePageColorStyle } from '../../lib/usePageColorStyle';
 import { noteAuthor } from '../../data/migrate';
 import { preparePage } from '../../lib/stroke';
+import { basePageId, newSheetId, sheetsFor } from '../../lib/pageId';
 import { BadgeSheet } from './BadgeSheet';
 import { CommentsSheet } from './CommentsSheet';
 import { DiarySheet } from './DiarySheet';
@@ -33,6 +34,8 @@
   child,
   date,
   authorId,
+  pageId,
+  onSheet,
   onAuthor,
   startEditing,
   origin,
@@ -45,6 +48,8 @@
   child: Child;
   date: string;
   authorId?: 'dad' | 'mom';
+  pageId?: string;
+  onSheet: (pageId: string) => void;
   onAuthor: (authorId: 'dad' | 'mom') => void;
   startEditing: boolean;
   origin?: PageOrigin;
@@ -53,15 +58,20 @@
   onSaved: (pageId: string) => void;
 }) {
   const [initial] = useState(() => {
-    const saved = store.getPage(date, child.id, authorId);
+    const author =
+      authorId ??
+      noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members);
+    const id =
+      pageId ??
+      sheetsFor(snapshot.pages, date, child.id, author).slice(-1)[0]?.id ??
+      basePageId(date, child.id, author);
+    const saved = store.getPageById(id);
     const now = new Date().toISOString();
     const blank: Page = {
-      id: `${date}__${child.id}__${authorId ?? noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members)}`,
+      id,
       childId: child.id,
       date,
-      authorId:
-        authorId ??
-        noteAuthor(store.getCurrentMemberId() || 'dad', snapshot.members),
+      authorId: author,
       drawing: [],
       photos: [],
       text: '',
@@ -71,15 +81,13 @@
     };
     return {
       saved: !!saved || snapshot.pages.some((page) => page.id === blank.id),
+      loading: !saved && snapshot.pages.some((page) => page.id === id),
       page: structuredClone(saved ?? blank),
     };
   });
   const [page, setPage] = useState(initial.page);
   const baseline = useRef(initial.page);
-  const [loading, setLoading] = useState(
-    !store.getPage(date, child.id, authorId) &&
-      snapshot.pages.some((page) => page.id === initial.page.id),
-  );
+  const [loading, setLoading] = useState(initial.loading);
   useEffect(() => {
     if (!loading) return;
     let active = true;
@@ -109,6 +117,11 @@
     ? undefined
     : noteAuthor(store.getCurrentMemberId(), snapshot.members);
   const ownPage = page.authorId === writer;
+  const savedSheets = sheetsFor(snapshot.pages, date, child.id, page.authorId);
+  const currentSaved = savedSheets.some((sheet) => sheet.id === page.id);
+  const sheets = currentSaved ? savedSheets : [...savedSheets, page];
+  const showSheetNumbers =
+    savedSheets.length >= 2 || (!currentSaved && !!pageId);
   const [drawing, setDrawing] = useState(false);
   const [sheet, setSheet] = useState<'badges' | 'palette' | 'comments'>();
   const [pending, setPending] = useState<() => void>();
@@ -298,6 +311,29 @@
             </button>
           ))}
         </div>
+        <div className="page-sheets" role="group" aria-label="이 날의 장">
+          {showSheetNumbers &&
+            sheets.map((sheet, index) => (
+              <button
+                key={sheet.id}
+                aria-label={`${index + 1}번째 장`}
+                aria-pressed={sheet.id === page.id}
+                onClick={() => navigate(() => onSheet(sheet.id))}
+              >
+                {index + 1}
+              </button>
+            ))}
+          {ownPage && !store.readOnly && currentSaved && (
+            <button
+              aria-label="한 장 더 쓰기"
+              onClick={() =>
+                navigate(() => onSheet(newSheetId(date, child.id, page.authorId)))
+              }
+            >
+              ＋
+            </button>
+          )}
+        </div>
         <DrawingArea
           page={{ ...page, color: page.color ?? child.pageColor }}
           store={store}
diff --git a/src/features/page/WritingArea.test.ts b/src/features/page/WritingArea.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..7629c239f60129b3e47aaeaa78dd5df75c13a981
--- /dev/null
+++ b/src/features/page/WritingArea.test.ts
@@ -0,0 +1,53 @@
+import { createElement } from 'react';
+import { renderToStaticMarkup } from 'react-dom/server';
+import { expect, it } from 'vitest';
+import type { Note } from '../../data/types';
+import { WritingArea } from './WritingArea';
+
+const note: Note = {
+  id: 'sheet',
+  authorId: 'mom',
+  text: '',
+  createdAt: '2026-11-02T00:00:00Z',
+  updatedAt: '2026-11-02T00:00:00Z',
+};
+
+it.each(['', ' \n '])('omits blank read-only paragraphs: %j', (text) => {
+  const html = renderToStaticMarkup(
+    createElement(WritingArea, {
+      name: '조이',
+      notes: [{ ...note, text }],
+      editing: false,
+      writer: 'dad',
+      onText: () => undefined,
+    }),
+  );
+  expect(html).not.toContain('<p');
+  expect(html).not.toContain('class="initial"');
+});
+
+it('renders saved writing with the author initial and keeps an empty own editor available', () => {
+  const html = renderToStaticMarkup(
+    createElement(WritingArea, {
+      name: '조이',
+      notes: [{ ...note, text: '오늘도 사랑해' }],
+      editing: false,
+      writer: 'dad',
+      onText: () => undefined,
+    }),
+  );
+  expect(html).toContain('class="note mom-writing"');
+  expect(html).toContain('오늘도 사랑해');
+  expect(html).toContain('class="initial">엄</span>');
+  const editor = renderToStaticMarkup(
+    createElement(WritingArea, {
+      name: '조이',
+      notes: [{ ...note, authorId: 'dad' }],
+      editing: true,
+      writer: 'dad',
+      onText: () => undefined,
+    }),
+  );
+  expect(editor).toContain('<textarea');
+  expect(editor).not.toContain('<p');
+});
diff --git a/src/features/page/WritingArea.tsx b/src/features/page/WritingArea.tsx
index ef273ae1617da347d1bc699fdc7b2e5bb8501f58..b2973236d4e292af8458feb9d94316cce8bb66ee
--- a/src/features/page/WritingArea.tsx
+++ b/src/features/page/WritingArea.tsx
@@ -15,12 +15,19 @@
   return (
     <section className="writing" aria-label={`${name}의 일기`}>
       <div className="notes">
-        {notes.filter((note) => !editing || note.id !== current?.id).map((note) => (
-          <p key={note.id} className={`note ${note.authorId}-writing`}>
-            {note.text}
-            <span className="initial">{note.authorId === 'dad' ? '아' : '엄'}</span>
-          </p>
-        ))}
+        {notes
+          .filter(
+            (note) =>
+              note.text.trim() && (!editing || note.id !== current?.id),
+          )
+          .map((note) => (
+            <p key={note.id} className={`note ${note.authorId}-writing`}>
+              {note.text}
+              <span className="initial">
+                {note.authorId === 'dad' ? '아' : '엄'}
+              </span>
+            </p>
+          ))}
         {editing && writer && (
           <div className="editable-note">
             <span className="initial">{writer === 'dad' ? '아' : '엄'}</span>
diff --git a/src/features/settings/bookExport.ts b/src/features/settings/bookExport.ts
index 18d005769dac657806ed49beb4341262f4ad212f..044dd9f237cfe1563c0d8b1b1dafef88168ef2ea
--- a/src/features/settings/bookExport.ts
+++ b/src/features/settings/bookExport.ts
@@ -1,9 +1,16 @@
 import type { DataStore } from '../../data/DataStore';
 import type { Page, StoreSnapshot } from '../../data/types';
 import { inkFor } from '../../lib/pageColors';
+import { sheetsFor } from '../../lib/pageId';
 import { downloadFile } from '../../lib/download';
 import { paintStroke } from '../page/strokes';
-import { BOOK, bookFilename, fitTextPages, wrapText } from './bookLayout';
+import {
+  BOOK,
+  bookFilename,
+  compareBookSheets,
+  fitTextPages,
+  wrapText,
+} from './bookLayout';
 import { loadPdf, loadZip } from '../../lib/loadExportLibs';
 
 export type BookOptions = {
@@ -167,7 +174,7 @@
         (!options.childId || page.childId === options.childId) &&
         (!options.authorId || page.authorId === options.authorId),
     )
-    .sort((a, b) => a.id.localeCompare(b.id));
+    .sort(compareBookSheets);
   if (!pages.length) throw new Error('선택한 기간에 기록이 없어요.');
   progress(0, pages.length);
   const fonts: FontFace[] = [];
@@ -253,6 +260,9 @@
             all.children.find((child) => child.id === page.childId)?.name ??
               page.childId,
             page.authorId === 'mom' ? '엄마' : '아빠',
+            sheetsFor(pages, page.date, page.childId, page.authorId).findIndex(
+              (sheet) => sheet.id === page.id,
+            ) + 1,
           );
           zip.file(
             pageIndex ? name.replace(/\.png$/, `_${pageIndex + 1}.png`) : name,
diff --git a/src/features/settings/bookLayout.test.ts b/src/features/settings/bookLayout.test.ts
index eb122956ac6cddebccf2fb463aac45f6ebe64562..afc7110044c3bb56e92ccd06c66c230539983672
--- a/src/features/settings/bookLayout.test.ts
+++ b/src/features/settings/bookLayout.test.ts
@@ -1,7 +1,36 @@
 import { describe, expect, it } from 'vitest';
-import { BOOK, bookFilename, fitTextPages, mmToPx, wrapText } from './bookLayout';
+import {
+  BOOK,
+  bookFilename,
+  compareBookSheets,
+  fitTextPages,
+  mmToPx,
+  wrapText,
+} from './bookLayout';
+import { page } from '../../data/testDb';
 
 describe('book layout', () => {
+  it('keeps same-day sheets in creation order and gives each image and continuation its own name', () => {
+    const first = page();
+    const second = {
+      ...first,
+      id: first.id + '__zzzzzzzz',
+      createdAt: '2026-10-26T04:00:00Z',
+    };
+    const third = {
+      ...second,
+      id: first.id + '__aaaaaaaa',
+      createdAt: '2026-10-26T05:00:00Z',
+    };
+    expect([third, second, first].sort(compareBookSheets)).toEqual([
+      first, second, third,
+    ]);
+    const names = [1, 2, 3].flatMap((number) => {
+      const name = bookFilename(first.date, '조비안', '아빠', number);
+      return [name, name.replace(/\.png$/, '_2.png')];
+    });
+    expect(new Set(names).size).toBe(6);
+  });
   it('rounds A5 millimetres to 300 dpi pixels', () => {
     expect(BOOK).toEqual({ width: 1748, height: 2480 });
     expect(mmToPx(25.4)).toBe(300);
diff --git a/src/features/settings/bookLayout.ts b/src/features/settings/bookLayout.ts
index 1d73521acbd3e3e9326c361384ced1e2b928c310..2be84f260cd676b5fcfbc484835d9a831e447d58
--- a/src/features/settings/bookLayout.ts
+++ b/src/features/settings/bookLayout.ts
@@ -1,3 +1,5 @@
+import type { Page } from '../../data/types';
+
 export const mmToPx = (mm: number, dpi = 300) => Math.round((mm / 25.4) * dpi);
 export const BOOK = { width: mmToPx(148), height: mmToPx(210) };
 
@@ -5,11 +7,12 @@
   date: string,
   child: string,
   author: string,
+  sheetNumber = 1,
 ): string {
   const safe = (value: string) =>
     value.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/[. ]+$/g, '') ||
     '이름없음';
-  return `${date}_${safe(child)}_${safe(author)}.png`;
+  return `${date}_${safe(child)}_${safe(author)}${sheetNumber > 1 ? `__장${sheetNumber}` : ''}.png`;
 }
 
 export function wrapText(
@@ -48,3 +51,13 @@
   }
   return { size, pages: pages.length ? pages : [[]] };
 }
+
+export function compareBookSheets(a: Page, b: Page): number {
+  return (
+    a.date.localeCompare(b.date) ||
+    a.childId.localeCompare(b.childId) ||
+    a.authorId.localeCompare(b.authorId) ||
+    a.createdAt.localeCompare(b.createdAt) ||
+    a.id.localeCompare(b.id)
+  );
+}
diff --git a/src/lib/datedArchive.mjs b/src/lib/datedArchive.mjs
index d6dd32321d4f90ea119a30b25981521b76a25a66..ab875f0569d6ad27155cd22f6945ef97986e9eec
--- a/src/lib/datedArchive.mjs
+++ b/src/lib/datedArchive.mjs
@@ -1,10 +1,17 @@
+function comparePages(a, b) {
+  return (
+    a.date.localeCompare(b.date) ||
+    a.childId.localeCompare(b.childId) ||
+    a.authorId.localeCompare(b.authorId) ||
+    a.createdAt.localeCompare(b.createdAt) ||
+    a.id.localeCompare(b.id)
+  );
+}
+
 export function toMarkdown(all, month) {
   const pages = all.pages
     .filter((page) => !month || page.date.startsWith(month))
-    .sort(
-      (a, b) =>
-        a.date.localeCompare(b.date) || a.childId.localeCompare(b.childId),
-    );
+    .sort(comparePages);
   const children = new Map(all.children.map((child) => [child.id, child.name]));
   const members = new Map(
     all.members.map((member) => [member.id, member.displayName]),
@@ -71,7 +78,7 @@
     const directory = 'diary/' + date.split('-').join('/');
     const pages = snapshot.pages
       .filter((page) => page.date === date)
-      .sort((a, b) => a.id.localeCompare(b.id));
+      .sort(comparePages);
     for (const page of pages)
       files.push({
         path:
@@ -80,6 +87,9 @@
           encodeURIComponent(page.childId) +
           '-' +
           page.authorId +
+          (page.id === `${page.date}__${page.childId}__${page.authorId}`
+            ? ''
+            : '--' + encodeURIComponent(page.id)) +
           '.json',
         content: JSON.stringify(page, null, 2),
       });
diff --git a/src/lib/exportFormat.test.ts b/src/lib/exportFormat.test.ts
index 784cf902cd7bc3b95314a2e919091f489be90d1e..fc24d4757df55e3b8896317b1264aea2f57da815
--- a/src/lib/exportFormat.test.ts
+++ b/src/lib/exportFormat.test.ts
@@ -1,5 +1,10 @@
 import { describe, expect, it } from 'vitest';
-import { fromBackupJson, toBackupJson, toMarkdown } from './exportFormat';
+import {
+  fromBackupJson,
+  toBackupJson,
+  toMarkdown,
+  toDatedArchive,
+} from './exportFormat';
 import { migrateSnapshot, type LegacySnapshot } from '../data/migrate';
 import { seedChildren, seedMembers, seedTags } from '../data/seed';
 
@@ -38,6 +43,49 @@
 ];
 
 describe('page exports', () => {
+  it('round-trips all same-day sheets with their own media, comments and reactions', () => {
+    const second = {
+      ...all.pages[0],
+      id: all.pages[0].id + '__abc12345',
+      text: '두 번째 장',
+      createdAt: '2026-10-26T01:00:00Z',
+    };
+    const data = {
+      ...all,
+      pages: [second, all.pages[0]],
+      comments: [
+        ...all.comments,
+        { ...all.comments[0], id: 'second-comment', pageId: second.id },
+      ],
+      reactions: [...all.reactions, { ...all.reactions[0], pageId: second.id }],
+    };
+    expect(fromBackupJson(toBackupJson(data))).toEqual(data);
+    expect(migrateSnapshot(data)).toEqual(data);
+    const files = toDatedArchive(data);
+    const json = files.filter((file) => file.path.endsWith('.json'));
+    expect(new Set(files.map((file) => file.path)).size).toBe(files.length);
+    expect(json.map((file) => JSON.parse(file.content))).toEqual([
+      all.pages[0], second,
+    ]);
+    const markdown = files.find((file) => file.path.endsWith('.md'))!.content;
+    expect(markdown.indexOf('첫 걸음')).toBeLessThan(markdown.indexOf('두 번째 장'));
+  });
+  it.each([
+    '2026-10-26__kid1__mom',
+    '2026-10-27__kid1__dad',
+    '2026-10-26__kid2__dad',
+    '2026-10-26__kid1__dad__1234567',
+    '2026-10-26__kid1__dad__123456789',
+    '2026-10-26__kid1__dad__ABC12345',
+    '2026-10-26__kid1__dad__abc12345__extra',
+  ])('rejects malformed or mismatched v3 sheet ID %s', (id) => {
+    expect(() =>
+      fromBackupJson({
+        ...toBackupJson(all),
+        pages: [{ ...all.pages[0], id }],
+      }),
+    ).toThrow();
+  });
   it('round-trips v3 including drawings, photos and activity', () => {
     const backup = toBackupJson(all);
     expect(backup.version).toBe(3);
diff --git a/src/lib/exportFormat.ts b/src/lib/exportFormat.ts
index 580b521cd97b9d598c2ba3343e908b435c7d6d18..310d396f34f82a3714de28d1724f30f26f633646
--- a/src/lib/exportFormat.ts
+++ b/src/lib/exportFormat.ts
@@ -1,5 +1,6 @@
 import { migrateSnapshot, type LegacySnapshot } from '../data/migrate';
 import type { StoreSnapshot } from '../data/types';
+import { isValidPageId } from './pageId';
 
 export type BackupJson = StoreSnapshot & { version: 3; exportedAt: string };
 
@@ -71,8 +72,7 @@
     data.version === 3 &&
     snapshot.pages.some(
       (page) =>
-        !['dad', 'mom'].includes(page.authorId) ||
-        page.id !== page.date + '__' + page.childId + '__' + page.authorId ||
+        !isValidPageId(page) ||
         typeof page.text !== 'string',
     )
   )
diff --git a/src/lib/pageId.test.ts b/src/lib/pageId.test.ts
new file mode 100644
index 0000000000000000000000000000000000000000..41fdd195c3ca42dad1c1f15fe95b3e82f2bb483f
--- /dev/null
+++ b/src/lib/pageId.test.ts
@@ -0,0 +1,85 @@
+import { describe, expect, it } from 'vitest';
+import { basePageId, isValidPageId, newSheetId, sheetsFor } from './pageId';
+import { preparePage } from './stroke';
+import type { Page } from '../data/types';
+
+const page: Page = {
+  id: '2026-11-02__kid1__dad',
+  date: '2026-11-02',
+  childId: 'kid1',
+  authorId: 'dad',
+  text: '첫 장',
+  drawing: [],
+  photos: [],
+  tagIds: [],
+  createdAt: '2026-11-02T00:00:00Z',
+  updatedAt: '2026-11-02T00:00:00Z',
+};
+
+describe('page IDs and sheet order', () => {
+  it('keeps first IDs and generates independent eight-character sheet suffixes', () => {
+    expect(basePageId(page.date, page.childId, page.authorId)).toBe(page.id);
+    const ids = new Set(
+      Array.from({ length: 100 }, () =>
+        newSheetId(page.date, page.childId, page.authorId),
+      ),
+    );
+    expect(ids.size).toBe(100);
+    for (const id of ids) {
+      expect(id).toMatch(/^2026-11-02__kid1__dad__[a-z0-9]{8}$/);
+      expect(isValidPageId({ ...page, id })).toBe(true);
+      expect(preparePage({ ...page, id }).id).toBe(id);
+    }
+    expect(isValidPageId(page)).toBe(true);
+  });
+
+  it.each([
+    '__abc1234',
+    '__abc123456',
+    '__ABC12345',
+    '__abc_1234',
+    '__abc-1234',
+    '__abc12345__extra',
+    '__abc12345\n',
+    '__',
+  ])('rejects malformed suffix %j', (suffix) => {
+    const invalid = { ...page, id: page.id + suffix };
+    expect(isValidPageId(invalid)).toBe(false);
+    expect(() => preparePage(invalid)).toThrow();
+  });
+
+  it('rejects IDs mismatching any identity field', () => {
+    expect(isValidPageId({ ...page, date: '2026-11-03' })).toBe(false);
+    expect(isValidPageId({ ...page, childId: 'kid2' })).toBe(false);
+    expect(isValidPageId({ ...page, authorId: 'mom' })).toBe(false);
+    expect(isValidPageId({ ...page, childId: '' })).toBe(false);
+  });
+
+  it('filters the exact day, child and parent and sorts by creation then ID without mutation', () => {
+    const second = {
+      ...page,
+      id: page.id + '__zzzzzzzz',
+      createdAt: '2026-11-02T01:00:00Z',
+    };
+    const third = {
+      ...second,
+      id: page.id + '__aaaaaaaa',
+      createdAt: '2026-11-02T02:00:00Z',
+    };
+    const tied = { ...third, id: page.id + '__bbbbbbbb' };
+    const pages = [
+      tied,
+      third,
+      second,
+      { ...page, updatedAt: '2026-11-03T00:00:00Z' },
+      { ...page, date: '2026-11-01' },
+      { ...page, childId: 'kid2' },
+      { ...page, authorId: 'mom' as const },
+    ];
+    const before = structuredClone(pages);
+    expect(
+      sheetsFor(pages, page.date, page.childId, page.authorId).map((p) => p.id),
+    ).toEqual([page.id, second.id, third.id, tied.id]);
+    expect(pages).toEqual(before);
+  });
+});
diff --git a/src/lib/pageId.ts b/src/lib/pageId.ts
new file mode 100644
index 0000000000000000000000000000000000000000..3d44116710f40c1752a86239aba3d758e6702c6a
--- /dev/null
+++ b/src/lib/pageId.ts
@@ -0,0 +1,66 @@
+import type { Page } from '../data/types';
+
+export function basePageId(
+  date: string,
+  childId: string,
+  authorId: Page['authorId'],
+): string {
+  return `${date}__${childId}__${authorId}`;
+}
+
+export function newSheetId(
+  date: string,
+  childId: string,
+  authorId: Page['authorId'],
+): string {
+  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
+  let suffix = '';
+  // Rejection sampling keeps all 36 characters equally likely.
+  while (suffix.length < 8) {
+    for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
+      if (byte < 252 && suffix.length < 8) suffix += alphabet[byte % 36];
+    }
+  }
+  return `${basePageId(date, childId, authorId)}__${suffix}`;
+}
+
+export function isValidPageId(
+  page: Pick<Page, 'id' | 'date' | 'childId' | 'authorId'>,
+): boolean {
+  if (
+    typeof page.id !== 'string' ||
+    typeof page.date !== 'string' ||
+    page.date.length !== 10 ||
+    !/^\d{4}-\d{2}-\d{2}$/.test(page.date) ||
+    typeof page.childId !== 'string' ||
+    !page.childId ||
+    !['dad', 'mom'].includes(page.authorId)
+  )
+    return false;
+  const base = basePageId(page.date, page.childId, page.authorId);
+  return (
+    page.id === base ||
+    (page.id.length === base.length + 10 &&
+      page.id.startsWith(base + '__') &&
+      /^[a-z0-9]{8}$/.test(page.id.slice(base.length + 2)))
+  );
+}
+
+export function sheetsFor(
+  pages: Page[],
+  date: string,
+  childId: string,
+  authorId: string,
+): Page[] {
+  return pages
+    .filter(
+      (page) =>
+        page.date === date &&
+        page.childId === childId &&
+        page.authorId === authorId,
+    )
+    .sort(
+      (a, b) =>
+        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
+    );
+}
diff --git a/src/lib/stroke.ts b/src/lib/stroke.ts
index eeb2602ccc92f797967bab59b66c64def8c1bafd..253c1de265e46f07018c76f5291876f44732f73c
--- a/src/lib/stroke.ts
+++ b/src/lib/stroke.ts
@@ -1,4 +1,5 @@
 import type { Page, Stroke } from '../data/types';
+import { isValidPageId } from './pageId';
 
 export function isStrokeWidth(width: unknown): width is Stroke['width'] {
   return [2, 5, 8, 14, 28].includes(width as number);
@@ -29,13 +30,11 @@
 }
 
 export function preparePage(page: Page): Page {
-  const id = page.date + '__' + page.childId + '__' + page.authorId;
-  if (!['dad', 'mom'].includes(page.authorId) || page.id !== id) {
+  if (!isValidPageId(page)) {
     throw new Error('페이지의 날짜, 아이와 작성자는 바꿀 수 없어요.');
   }
   const result = {
     ...page,
-    id,
     drawing: page.drawing.map((stroke) => {
       if (!isStrokeWidth(stroke.width)) {
         throw new Error('그림 도구의 굵기를 확인해 주세요.');
diff --git a/src/styles/app.css b/src/styles/app.css
index 04aa18bd154ce5eccb83359658fa4914663081a7..9654cc22dda57720d60b97215fc5893e5d6113cd
--- a/src/styles/app.css
+++ b/src/styles/app.css
@@ -8,6 +8,7 @@
 }
 body::before { content: ""; position: fixed; inset: 0 0 auto; height: env(safe-area-inset-top, 0px); z-index: 10; background: var(--bg); }
 button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
+input, textarea, select { color: inherit; }
 .artifact-welcome { min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px; padding: calc(24px + env(safe-area-inset-top)) 24px calc(24px + env(safe-area-inset-bottom)); background: var(--bg); }
 .artifact-welcome h2 { font-size: 22px; }
 .artifact-picker { display: flex; gap: 16px; width: 100%; max-width: 320px; }
@@ -187,10 +188,6 @@
 .action-sheet button:last-child { border-bottom: 0; color: var(--sub); }
 .action-sheet .danger { color: var(--kid1); }
 
-.notes { max-width: 1240px; margin: 40px auto 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
-.note { background: var(--card); border-radius: var(--r-card); padding: 18px; box-shadow: var(--shadow); font-size: 14px; }
-.note h4 { font-size: 15px; margin-bottom: 6px; }
-.note ul { padding-left: 18px; color: var(--sub); }
 .swatches { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
 .sw { width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--line); }
 
diff --git a/src/styles/page.css b/src/styles/page.css
index f30f5abb2d2e20133f2b3b3bf2a7d5b4d5f421a7..116ca25dfdce6572d1171a1fbd2a2bd386ba6d11
--- a/src/styles/page.css
+++ b/src/styles/page.css
@@ -227,11 +227,18 @@
   min-height: 176px;
 }
 
-.notes {
+.diary .notes {
+  display: block;
+  margin: 0;
   min-height: 140px;
 }
 
-.note {
+.diary .note {
+  background: none;
+  box-shadow: none;
+  border-radius: 0;
+  padding: 0;
+  font-size: 20px;
   margin-bottom: 14px;
   line-height: 35px;
   white-space: pre-wrap;
@@ -240,7 +247,7 @@
 
 .initial {
   margin-left: 7px;
-  opacity: 0.5;
+  opacity: 0.7;
   font-size: 13px;
 }
 
@@ -545,6 +552,33 @@
   gap: 8px;
   word-break: keep-all;
 }
+.diary .page-sheets {
+  display: flex;
+  flex: none;
+  height: 44px;
+  overflow-x: auto;
+  overflow-y: hidden;
+  scrollbar-width: none;
+  color: var(--page-ink);
+}
+.page-sheets::-webkit-scrollbar {
+  display: none;
+}
+.page-sheets button {
+  flex: 0 0 44px;
+  opacity: 0.7;
+}
+.page-sheets button:first-child {
+  margin-inline-start: auto;
+}
+.page-sheets button:last-child {
+  margin-inline-end: auto;
+}
+.page-sheets button[aria-pressed='true'] {
+  opacity: 1;
+  text-decoration: underline;
+  text-underline-offset: 4px;
+}
 .parent-pages button {
   min-height: 44px;
   padding: 2px 5px;
diff --git a/src/styles/tokens.css b/src/styles/tokens.css
index ef78879c69b0ec08ac3018f3aa658a2b2b9b7347..8524e9344622284da57edbccc696862aca9c36e8
--- a/src/styles/tokens.css
+++ b/src/styles/tokens.css
@@ -1,6 +1,7 @@
 
 /* ===== Design tokens ===== */
 :root {
+  color-scheme: light;
   --bg: #F6F5F2;
   --card: #FFFFFF;
   --surface: #FFFFFF;
@@ -35,6 +36,7 @@
 }
 @media (prefers-color-scheme: dark) {
   :root:not([data-theme="light"]) {
+    color-scheme: dark;
     --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
     --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
     --dad: #8AA6E3; --mom: #E39BB3;
@@ -47,6 +49,7 @@
   }
 }
 :root[data-theme="dark"] {
+  color-scheme: dark;
   --bg: #262638; --card: #31314A; --surface: #31314A; --field: #3B3B57; --text: #F1F0F7; --sub: #A9A8BE; --line: #46465F; --primary: #F1F0F7; --on-primary: #262638;
   --kid1: #F49A80; --kid1-soft: #3A2620; --kid2: #6CC6B4; --kid2-soft: #1E322D;
   --dad: #8AA6E3; --mom: #E39BB3;
diff --git a/supabase/migrations/20261102000000_multi_page_sheets.sql b/supabase/migrations/20261102000000_multi_page_sheets.sql
new file mode 100644
index 0000000000000000000000000000000000000000..ea1263db93249841da794becf3ab563ef443936e
--- /dev/null
+++ b/supabase/migrations/20261102000000_multi_page_sheets.sql
@@ -0,0 +1,34 @@
+begin;
+
+do $$
+declare
+  id_check text;
+  matches integer;
+begin
+  -- Locate the original unnamed ID check by its definition, not its generated name.
+  select count(*), min(conname::text)
+    into matches, id_check
+  from pg_constraint
+  where conrelid = 'public.pages'::regclass
+    and contype = 'c'
+    and regexp_replace(pg_get_constraintdef(oid), '[[:space:]()]', '', 'g') =
+      'CHECKid=date::text||''__''::text||child_id||''__''::text||author_id';
+
+  if matches <> 1 then
+    raise exception 'Expected exactly one original pages ID check, found %', matches;
+  end if;
+  execute format('alter table public.pages drop constraint %I', id_check);
+end $$;
+
+alter table public.pages add constraint pages_sheet_id_check check (
+  id = date::text || '__' || child_id || '__' || author_id
+  or (
+    length(id) = length(date::text || '__' || child_id || '__' || author_id) + 10
+    and left(id, length(date::text || '__' || child_id || '__' || author_id) + 2) =
+      date::text || '__' || child_id || '__' || author_id || '__'
+    and substring(id from length(date::text || '__' || child_id || '__' || author_id) + 3)
+      ~ '^[a-z0-9]{8}$'
+  )
+);
+
+commit;

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "npx.cmd tsc -b; git -c core.safecrlf=false diff --check; git -c core.safecrlf=false diff --numstat; Get-Content -Encoding UTF8 src/lib/pageId.ts; Get-Content -Encoding UTF8 AGENTS.md | Select-String -Pattern 'sheet-number|Page     '" in C:\Users\ajou\OneDrive\0. 개인정보\00. 주현♥\육아일기 앱
 succeeded in 4142ms:
3	3	AGENTS.md
28	0	scripts/backup/backup.check.mjs
12	3	src/App.tsx
1	0	src/data/DataStore.ts
39	0	src/data/artifactStore.test.ts
11	4	src/data/artifactStore.ts
7	1	src/data/legacyAdapter.ts
29	0	src/data/localStore.test.ts
2	3	src/data/localStore.ts
3	2	src/data/migrate.ts
29	0	src/data/supabaseStore.test.ts
2	3	src/data/supabaseStore.ts
1	0	src/data/types.ts
10	3	src/features/archive/ArchiveScreen.tsx
6	1	src/features/calendar/CalendarScreen.tsx
10	3	src/features/calendar/DayPreview.tsx
45	9	src/features/page/PageScreen.tsx
13	6	src/features/page/WritingArea.tsx
12	2	src/features/settings/bookExport.ts
30	1	src/features/settings/bookLayout.test.ts
14	1	src/features/settings/bookLayout.ts
15	5	src/lib/datedArchive.mjs
49	1	src/lib/exportFormat.test.ts
2	2	src/lib/exportFormat.ts
2	3	src/lib/stroke.ts
1	4	src/styles/app.css
37	3	src/styles/page.css
3	0	src/styles/tokens.css
import type { Page } from '../data/types';

export function basePageId(
  date: string,
  childId: string,
  authorId: Page['authorId'],
): string {
  return `${date}__${childId}__${authorId}`;
}

export function newSheetId(
  date: string,
  childId: string,
  authorId: Page['authorId'],
): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  // Rejection sampling keeps all 36 characters equally likely.
  while (suffix.length < 8) {
    for (const byte of crypto.getRandomValues(new Uint8Array(16))) {
      if (byte < 252 && suffix.length < 8) suffix += alphabet[byte % 36];
    }
  }
  return `${basePageId(date, childId, authorId)}__${suffix}`;
}

export function isValidPageId(
  page: Pick<Page, 'id' | 'date' | 'childId' | 'authorId'>,
): boolean {
  if (
    typeof page.id !== 'string' ||
    typeof page.date !== 'string' ||
    page.date.length !== 10 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(page.date) ||
    typeof page.childId !== 'string' ||
    !page.childId ||
    !['dad', 'mom'].includes(page.authorId)
  )
    return false;
  const base = basePageId(page.date, page.childId, page.authorId);
  return (
    page.id === base ||
    (page.id.length === base.length + 10 &&
      page.id.startsWith(base + '__') &&
      /^[a-z0-9]{8}$/.test(page.id.slice(base.length + 2)))
  );
}

export function sheetsFor(
  pages: Page[],
  date: string,
  childId: string,
  authorId: string,
): Page[] {
  return pages
    .filter(
      (page) =>
        page.date === date &&
        page.childId === childId &&
        page.authorId === authorId,
    )
    .sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    );
}

3. **Diary page** (one sheet for one child, one day, one parent): full-bleed page color, Gaegu handwriting, hand-drawn 
ink. NO visible borders/frames between the drawing and writing areas; the drawing area spans the full screen width edge
 to edge. ONLY: top bar (← back, date with ‹ ›, ONE badge icon), a small "엄마의 페이지 · 아빠의 페이지" switch (swipe or tap), a q
uiet fixed-height sheet-number row with ＋ to add a sheet when the current own sheet is saved, drawing, writing, bottom 
(💬 comments, big oval 저장/수정).
Page     { id: `${date}__${childId}__${authorId}` /* first sheet; additional sheets append __ + 8 random [a-z0-9] chara
cters */; childId; date: 'YYYY-MM-DD'; authorId: 'dad'|'mom';



codex
Phase 23 A/B 구현을 완료했습니다.

검증: TypeScript 통과, 전체 테스트 162개와 추가 회귀 테스트 3개 통과, 백업 테스트 3개 통과했습니다.

- **변경 파일:** `AGENTS.md`, `App.tsx`, 신규 `pageId.ts`, 저장소·페이지·목록·달력·내보내기 관련 코드와 테스트, CSS 3개, SQL 마이그레이션.
- **미완료 검증:** Vite 빌드는 sandbox 접근 오류로 실행되지 못했습니다. Vitest는 설정 번들링을 우회해 검증했습니다. SQL은 요청대로 실행하지 않았습니다.
- **리뷰어 확인:** SQL 적용, 기본 빌드·테스트 실행, 다크 모드 읽기 문단, 장 추가·전환 시 미저장 확인, 목록·달력의 정확한 장 열기, 백업·책 출력의 장별 보존과 순서를 확인해 주세요.
tokens used
150,339
Phase 23 A/B 구현을 완료했습니다.

검증: TypeScript 통과, 전체 테스트 162개와 추가 회귀 테스트 3개 통과, 백업 테스트 3개 통과했습니다.

- **변경 파일:** `AGENTS.md`, `App.tsx`, 신규 `pageId.ts`, 저장소·페이지·목록·달력·내보내기 관련 코드와 테스트, CSS 3개, SQL 마이그레이션.
- **미완료 검증:** Vite 빌드는 sandbox 접근 오류로 실행되지 못했습니다. Vitest는 설정 번들링을 우회해 검증했습니다. SQL은 요청대로 실행하지 않았습니다.
- **리뷰어 확인:** SQL 적용, 기본 빌드·테스트 실행, 다크 모드 읽기 문단, 장 추가·전환 시 미저장 확인, 목록·달력의 정확한 장 열기, 백업·책 출력의 장별 보존과 순서를 확인해 주세요.
