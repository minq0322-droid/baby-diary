Phase 5 구현과 리뷰 수정 3건을 완료했습니다. 환경변수가 없으면 LocalStore로 실행됩니다. Supabase 연결은 시도하지 않았습니다.

- 변경 파일: SQL 마이그레이션, `supabaseStore.ts`와 테스트, 로그인 화면, Store 선택·타입·설정·CSS, `.env.example`, `docs/SETUP.md`.
- 검증: `npx.cmd tsc -b` 통과. Vitest·Vite build는 샌드박스의 `Access is denied`로 중단됐습니다.
- 미검증: 실제 로그인·RLS·실시간 동기화. 다른 가족의 댓글·하트가 포함된 새 기록 복원은 본인 권한 제한으로 차단합니다.
- 리뷰어 확인: 마이그레이션 적용, 두 계정 간 수정·삭제, reader 쓰기 차단, 오프라인 재시작 후 재전송.