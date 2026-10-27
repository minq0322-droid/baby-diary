# Artifact build (phase 8)

Phase 16: run `npx tsc -b`, `npm test`, then `npm run build:artifact`.
Publish `dist-artifact/page.html` as the Artifact fragment. Keep `index.html` for local inspection.
The normal `npm run build` still uses LocalStore or SupabaseStore and includes the PWA.

Declare the Artifact capabilities `db: {}`, `user: {}`, `downloads: {}`, and
`assets: { upload: "interact" }`.
After publishing, seed `meta/config` through Claude with the children, tags, and
dad/mom members from `src/data/seed.ts`, keyed by their IDs, and an empty
`memberByUser: {}`. The page never creates that configuration. With no
configuration it displays “기록장을 준비하고 있어요”. The first writable visit
asks the viewer to choose 아빠 or 엄마; this mapping can be changed under 설정 › 가족.

Artifact output sets `inlineDynamicImports: true`, bundling jspdf and jszip into the fragment. Keep <title>육아 기록</title> as the first fragment element, followed by the Gaegu Google Fonts stylesheet link. The HTML embeds the full Pretendard variable WOFF2 (2,057,688 source bytes), with variable weights 45–920. Gaegu is a Google Fonts stylesheet link immediately after the fragment title; fonts.googleapis.com is permitted by the Artifact CSP. Normal builds load Pretendard and Gaegu through stylesheet links. Artifact custom handwriting fonts and photos load only from URLs returned by the `assets` capability. Artifact mode disables external backup-status fetches as well as PWA registration, manifest output, and Supabase imports.

Reviewer checks:

- The output directory contains `index.html` and `page.html`; the fragment embeds JS, CSS, and font.
- Network inspection shows only the Google Fonts request and asset URLs returned by the `assets` capability.
- Two viewers see each other's pages, comments, and hearts; viewer mappings
  remain independent. A read-only viewer sees no composers or editing actions.
- Delete/undo restores replies and hearts. JSON restore groups writes by month
  and skips existing page IDs. JSON and Markdown use the platform save prompt.
- Run the month-document tests in `src/data/artifactStore.test.ts`.

In the supplied sandbox, esbuild may fail with “Access is denied” before Vite or
Vitest starts. AGENTS.md requires leaving this restriction in place; in that
case the final HTML size and runtime checks must be verified by the reviewer.

Phase 9 stores `pages`, `comments`, and `reactions` in `months/YYYY-MM`.
Existing entry documents migrate on the first writable load; the page structure
is written before old entries are tombstoned. Read-only visits project old data
without writes. Photo uploads use the assets capability after resizing to JPEG;
when the capability resolves null, resized data URLs are used instead.
