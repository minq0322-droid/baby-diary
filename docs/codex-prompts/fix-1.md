Small fix in src/features/today/EntryList.tsx (read AGENTS.md only if needed). Double-tap-to-heart does not work:
- onClick opens the ActionSheet on the first tap, so a double tap opens the sheet instead of hearting.
- `let lastTap` is recreated on every render, so the touch double-tap never matches.
Replace onClick/onDoubleClick/onTouchEnd on the entry button with one onClick handler: keep a per-entry pending timer in a useRef Map; first click starts a 250ms timer that calls onOpen(entry); a second click within 250ms clears the timer and calls doubleTap(entry). Clear timers on unmount. Do the same anywhere else this pattern exists (grep for onDoubleClick). Nothing else.
