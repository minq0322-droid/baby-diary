Phase 21 — scene switcher objects: better placement per scene, each gently animated, calmer night star. Read AGENTS.md (design spec #1). Phases 18–20 landed (scenes, wandering faces, switcher picker); keep all of it. Touch only src/features/home/*, src/styles/home.css, AGENTS.md spec #1, tests.

User feedback (screens at 375×812 and 1280×800):
- 노을 언덕: the small house floating in the upper-right sky looks random ("뜬금없다").
- The objects should all have living motion like the 민들레 ladybug on its drifting seed.
- 달: the special star is too loud / sticks out.

## Changes
1. Positions may now differ per scene (drop the "same region on every scene" rule). Each object sits where it naturally belongs in its artwork. Faces' wander steering keeps avoiding each object's own area; the button hit area (≥ 44×44, invisible) follows the object.
2. 노을 언덕: replace the house with a small setting sun half-sunk behind the far ridge — a warm disc cut off by the hill line (actually occluded by the ridge shape, not a semicircle floating in air), with a soft halo. Place it ON the farthest hill's ridge line, low in the scene (well below the date, roughly upper-middle third of the hills, toward the right), not in the open sky. It must not be confused with the faces (which are sun-like): make it clearly smaller (≈ 26–34 px disc on mobile), warmer/deeper orange-rose, partly hidden by the ridge. Motion: the halo slowly breathes (≈ 6 s), faint heat shimmer on the visible rim, and the disc very slowly sinks a couple of px and rises back (≈ 14 s loop).
3. 민들레: keep the ladybug on the drifting seed (already good). Its position may move a bit if that reads more natural.
4. 달: make the special star calm and in family with the other stars — only slightly larger than the biggest background stars, soft white with a hint of warmth (no saturated gold), thin 4-point glint at low opacity. Motion: slow twinkle (≈ 4–5 s, opacity/scale small range) and, every ~12 s, a brief soft glint flare. It should be findable on a second look, not the first thing the eye sees.
5. 풍등: the distant small lantern gently rises and sways (a few px, ≈ 8 s loop) with its existing flicker; keep it small and dim enough to read as far away.
6. Reduced motion: all objects static. First-3-visits shimmer stays.
7. Picker thumbnails: update the 노을 thumbnail if it shows the house.

## Done
- `npx tsc -b` passes; tests pass (update any position tests). Vite/vitest may fail in this sandbox — expected.
- Check at 375×812 and 1280×800, all four scenes.
- End with: files changed, anything not done, what the reviewer should check.
