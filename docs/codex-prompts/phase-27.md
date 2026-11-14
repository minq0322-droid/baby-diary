Phase 27 — usability clean-up from the 2026-11-14 review. Read AGENTS.md ("Design specs", "Definition of done") and `docs/design/ux-20261114/steps.md` §0 (the numbered findings). Design: `docs/design/ux-20261114/index.html` screens 2–3. Read only the files you change. Do not touch Home scenes or data stores. Run after phases 24–26.

## Fix (numbers = steps.md §0)
1. (#1) Drawing toolbar `완료` → `그리기 끝`, shown as a dark filled pill at the right end so it is not mistaken for 저장. While drawing, the writing area stays visible below the toolbar (scroll if needed) instead of disappearing (#4).
2. (#3) The writing textarea shows no rectangle border or outline when focused — caret only (keep a visible focus indicator for keyboard users only via `:focus-visible` as a soft underline in ink at 30%).
3. (#5) Page top bar: left round glass button `‹ <origin>` (`홈` or `기록` or `달력`, whichever opened the page; 44 high), date with ‹ › in the centre, badge on the right. Round buttons on the paper are translucent white (35%) with ink icons.
4. (#8) 달력 and 설정 get the same top bar as 기록: left `‹ 홈`, centre title, and the floating icon-only tab capsule from phase 26.
5. (#9) Calendar: today = filled circle in primary at 36px behind the number; selected day = 2px ring; never both a heavy border and a dashed focus ring at once (focus ring only on `:focus-visible`).
6. (#10) Settings file inputs (글씨체 아빠/엄마, 백업 가져오기): hide the native `<input type=file>` (visually hidden, still focusable via its label) and show a round pill button `파일 고르기` (or `바꾸기` when a file is set) on the row's right; the row's sub line shows the chosen file name or `기본 손글씨`. No truncated `선… 없음`.
7. Settings rows follow HOUSE grouped lists: row min-height 52, title 16/500, sub 13 muted, separators start at the text's left edge (16) not the card edge.

Plain CSS, tokens only, light + dark, reduced motion, safe areas, 44px targets. Keep components small; no new dependencies.

Done report → `docs/codex-prompts/phase-27.out.md`. No commit/push/deploy.
