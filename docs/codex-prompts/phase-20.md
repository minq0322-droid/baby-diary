Phase 20 — the kids' faces wander the whole home screen, and the scene switcher is easier to find. Read AGENTS.md (design spec #1). Phases 18–19 landed; keep all of it (scenes, marks, long-press, drag & fling, switcher). Touch only src/features/home/*, src/styles/home.css, AGENTS.md spec #1, tests. Another change is editing src/features/page/* and src/styles/page.css at the same time — do not touch those.

## 1. Faces float across the whole screen (user request; current drift is only 8–12 px, which reads as "not moving")
- Each face (with its marks: wildflowers / seeds / star crown / lantern + beads, and its stem where the scene has one) slowly wanders around the WHOLE safe scene area (the same safe bounds the fling already uses: below the date row, above the bottom navigation, inside the left/right edges), not just around its home spot.
- Motion: smooth and calm, like floating — a slowly changing target point inside the bounds, eased (e.g. speed ≈ 12–20 px/s on mobile, a little faster on PC; gentle curving paths, no straight-line ping-pong, no sudden turns). Keep the existing small tilt/bob on top.
- The two faces never overlap: soft repulsion between them (and lantern bead strings must not overlap, as before). They also drift around (do not sit on) the date and the bottom icons.
- Scenes with ground-rooted stems (민들레 stems, 노을 언덕 ridge flowers): choose what looks natural — for 민들레 the stem bends/stretches to follow the head from a fixed root on the ground; for 노을 언덕 the face (sun) floats freely and its 30 ridge flowers stay on the hill directly below it, sliding along the ridge as it moves horizontally. Night scenes (달/풍등) float freely with their crown/beads.
- Interaction unchanged: tap opens the page, long-press shows the count, long-press + move picks up and flings. After a fling settles, wandering resumes from where it stopped (no spring back to a fixed home). Tapping must still work while it moves (hit area follows the face).
- Wandering pauses while the page is hidden (visibilitychange) and for prefers-reduced-motion (then faces stay at their home spots, static).
- Performance: one rAF loop, transforms only (no layout thrash), fine on a mid-range phone.

## 2. Scene switcher object is too hard to notice (user could not find it)
- Make the object about 1.5× its current drawn size and a bit more contrasty against each scene (house window glow brighter, ladybug red stronger, the special star larger/brighter, distant lantern brighter), still clearly part of the artwork (no label, no circle/border).
- Faces wander in front of it (z-order) but should prefer to steer away from its area so it is rarely covered.
- Keep the first-3-visits shimmer.

## Done
- `npx tsc -b` passes; add pure-function tests for the wander target/bounds logic and the face–face separation. Vite/vitest may fail in this sandbox — expected.
- Check at 375×812 and 1280×800, all four scenes.
- End with: files changed, anything not done, what the reviewer should check.
