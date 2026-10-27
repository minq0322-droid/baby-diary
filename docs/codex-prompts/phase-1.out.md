Phase 1 scaffolding is in place: Vite, React, TypeScript, PWA configuration, the mockup styles with prenatal tokens, placeholder tabs, seed data, a local store, and date helpers with tests. PWA icons use SVG only.

- `npx tsc -b` passed.
- `npm run build` and `npm test` could not complete: Vite/esbuild failed to read `vite.config.ts`, reporting `Access is denied` for the current workspace path.

**Files changed:** `.gitignore`, `index.html`, package and TypeScript configs, `vite.config.ts`, `public/icon.svg`, `src/App.tsx`, `src/main.tsx`, `src/data/*`, `src/lib/date.ts`, `src/lib/date.test.ts`, `src/styles/*`.

**Not done:** PNG icon variants. The UI remains placeholders, as requested.

**Reviewer check:** rerun build and tests from a shorter workspace path to confirm Vite/esbuild can load the config.