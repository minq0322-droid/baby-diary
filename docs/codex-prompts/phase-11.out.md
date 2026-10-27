Phase 11 일기 페이지를 구현했습니다. 작성자 선택, 그림·사진 편집, 배지·댓글, 저장·이탈 확인, 전환 애니메이션을 연결했습니다.

- **변경 파일:** `src/features/page/*`, `src/styles/page.css`, `App.tsx`, `StrokePreview.tsx`, `normalApp.tsx`, `app.css`. 기존 `PagePlaceholder.tsx` 삭제.
- **검증·미완료:** TypeScript와 핵심 로직 검증 통과. Vitest·Vite 빌드는 esbuild 접근 거부로 실행 불가. 실기기 시각 검증은 미완료이며 Artifact 폰트는 Phase 12 범위로 남겼습니다.
- **리뷰 확인:** 모바일 그림·사진 조작, 부모별 글 보존, 저장·날짜 이동 확인창, 댓글 한글 IME, 다크 모드와 모션 감소 설정.