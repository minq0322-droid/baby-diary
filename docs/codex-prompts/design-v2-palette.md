Small change to docs/design/mockup-v2.html only: replace the 8-color page palette with these 16 crayon colors (attached refs show the feel the user wants: flat, slightly muted, friendly). Show them in the picker as two rows of 8 hand-drawn blobs, Korean names under each.

Light row: 벚꽃 #F4B9B8 · 살구 #FFCBA4 · 레몬 #FFEB8A · 박하 #CDEFE2 · 연두 #CFE6A0 · 하늘 #A9D8F5 · 라일락 #D8CBF3 · 종이 #F4EBDD
Bold row: 귤 #F59157 · 토마토 #EE6A5A · 개나리 #FFD23F · 민트 #8FDCC2 · 파랑 #7CC7F5 · 라벤더 #B8A4F2 · 숲 #0F4D3A · 밤 #2E3550

- Ink stays automatic: light ink only on 숲 and 밤 (and any color whose dark ink contrast < 4.5:1 — compute it, don't guess).
- Dark-mode variants: derive each one the same way as the existing ones (deeper, still colorful, never near-black), keep text ≥ 4.5:1 with its ink.
- Update the sample pages to use the new colors: 조비안 today = 벚꽃, 또이 today = 박하, another sample page = 귤.
- Update the tokens list in the notes section. Nothing else.
