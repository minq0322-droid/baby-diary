Phase 9 구현했습니다. Page 모델, 기존 데이터 마이그레이션, 사진 처리, 색상 일괄 변경, v2 백업을 추가했고 UI는 최소 어댑터만 수정했습니다.

- **변경 파일:** `src/data/*`, 이미지·스트로크·백업 유틸리티와 테스트, UI 어댑터, `002_pages.sql`, 자동 백업 스크립트, 설정 문서.
- **검증:** `tsc -b` 통과, 임시 native 설정으로 테스트 35개 통과. 빌드는 esbuild의 `Access is denied`로 차단됐습니다.
- **미검증:** 실제 Supabase SQL·Storage 권한과 게시된 Artifact 연동.
- **리뷰어 확인:** `002_pages.sql` 적용, 사진 업로드·서명 URL 갱신, 기존 데이터 변환, 색상 일괄 변경, 일반·Artifact 빌드.