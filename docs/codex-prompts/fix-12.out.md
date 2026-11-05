Fix 12 완료했습니다.

변경 파일:
- `src/normalApp.tsx`, `vite.config.ts`
- `src/lib/appUpdate.ts` 및 테스트
- `src/App.tsx`
- `src/features/page/PageScreen.tsx`
- `src/features/page/sheetAddState.ts` 및 테스트
- `src/styles/page.css`
- `AGENTS.md`

검증:
- `npx tsc -b` 통과
- Vitest는 sandbox의 esbuild `Access is denied`로 실행 불가
- Gaegu는 PWA에만 self-hosted 적용, Artifact Google Fonts는 유지
- `.note` 배경 규칙은 `.diary .note`에만 존재하며 외부 CSS 덮어쓰기는 확인되지 않음

미완료:
- 실제 브라우저/PWA 업데이트 동작 검증은 reviewer 환경에서 필요합니다.

Reviewer 확인:
- 날짜·부모·시트 전환 시 페이지 진입 애니메이션이 없는지
- `＋ 한 장 더`의 blank/save-first 동작
- 기존 설치 PWA의 업데이트 및 unsaved 편집 보호
- Gaegu 첫 입력 시 폰트 교체가 발생하지 않는지