Phase 8 구현을 추가했습니다. `npx tsc -b`와 `git diff --check`는 통과했습니다.

- 변경 파일: ArtifactStore·테스트, API 타입 참조, 앱 진입점·사용자 선택, 설정·다운로드, 스타일, Vite·패키지 설정, 빌드 안내 문서.
- 미완료: 빌드와 Vitest가 esbuild의 `Access is denied`로 시작하지 못했습니다. 지침대로 우회하지 않았으며, **최종 HTML 크기는 측정하지 못했습니다.**
- 리뷰 확인: `npm test`, `npm run build:artifact` 실행 후 단일 HTML 크기, 외부 요청 없음, 부부 간 동기화와 읽기 전용 동작을 확인해 주세요.