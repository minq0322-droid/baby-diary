Design task — three NEW day-time (light theme) home concepts as static mockups. Do not touch src/ or app code. Read AGENTS.md (design spec #1) and look at docs/design/home-c1-moon.html and docs/design/home-c3-lantern.html for the current quality bar, structure and the face illustration (reuse the same baby face drawing / circular photo slot).

Output three self-contained files (inline CSS/JS/SVG, no external assets except Google Fonts Pretendard if needed), phone-first 375×812 but must also look good at 1280×800 (centered composition, no horizontal scroll):
1. docs/design/home-day-sunset.html — "노을 지는 언덕": warm orange→pink→lilac sunset sky, layered rolling hills (3–4 soft layers, slight parallax drift), the two kids' faces as setting suns resting just above the hill ridges with a soft glow. The 30 marks (last 30 days) = 30 small wildflowers along the ridge under/around each face: written day = bloomed flower (small petals), unwritten = tiny closed bud. A few dragonflies or birds glide slowly. Gentle warm light rays.
2. docs/design/home-day-balloon.html — "열기구 소풍": clear soft blue sky with drifting puffy clouds; each face is the envelope of a hot-air balloon (face in the balloon circle, small basket below), floating with a slow bob. The 30 marks = a garland of 30 small pennant flags hanging from the basket in a curve: written day = colored flag, unwritten = faint outline. Garlands of the two balloons must never overlap.
3. docs/design/home-day-dandelion.html — "민들레 들판": fresh green meadow with grass blades swaying; each face is a dandelion head, 30 seeds (pappus) around the face in a ring: written day = full fluffy seed, unwritten = thin faint stem only. Occasionally 1–2 seeds float away on the breeze (decorative, not the marks).

Common rules for all three:
- Two faces (kid1 page color #F4B9B8, kid2 #CDEFE2 as the face's halo/accent), NO names on screen; aria-label carries name + "최근 30일 중 N일 기록". Use sample data: kid1 written 18 of 30 days, kid2 7 of 30.
- Date at the top ("10월 27일"), small quiet icons at the bottom (목록 · 달력 · 설정) like home-c1-moon.html.
- Long-press a face shows "최근 30일 중 N일 기록" bubble (simple JS).
- Motion is subtle and slow; respect prefers-reduced-motion (static). Light theme only (these are day styles).
- Each file must work as a standalone page and be under 300 KB.
- Add a tiny label in the top-left corner of each mockup with the concept name in Korean (for review only).
End your reply with: files created, anything not done.
