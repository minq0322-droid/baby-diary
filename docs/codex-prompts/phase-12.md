Phase 12 — artifact build for v3. Read docs/artifact-build.md and vite.config.ts. Small changes only.

- Gaegu in artifact mode: keep it as a Google Fonts `<link>` (fonts.googleapis.com is allowed by the artifact CSP) placed in the fragment right after `<title>`; Pretendard stays inlined. Normal builds: both via links.
- Custom handwriting fonts and photos load from asset URLs returned by the `assets` capability — make sure nothing in artifact mode fetches any other host.
- Update docs/artifact-build.md: capabilities to declare are now `db`, `user`, `downloads`, and `assets` with `{ upload: "interact" }`.
- Report the page.html size.

Also fix these review findings from phase 11 (do first):
- src/features/page/PageScreen.tsx `exit()`: navigation runs only after `animation.finished` resolves, and `.catch(() => {})` swallows cancellation, so 저장/← can get stuck on the page (it did in review: data saved, screen never returned Home). Always run the action exactly once: on finish, on cancel/reject, or after a 400 ms timeout fallback, whichever comes first; with prefers-reduced-motion skip the animation and run it immediately. Same for the open animation if it gates anything.
- Korean particle: the writing placeholder shows "오늘 또이은…". Add `lib/josa.ts` `topic(name)` → "또이는" / "조비안은" (choose 은/는 by the last syllable's final consonant, Hangul only; fallback "은(는)"), use it everywhere a name is followed by 은/는, 이/가 or 을/를 (add `subject()` and `object()` too), with tests.
- Comments sheet copy must use the user's words: title "댓글", input placeholder "댓글 남기기", empty state "첫 댓글을 남겨 보세요", submit "등록".
