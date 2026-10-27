Phase 22 구현 완료했습니다. 제목 제거, 기록일 색상 타일, 공통 목록 행과 보기 설정, 빈 기록 추가 행을 적용했습니다.

- **검증:** `npx.cmd tsc -b` 통과. Vitest `--configLoader runner`로 관련 테스트 9개 통과.
- **변경 파일:** calendar의 `CalendarScreen`, `MonthGrid`, `DayPreview`, `dayFill` 및 테스트; archive의 `ArchiveScreen`, `ArchiveListRow`, `archiveView` 및 테스트; `src/styles/app.css`.
- **미완료:** 연결 가능한 브라우저가 없어 실제 화면 검증은 미실시.
- **리뷰어 확인:** 375×812·1280×800 라이트/다크에서 색상 분할, 오늘·선택 테두리, 목록/카드 설정 공유, 선택한 작성자의 페이지 열기.