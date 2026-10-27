Phase 18 — new day home styles (노을 지는 언덕, 민들레 들판), livelier faces, drag-and-fling. Read AGENTS.md (design spec #1). Do only this; keep changes focused in src/features/home/*, src/styles/home.css, the 설정 home controls, AGENTS.md spec #1, and tests.

The user approved the mockups docs/design/home-day-sunset.html and docs/design/home-day-dandelion.html (read both fully; port their scenes faithfully into the app — same sky gradients, hill layers / meadow, 30-mark geometry, light). The 열기구 mockup is NOT used.

## 1. Day styles (light theme)
- REMOVE the current day scene (garden "숲" + fireflies, `gardenArt` in artwork.ts, firefly code in useScene, related CSS). Delete what becomes unused.
- Add day style preference to `HomePreferences`: `day: 'sunset' | 'dandelion'`, default `'sunset'`; old saved prefs without `day` → `'sunset'`. 설정 › 화면: next to "밤 모습 (달 · 풍등)" add "낮 모습 (노을 언덕 · 민들레)" with the same control style.
- 노을 지는 언덕 (sunset): faces are the setting suns above the ridges; 30 marks = wildflowers in an arc on the ridge under each face (bloomed = written day, bud = not written), exactly like the mockup. NEW: a flock of birds (7–15 small hand-drawn "v"/gull silhouettes in a loose V or wavy cluster, slight individual wing-flap and offset) crosses the sky behind the faces and in front of the far hills, periodically: one pass every ~18–30 s (randomized), taking ~10–14 s to cross, direction alternating or random, altitude varies within the upper sky. Low opacity dusk-purple.
- 민들레 들판 (dandelion): faces are dandelion heads on stems; 30 seeds around each face (full fluffy pappus = written, faint stalk = not written), as in the mockup. Fix from review: the lower face's stem must not run into the bottom icon bar (stems end in the meadow above the icons); the grass must read as soft grass blades, not spiky trees. NEW: background drifting seeds — smaller (about half the mockup size) and many more (~25–40 visible at once on a phone, scale with area on PC), drifting diagonally on the breeze with slight sway/rotation and varied depth (size/opacity), continuously. These are decoration only, behind the faces.
- Draw scene backgrounds efficiently: reuse the single canvas + one RAF clock in useScene (birds and seeds on canvas or lightweight SVG; no per-frame React renders). Pause when the tab is hidden. prefers-reduced-motion: static scene (no birds pass, seeds still).
- Keep the night styles (달, 풍등) as they are, including the natural starfield and shooting stars.
- PC layout from fix-11 must keep working (faces side by side on wide screens; scenes fill the window; no horizontal scroll).

## 2. Livelier faces (all four styles)
- The idle float of each face is currently too slow/small. Make it a little more lively: a smooth Lissajous-like drift in both X and Y (amplitude ≈ 6–10 px on phone, slightly more on PC; periods ≈ 3–5 s, different per face so they don't move in sync), plus a very gentle tilt (±2°). Their marks (rays/crown/beads/flowers/seeds) move with the face. Still calm, not bouncy. Reduced motion: static.
- Lantern bead strings must still never overlap.

## 3. Long-press drag and fling (all four styles)
- Current gestures stay: tap → open today's page; long-press (no movement) → the "최근 30일 중 N일 기록" bubble / existing long-press menu.
- NEW: after the long-press threshold, if the finger/mouse then moves > 6 px, the face is "picked up" (slight scale-up 1.06 + soft shadow, bubble/menu suppressed) and follows the pointer. On release it is flung with the release velocity (track last ~80 ms of pointer samples) and bounces off the screen edges (scene bounds, minus safe-area and the bottom icon bar) with restitution ≈ 0.6 and friction; it may also bounce off the other face (simple circle–circle collision). When nearly stopped (or after ~2.5 s), it springs smoothly back to its home position. A fling never opens the page. Faces stay fully on screen. Its 30 marks travel with it.
- Physics in a small pure module (e.g. src/features/home/fling.ts: step(state, dt, bounds, other) → state) with vitest tests (edge bounce reverses velocity with restitution, friction slows to rest, return-home spring converges, collision separates circles).
- Mouse works the same on PC (press-hold then drag). Touch: prevent page scroll while dragging (touch-action none on the face during drag only). Keyboard users unaffected. Reduced motion: no fling (drag ends with a direct return home, no bounce).

## Done
- `npx tsc -b` passes; tests added/updated; existing tests pass. Vite/vitest may fail in this sandbox — expected.
- Update AGENTS.md spec #1 (day styles 노을 언덕/민들레 selectable in 설정, default 노을 언덕; drag & fling).
- End with: files changed, anything not done, what the reviewer should check.
