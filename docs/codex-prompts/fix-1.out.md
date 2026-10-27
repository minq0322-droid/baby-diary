Updated [EntryList.tsx](/C:/Users/ajou/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/scratch-workspaces/466f5000-1e6c-4f1a-bc23-87c5136c9472/2f479da0-d026-4870-87a4-f1bad8f9e420/scratch-2026-10-26-e2f7f6/src/features/today/EntryList.tsx): entry clicks now use a per-entry 250 ms timer. A second click heart-reacts; a single click opens the action sheet after the timer. Timers are cleared on unmount.

Search found no other `onDoubleClick` entry patterns. I did not run tests.

- Files changed: `src/features/today/EntryList.tsx`
- Reviewer check: confirm single-click delay and double-click heart behavior on touch and desktop.