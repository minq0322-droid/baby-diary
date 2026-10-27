Phase 3 달력·피드를 구현하고 Composer 포커스 문제를 수정했습니다. 기존 ChildCard·Composer를 재사용합니다.

- 변경: `calendar/*`, `BottomSheet.tsx`, `App.tsx`, 오늘 컴포넌트 연결부, `app.css`.
- 미검증: `tsc -b` 통과. Vitest·Vite build는 샌드박스 접근 오류로 실행 불가.
- 리뷰 확인: 모바일 스와이프·달력 접힘, 시트 드래그, 무한 스크롤, 태그 선택 후 한글 입력 유지.