Phase 16 — artifact build for the new home/page. Read docs/artifact-build.md and vite.config.ts. Small changes only.
- Make sure the artifact fragment still has `<title>육아 기록</title>` first, the Gaegu Google Fonts link, inlined Pretendard, and no other external hosts. jspdf/jszip must be bundled into the fragment (dynamic imports inlined — vite-plugin-singlefile `inlineDynamicImports`), not loaded from a CDN.
- Report page.html size; if it exceeds 6 MB, explain what is largest.
- Update docs/artifact-build.md (capabilities unchanged: db, user, downloads, assets {upload: "interact"}).

Fix these review findings from phase 15 first:
- Drawing area is NOT full width: `.art` in src/styles/page.css has `aspect-ratio: 5 / 4` + `container-type: size` but no width, so it shrinks to ~104×94 px in the middle of a 375 px screen. Make `.art` span the full viewport width edge to edge (width: 100vw with `margin-inline: calc(50% - 50vw)` or remove the parent's side padding for it), keep the aspect ratio only as a height rule (height = min(width × 4/5, 60svh)), and size `.art-box`/canvases to it. Verify with getBoundingClientRect in a test-like check (width === viewport width at 375 px).
- Home face aria-label reads "조비안, , 최근 30일…" when there is no age label: join only non-empty parts.
- Book export aborts when a page's text is too long. Instead: shrink the text size step by step down to 80% of the base size; if it still overflows, continue the text on an extra page with the same page color and a small "(이어서)" mark. Never abort the whole export for one page. Add a test for the overflow split.
