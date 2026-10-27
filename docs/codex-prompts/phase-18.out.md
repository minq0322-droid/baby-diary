Phase 18 구현했습니다. 낮 스타일 2종, 새·씨앗 장식, 얼굴 움직임, 길게 눌러 드래그·던지기를 추가했습니다.

- 변경 파일: `src/features/home/*`, `src/styles/home.css`, `SettingsScreen.tsx`, `AGENTS.md`, 관련 테스트.
- 검증: `tsc -b` 통과, 임시 native-loader 구성으로 전체 108개 테스트 통과.
- 미확인: 샌드박스 권한 제한으로 실제 화면 검증.
- 리뷰 확인: 모바일·PC 목업 일치, 터치/마우스 던지기, 풍등 간격, 하단 아이콘·민들레 줄기, 모션 감소 동작.