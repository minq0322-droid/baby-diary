Two variants of docs/design/home-c-floating.html. Copy it into two new files and change only what is described; keep everything else (starfield + shooting stars + 반짝임/사선 흐름 toggle, garden + fireflies in light mode, floating motion, crop flow, long-press bubble, accessibility, reduced motion, time-based loop). Do not touch src/ or the original file. Feedback that triggered this: "a sun in the night sky feels a bit odd".

1. `docs/design/home-c1-moon.html` — 낮엔 해, 밤엔 달
   - Light theme: unchanged sun with 30 rays.
   - Dark theme: each face becomes a moon — silvery-cool sphere shading over the photo (soft blue-white rim light, gentle shadow on the lower right, a faint crater-like texture overlay at very low opacity so the face stays clear), cool halo. Instead of rays: a crown of 30 small four-point stars on a ring just outside the face (same day order: today at 12 o'clock, clockwise into the past). Written day → bright twinkling star with a tiny glow; missing day → a faint dim dot. 30/30 → the moon's halo slowly breathes brighter.
   - Theme switch animates the change sun ↔ moon (crossfade ~600 ms).
2. `docs/design/home-c3-lantern.html` — 풍등
   - Light theme: same as C-1 light (sun with rays).
   - Dark theme: each face sits in a warm paper sky-lantern (풍등): tall rounded trapezoid shape, translucent warm paper with visible ribs, inner candle glow lighting the photo from below, the photo shown round in the lantern's center window. Lanterns rise and sway very slowly (they drift up a little and settle back, never leave the screen). Under each lantern hangs a short string of 30 tiny light beads in a gentle curve (left = 30 days ago, right = today; also say so in the aria/bubble text): written day → warm glowing bead, missing day → dark bead. 30/30 → the lantern glows brighter. A few distant tiny lanterns far in the background (no faces) for depth.
   - Theme switch crossfades lantern ↔ sun.
Update each file's title, header text and notes to describe its idea. End your reply with what you could not do.
