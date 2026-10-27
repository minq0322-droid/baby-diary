Phase 2 — 오늘 screen. Read AGENTS.md. Match the "① 오늘" phone in docs/design/mockup.html exactly (markup classes, spacing, motion).

Build src/features/today/* and shared src/components/{Toast,ActionSheet}.tsx:
- Opens on todayKey(). Sticky date header: eyebrow ("오늘" or "N일 전/후" + 오늘로 pill), title formatHeader, ‹ › buttons, horizontal swipe (>60px) on the card area changes the day. Tapping the title opens a native date input (visually hidden `<input type="date">` + showPicker()) to jump to any date.
- One ChildCard per child (sortOrder): dot, name, ageLabel(child, date), count when >0, entries of that day (oldest first), Composer.
- Composer: auto-growing textarea, placeholder "{name}의 특이사항", ✓ button only with text, Enter saves (not during IME composition), Shift+Enter newline. TagChips row appears when the card is active; toggled chips use the tag tone colors. After save: clear text + tags, keep focus, new entry animates in. Author = current member.
- Entry tap → ActionSheet 수정 / 삭제 / 취소. 수정 = the entry turns into an inline textarea + chips with 저장/취소. 삭제 → removed immediately + Toast "기록을 삭제했어요 · 되돌리기" for 5s.
- Only one card is `.active` at a time; tapping outside deactivates.
- Empty day: just the empty composer, no message.
- Unsaved composer text is kept per child+date in sessionStorage (try/catch) so switching tabs/days does not lose it.
