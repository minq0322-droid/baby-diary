요청한 변경은 **미완료**입니다. 날짜 계산 함수와 테스트, 일기 헤더·홈 접근성 라벨·목록 카드의 날짜 표시를 반영했습니다. 트레이 레이아웃도 CSS를 수정했지만, 설정의 ‘아직 미정’ 토글과 긴 누름 말풍선은 반영하지 못했습니다.

검증도 실행하지 못했습니다. 작업 중 파일 인코딩 문제가 발생해 CSS는 원본을 복구한 뒤 수정했지만, 전체 변경 상태를 검토하지 못했습니다. 리뷰 전에 변경분과 인코딩 상태를 확인해 주세요.

**변경 파일:** `src/lib/date.ts`, `src/lib/date.test.ts`, `src/features/page/PageScreen.tsx`, `src/features/home/HomeFace.tsx`, `src/features/archive/KidCard.tsx`, `src/styles/page.css`

**리뷰 확인 사항:** 짧은 화면에서 캔버스와 도구 트레이가 겹치지 않는지, 설정에서 예정일을 비울 수 있는지, TypeScript 검사가 통과하는지.