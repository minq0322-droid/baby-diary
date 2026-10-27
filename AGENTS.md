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
1. **Home** = `docs/design/home-c1-moon.html` (night style 달) and `docs/design/home-c3-lantern.html` (night style 풍등); the user picks the night style on Home (default 달). Day (light theme): select 노을 언덕 (default, `docs/design/home-day-sunset.html`) or 민들레 (`docs/design/home-day-dandelion.html`) on Home. Sunset suns have 30 ridge wildflowers (bloom/bud), with periodic bird flocks; dandelion heads have 30 seeds (fluffy/faint), with drifting background seeds and soft meadow grass. Stems end above navigation. Night (dark theme): starfield with twinkle + shooting stars, faces as moons with a 30-star crown, or as sky-lanterns with 30 beads. The 30 marks = the last 30 days; a day counts as written if EITHER parent saved a page for that child. No names on the home; accessible labels carry name + summary. Long-press a face → "최근 30일 중 N일 기록". All four styles have calm X/Y drift and gentle tilt. After long-press, moving over 6px picks up the face and its marks; release flings it within safe scene bounds above navigation, with friction, edge/circle bounces and a spring home. A fling never opens a page. Reduced motion is static and drag returns directly home. Lanterns must not overlap each other's bead strings. Scene selection lives in one small artwork object at the upper-right of the centered composition below the date: sunset house with glowing window, dandelion ladybug on grass, moon warm four-point star, lantern distant flickering lantern. Each is an accessible button named 장면 바꾸기 with an invisible ≥44px hit area and keyboard-only focus ring, behind faces and never a collision body. First three device-local Home visits shimmer once after 1.5s (no reduced-motion animation). A frosted strip groups four SVG scene thumbnails under 낮/밤; choosing persists the corresponding HomePreferences style and explicit light/dark theme, crossfades for 400ms (instant with reduced motion), and closes. Outside tap, Esc and back also close it. 설정 › 화면 keeps only 시스템/라이트/다크 and the hint 홈의 작은 집·무당벌레·별·풍등을 누르면 장면을 바꿀 수 있어요.
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
