Phase 7 구현 완료했습니다.

- 댓글 인라인 표시·작성·수정·삭제
- 하트 토글, 더블탭 하트, 하트한 가족 이름 표시
- Feed 댓글 접기 및 전체 보기
- 댓글/하트 액션시트 추가
- 상대시간 포맷 및 테스트 추가
- 날짜별 새 활동 표시
- Supabase entries update/delete 정책 복구
- 백업 workflow를 `app/`·`out/` 구조로 수정하고 orphan 첫 실행 지원

검증:

- `npx tsc -b` 통과
- Vitest는 sandbox의 esbuild `Access is denied`로 실행 불가

변경 파일: `.github/workflows/backup.yml`, `supabase/migrations/001_init.sql`, 댓글/하트 관련 Today·Calendar 컴포넌트, `src/lib/date.ts`, 테스트, CSS.

리뷰어 확인 사항: 모바일에서 댓글 작성/취소, 더블탭 하트, 본인 댓글 수정·삭제, 백업 workflow의 첫 `backups` 브랜치 실행을 확인해 주세요.