Phase 19 — change the home scene from the home itself, via an object that is part of the artwork. Read AGENTS.md (design spec #1). Phase 18 just landed (day styles 노을 언덕/민들레, night 달/풍등, livelier faces, drag & fling). Keep all of it. Touch only src/features/home/*, src/styles/home.css, the 설정 화면 section, AGENTS.md spec #1, tests.

## Scene switcher hidden in the artwork (no ordinary button)
- Each scene gets ONE small tappable object drawn in the scene's own art style, placed in the same region on every scene (upper-right area, below the date row, clear of both faces, their marks and the fling bounds' home positions; on PC keep it near the upper-right of the centered composition, not the far window edge):
  - 노을 언덕: a tiny house on a far hill with a warm lit window (window glows softly).
  - 민들레: a small ladybug resting on the tip of a grass blade (occasionally lifts a wing).
  - 달: one star slightly larger and warmer than the others, with a soft 4-point twinkle.
  - 풍등: one small distant lantern with a gentle flicker.
- The object itself is a real `<button>` (accessible name "장면 바꾸기", aria-haspopup, aria-expanded) with a ≥ 44×44px invisible hit area around the small drawing; visible focus ring for keyboard only. It must look like part of the scenery, not UI (no circle, no border, no label).
- Discoverability: for the first 3 home visits on this device (localStorage counter, try/catch), the object does one gentle shimmer ~1.5 s after the home appears. Reduced motion: no shimmer.
- Faces flung (phase 18) bounce off this object's area? No — faces just pass in front of it; the object is behind the faces (z-order) and is not a collision body.

## Picker
- Tapping the object opens a small translucent strip near the top (frosted, matches the scene: light glass by day, dark glass by night, rounded, no hard border), containing four round scene thumbnails grouped "낮" (노을 · 민들레) and "밤" (달 · 풍등), each with a tiny Korean caption, the current one marked (soft ring). Thumbnails are small SVG miniatures drawn in code (not screenshots).
- Choosing a thumbnail: sets the style preference (`day` or `night` in HomePreferences) AND sets the app theme to light (day scene) or dark (night scene) using the existing theme setting mechanism (the same one 설정 › 화면 uses for 라이트/다크), then the scene cross-fades (~400 ms; instant with reduced motion). Closes on choice, outside tap, Esc, or back.
- 설정 › 화면: keep 시스템/라이트/다크; REMOVE the 낮 모습 / 밤 모습 controls there (they now live on the home). Add one quiet hint line under 화면: "홈의 작은 집·무당벌레·별·풍등을 누르면 장면을 바꿀 수 있어요".
- No names on the home; tap/long-press/fling on faces unchanged; the switcher never steals a face gesture.

## Done
- `npx tsc -b` passes; tests for preference + theme mapping (pure function: chosen scene → {preferences, theme}), first-visits counter. Vite/vitest may fail in this sandbox — expected.
- Check at 375×812 and 1280×800, all four scenes.
- End with: files changed, anything not done, what the reviewer should check.
