Phase 2 오늘 화면 구현 완료했습니다.

- 오늘 날짜 헤더, 날짜 이동/스와이프, date picker
- 자녀별 카드, 나이/기록 수, Composer, 태그 칩
- 세션 draft 보존, IME 입력 처리, Enter 저장
- 기록 수정/삭제 ActionSheet
- 5초 되돌리기 Toast
- mockup 클래스 기반 스타일 및 애니메이션 적용
- 오늘 탭 App 연결

변경 파일:
- `src/App.tsx`
- `src/styles/app.css`
- `src/components/Toast.tsx`
- `src/components/ActionSheet.tsx`
- `src/features/today/*`

검증:
- `npx tsc -b` 통과
- Vitest는 sandbox의 esbuild `Access is denied`로 실행 실패

미완료:
- 달력/설정 탭은 기존 placeholder 상태입니다.

리뷰 시 오늘 화면의 날짜 이동, draft 복원, 편집/삭제/되돌리기 동작을 확인해 주세요.