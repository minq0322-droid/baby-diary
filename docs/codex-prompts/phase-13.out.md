Phase 13 구현했습니다. 타입 검사, 64개 테스트, PWA·Artifact 빌드가 통과했습니다(`--configLoader runner` 사용).

- 변경 파일: `src/data/*`, 백업·stroke 라이브러리, 백업 스크립트, 최소 UI 어댑터·재시도 배너, `004_author_pages.sql`.
- 미완료: 실제 Supabase 서버에 SQL 적용 및 RLS 통합 검증.
- 리뷰 확인: 저장 거부 후 기본색 변경·자동 재시도, 부모별 마이그레이션, 사진 이력 유지·삭제, v1/v2 복원과 날짜별 백업.