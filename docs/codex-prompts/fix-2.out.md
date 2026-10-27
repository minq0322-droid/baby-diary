Implemented the phase 8 changes:

- The artifact build now writes `dist-artifact/page.html` as a fragment and keeps `index.html`. The fragment includes the title, theme color, styles, root element, and module scripts in order. The docs now say to publish `page.html`.
- Artifact mode embeds the Pretendard variable font, with weights `45 920`. Its source file is **2,057,688 bytes**.
- Added the artifact root class and safe-area CSS adjustments.

I couldn’t run `npx tsc -b`: PowerShell blocked `npx.ps1` under its execution policy. The build output and fragment still need reviewer verification.

Files changed: `vite.config.ts`, `src/main.tsx`, `src/styles/app.css`, `docs/artifact-build.md`.