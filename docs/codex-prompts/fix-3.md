Fix in src/lib/pageColors.ts (+ any CSS that defines --palette-* dark variants). User feedback: in dark mode the default pages show as red (#8E5154) and green (#3F7868) instead of the pastel 벚꽃/박하 they chose. They want their chosen colors in dark mode too.

- Replace every dark variant with a gently dimmed version of the SAME color: mix the light color 90% with the dark shell background #262638 10% (compute the hex for each, write them into the table). 숲 and 밤 stay as they are.
- Ink: use the same rule as light mode (dark ink #1E2326 on all light colors, light ink #F5F0E1 on 숲/밤), and verify contrast ≥ 4.5:1 for every pair in a unit test (add a small luminance/contrast helper).
- Also apply to Palette swatches, kid cards, page cards and the diary page (they all go through pageColorStyle). Nothing else.
